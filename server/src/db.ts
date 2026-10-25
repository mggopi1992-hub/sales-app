import { Pool, types } from 'pg';

types.setTypeParser(1082, (v) => v); // keep DATE as 'YYYY-MM-DD' string (no timezone shifting)

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Call a stored procedure/function: SELECT * FROM fn($1,$2,...). `fn` is always a hard-coded name. */
export async function call<T = any>(fn: string, args: unknown[] = []): Promise<T[]> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await pool.query(`SELECT * FROM ${fn}(${placeholders})`, args);
  return rows as T[];
}

/** For functions that return a single value (jsonb / int / void) */
export async function one<T = any>(fn: string, args: unknown[] = []): Promise<T> {
  const rows = await call(fn, args);
  return rows[0]?.[fn] as T;
}
