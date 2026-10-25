import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { call, one } from '../db';
import { JWT_SECRET } from '../middleware';
import { sendOtp } from '../mailer';

const router = Router();

const hashOtp = (email: string, code: string) =>
  crypto.createHash('sha256').update(`${email}:${code}:${JWT_SECRET}`).digest('hex');

async function issueOtp(userId: number, email: string) {
  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits
  await one('sp_create_otp', [userId, hashOtp(email, code), 5]);
  await sendOtp(email, code);
}
console.log('Hi')
// Public registration always creates an EMPLOYEE. Admins are seeded or created by an admin.
router.post('/register', async (req, res) => {
  console.log('REGISTER body:', { ...req.body, password: '***' });
  const { name, email, password } = req.body ?? {};
  if (!name || !/^\S+@\S+\.\S+$/.test(email ?? '') || (password ?? '').length < 8) {
    console.log('REGISTER rejected: invalid input');
    return res.status(400).json({ error: 'INVALID_INPUT' });
  }
  const user = await one('sp_register_user', [name, email, await bcrypt.hash(password, 10), 'employee']);
  console.log('REGISTER user created:', user);
  await issueOtp(user.id, user.email);
  console.log('REGISTER otp issued');
  res.status(201).json({ message: 'OTP sent', email: user.email });
});
// Step 1: password check -> email an OTP
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const [u] = await call('sp_get_user_by_email', [email ?? '']);
  if (!u || !u.is_active || !(await bcrypt.compare(password ?? '', u.password_hash)))
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  await issueOtp(u.id, u.email);
  res.json({ message: 'OTP sent', email: u.email });
});

// Step 2: OTP check -> JWT
router.post('/verify-otp', async (req, res) => {
  const email = String(req.body?.email ?? '').toLowerCase();
  const otp = String(req.body?.otp ?? '');
  const r = await one('sp_verify_otp', [email, hashOtp(email, otp)]);
  if (r.status !== 'ok') return res.status(401).json({ error: `OTP_${String(r.status).toUpperCase()}` });
  const token = jwt.sign(r.user, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: r.user });
});

router.post('/resend-otp', async (req, res) => {
  const [u] = await call('sp_get_user_by_email', [req.body?.email ?? '']);
  if (u && u.is_active) await issueOtp(u.id, u.email);
  res.json({ message: 'If the account exists, an OTP was sent' }); // do not reveal existence
});

export default router;
