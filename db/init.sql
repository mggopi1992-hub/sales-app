-- ============ TABLES ============
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','employee')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE otps (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sales_uploads (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  sales_date DATE NOT NULL,
  row_count INT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, file_name)
);

CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  upload_id INT NOT NULL REFERENCES sales_uploads(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cust_id TEXT NOT NULL,
  cust_name TEXT NOT NULL,
  order_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  order_date DATE NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  is_delivered BOOLEAN NOT NULL,
  total NUMERIC(14,2) GENERATED ALWAYS AS (quantity * price) STORED
);
CREATE INDEX idx_sales_date ON sales(order_date);
CREATE INDEX idx_sales_user ON sales(user_id);

-- ============ AUTH PROCEDURES ============
CREATE FUNCTION sp_register_user(p_name TEXT, p_email TEXT, p_hash TEXT, p_role TEXT DEFAULT 'employee')
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_id INT;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = lower(p_email)) THEN
    RAISE EXCEPTION 'EMAIL_EXISTS';
  END IF;
  INSERT INTO users(name, email, password_hash, role)
  VALUES (trim(p_name), lower(p_email), p_hash, p_role) RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id, 'email', lower(p_email));
END $$;

CREATE FUNCTION sp_seed_admin(p_name TEXT, p_email TEXT, p_hash TEXT)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO users(name, email, password_hash, role, is_verified)
  VALUES (p_name, lower(p_email), p_hash, 'admin', true)
  ON CONFLICT (email) DO NOTHING;
$$;

CREATE FUNCTION sp_get_user_by_email(p_email TEXT)
RETURNS SETOF users LANGUAGE sql STABLE AS $$
  SELECT * FROM users WHERE email = lower(p_email);
$$;

CREATE FUNCTION sp_create_otp(p_user_id INT, p_hash TEXT, p_ttl_minutes INT DEFAULT 5)
RETURNS timestamptz LANGUAGE plpgsql AS $$
DECLARE v_exp timestamptz := now() + make_interval(mins => p_ttl_minutes);
BEGIN
  UPDATE otps SET used = true WHERE user_id = p_user_id AND NOT used;   -- invalidate old codes
  INSERT INTO otps(user_id, code_hash, expires_at) VALUES (p_user_id, p_hash, v_exp);
  RETURN v_exp;
END $$;

-- returns {status: ok|invalid|expired|locked, user?}
CREATE FUNCTION sp_verify_otp(p_email TEXT, p_hash TEXT)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE u users%ROWTYPE; o otps%ROWTYPE;
BEGIN
  SELECT * INTO u FROM users WHERE email = lower(p_email) AND is_active;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','invalid'); END IF;

  SELECT * INTO o FROM otps WHERE user_id = u.id AND NOT used ORDER BY id DESC LIMIT 1;
  IF NOT FOUND OR o.expires_at < now() THEN RETURN jsonb_build_object('status','expired'); END IF;
  IF o.attempts >= 5 THEN RETURN jsonb_build_object('status','locked'); END IF;

  IF o.code_hash <> p_hash THEN
    UPDATE otps SET attempts = attempts + 1 WHERE id = o.id;
    RETURN jsonb_build_object('status','invalid');
  END IF;

  UPDATE otps SET used = true WHERE id = o.id;
  UPDATE users SET is_verified = true WHERE id = u.id;
  RETURN jsonb_build_object('status','ok',
    'user', jsonb_build_object('id',u.id,'name',u.name,'email',u.email,'role',u.role));
END $$;

-- ============ SALES PROCEDURES ============
-- p_file_name must look like arul_20261011.txt ; p_rows is a JSON array parsed from the CSV
CREATE FUNCTION sp_import_sales(p_user_id INT, p_file_name TEXT, p_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_date DATE; v_upload INT; v_count INT;
BEGIN
  IF p_file_name !~ '^[a-z0-9]+_[0-9]{8}\.txt$' THEN RAISE EXCEPTION 'INVALID_FILE_NAME'; END IF;
  v_date := to_date(substring(p_file_name FROM '_([0-9]{8})\.txt$'), 'YYYYMMDD');
  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN RAISE EXCEPTION 'EMPTY_FILE'; END IF;
  IF EXISTS (SELECT 1 FROM sales_uploads WHERE user_id = p_user_id AND file_name = p_file_name) THEN
    RAISE EXCEPTION 'DUPLICATE_FILE';
  END IF;

  INSERT INTO sales_uploads(user_id, file_name, sales_date, row_count)
  VALUES (p_user_id, p_file_name, v_date, jsonb_array_length(p_rows)) RETURNING id INTO v_upload;

  INSERT INTO sales(upload_id, user_id, cust_id, cust_name, order_id, item_name, order_date, quantity, price, is_delivered)
  SELECT v_upload, p_user_id, r.cust_id, r.cust_name, r.order_id, r.item_name, r.order_date, r.quantity, r.price, r.is_delivered
  FROM jsonb_to_recordset(p_rows) AS r(cust_id TEXT, cust_name TEXT, order_id TEXT, item_name TEXT,
                                       order_date DATE, quantity INT, price NUMERIC, is_delivered BOOLEAN);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('file_name', p_file_name, 'inserted', v_count);
END $$;

-- p_user_id NULL = all employees (admin)
CREATE FUNCTION sp_get_sales(p_user_id INT, p_from DATE, p_to DATE)
RETURNS TABLE (id BIGINT, user_id INT, employee TEXT, cust_id TEXT, cust_name TEXT, order_id TEXT,
               item_name TEXT, order_date DATE, quantity INT, price NUMERIC, total NUMERIC, is_delivered BOOLEAN)
LANGUAGE sql STABLE AS $$
  SELECT s.id, s.user_id, u.name, s.cust_id, s.cust_name, s.order_id, s.item_name,
         s.order_date, s.quantity, s.price, s.total, s.is_delivered
  FROM sales s JOIN users u ON u.id = s.user_id
  WHERE (p_user_id IS NULL OR s.user_id = p_user_id)
    AND (p_from IS NULL OR s.order_date >= p_from)
    AND (p_to   IS NULL OR s.order_date <= p_to)
  ORDER BY s.order_date DESC, s.id DESC
  LIMIT 1000;
$$;

CREATE FUNCTION sp_my_uploads(p_user_id INT)
RETURNS SETOF sales_uploads LANGUAGE sql STABLE AS $$
  SELECT * FROM sales_uploads WHERE user_id = p_user_id ORDER BY uploaded_at DESC LIMIT 100;
$$;

-- p_period: daily | weekly | monthly
CREATE FUNCTION sp_admin_sales_summary(p_period TEXT, p_from DATE, p_to DATE)
RETURNS TABLE (period DATE, orders BIGINT, units BIGINT, revenue NUMERIC, delivered_revenue NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT date_trunc(CASE p_period WHEN 'daily' THEN 'day' WHEN 'weekly' THEN 'week' WHEN 'monthly' THEN 'month' END,
                    s.order_date)::date AS period,
         count(*), sum(s.quantity), sum(s.total),
         coalesce(sum(s.total) FILTER (WHERE s.is_delivered), 0)
  FROM sales s
  WHERE (p_from IS NULL OR s.order_date >= p_from) AND (p_to IS NULL OR s.order_date <= p_to)
  GROUP BY 1 ORDER BY 1 DESC;
$$;

CREATE FUNCTION sp_admin_sales_by_employee(p_from DATE, p_to DATE)
RETURNS TABLE (user_id INT, employee TEXT, orders BIGINT, units BIGINT, revenue NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT u.id, u.name, count(s.id), coalesce(sum(s.quantity),0), coalesce(sum(s.total),0)
  FROM users u
  LEFT JOIN sales s ON s.user_id = u.id
       AND (p_from IS NULL OR s.order_date >= p_from) AND (p_to IS NULL OR s.order_date <= p_to)
  WHERE u.role = 'employee'
  GROUP BY u.id, u.name ORDER BY 5 DESC;
$$;

-- ============ USER CRUD (admin) ============
CREATE FUNCTION sp_list_users()
RETURNS TABLE (id INT, name TEXT, email TEXT, role TEXT, is_verified BOOLEAN, is_active BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE AS $$
  SELECT u.id, u.name, u.email, u.role, u.is_verified, u.is_active, u.created_at FROM users u ORDER BY u.id;
$$;

CREATE FUNCTION sp_update_user(p_id INT, p_name TEXT, p_role TEXT, p_active BOOLEAN)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  UPDATE users SET name = coalesce(p_name, name), role = coalesce(p_role, role),
                   is_active = coalesce(p_active, is_active) WHERE id = p_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE FUNCTION sp_delete_user(p_id INT)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  DELETE FROM users WHERE id = p_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
