import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthCard, btn, ErrorText, input } from '../ui';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await login(email, password); nav('/verify', { state: { email } }); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard title="Sign in">
      <form onSubmit={submit} className="space-y-3">
        <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <ErrorText msg={error} />
        <button className={btn + ' w-full'} disabled={busy}>{busy ? 'Sending OTP...' : 'Continue'}</button>
        <p className="text-center text-sm">No account? <Link className="text-indigo-600" to="/register">Register</Link></p>
      </form>
    </AuthCard>
  );
}
