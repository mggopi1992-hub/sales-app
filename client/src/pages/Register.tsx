import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthCard, btn, ErrorText, input } from '../ui';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await register(f.name, f.email, f.password); nav('/verify', { state: { email: f.email } });
     console.log(f.name,f.email,f.password)
  }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard title="Create account">
      <form onSubmit={submit} className="space-y-3">
        <input className={input} placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <input className={input} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <input className={input} type="password" placeholder="Password (min 8 chars)" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        <ErrorText msg={error} />
        <button className={btn + ' w-full'} disabled={busy}>Register as employee</button>
        <p className="text-center text-sm">Have an account? <Link className="text-indigo-600" to="/login">Sign in</Link></p>
      </form>
    </AuthCard>
  );
}
