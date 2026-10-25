import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { call, one } from '../db';
import { requireAuth } from '../middleware';

const router = Router();
router.use(requireAuth('admin')); // every route below is admin-only

const q = (v: unknown) => (typeof v === 'string' && v ? v : null);

// Dashboard: ?period=daily|weekly|monthly&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/summary', async (req, res) => {
  const period = String(req.query.period ?? 'daily');
  if (!['daily', 'weekly', 'monthly'].includes(period)) return res.status(400).json({ error: 'INVALID_PERIOD' });
  res.json(await call('sp_admin_sales_summary', [period, q(req.query.from), q(req.query.to)]));
});

router.get('/by-employee', async (req, res) => {
  res.json(await call('sp_admin_sales_by_employee', [q(req.query.from), q(req.query.to)]));
});

router.get('/sales', async (req, res) => {
  const emp = q(req.query.employeeId);
  res.json(await call('sp_get_sales', [emp ? Number(emp) : null, q(req.query.from), q(req.query.to)]));
});

// ---- Employee CRUD ----
router.get('/users', async (_req, res) => res.json(await call('sp_list_users')));

router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (!name || !email || (password ?? '').length < 8) return res.status(400).json({ error: 'INVALID_INPUT' });
  const r = await one('sp_register_user', [name, email, await bcrypt.hash(password, 10), role === 'admin' ? 'admin' : 'employee']);
  res.status(201).json(r);
});

router.put('/users/:id',async(req,res)=>{
  const {name,email,password,role} = req.body ?? {};
  //console.log(name,email,password,role)
  if(!name || !email || !role)
    return res.status(400).json({error:"Invalid Input"});
  const u = await one('sp_user_update_info',[Number(req.params.id),name??null,email??null,password??null,role??null]);
  res.status(201).json(u);
})

router.put('/users/:id', async (req, res) => {
  const { name, role, is_active } = req.body ?? {};
  const n = await one('sp_update_user', [Number(req.params.id), name ?? null, role ?? null, is_active ?? null]);
  res.json({ updated: n });
});

router.delete('/users/:id', async (req, res) => {
  if (Number(req.params.id) === req.user!.id) return res.status(400).json({ error: 'CANNOT_DELETE_SELF' });
  res.json({ deleted: await one('sp_delete_user', [Number(req.params.id)]) });
});

export default router;
