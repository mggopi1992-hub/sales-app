import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { AuthCard, btn, ErrorText, input } from '../ui';

export default function VerifyOtp() {
  const { verifyOtp } = useAuth();
  const nav = useNavigate();
  const email = (useLocation().state as { email?: string } | null)?.email;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!email) return <Navigate to="/login" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const u = await verifyOtp(email, otp);
      nav(u.role === 'admin' ? '/admin' : '/employee', { replace: true });
    } catch (err) { setError((err as Error).message); }
  };
  const resend = async () => { await api('/auth/resend-otp', { body: { email } }); setInfo('A new OTP was sent.'); };

  return (
    <AuthCard title="Enter OTP">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-slate-600">We sent a 6-digit code to <b>{email}</b>. (Dev mode: see the server console.)</p>
        <input className={input + ' text-center text-xl tracking-widest'} inputMode="numeric" maxLength={6}
               placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required />
        <ErrorText msg={error} />
        {info && <p className="text-sm text-green-700">{info}</p>}
        <button className={btn + ' w-full'}>Verify & sign in</button>
        <button type="button" onClick={resend} className="w-full text-sm text-indigo-600">Resend code</button>
      </form>
    </AuthCard>
  );
}
