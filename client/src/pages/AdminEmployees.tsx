import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { AppUser } from '../types';
import { btn, Card, ErrorText, input } from '../ui';

export default function AdminEmployees() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState('');
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'employee' });

  const load = useCallback(async () => {
    try { setUsers(await api<AppUser[]>('/admin/users')); } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setError('');
    try { await fn(); await load(); } catch (e) { setError((e as Error).message); }
  };
  const create = (e: FormEvent) => {
    e.preventDefault();
    act(async () => { await api('/admin/users', { body: f }); setF({ name: '', email: '', password: '', role: 'employee' }); });
  };
  const update = (id: number, patch: object) => act(() => api(`/admin/users/${id}`, { method: 'PUT', body: patch }));
  const remove = (u: AppUser) => confirm(`Delete ${u.name} and all their sales?`) &&
    act(() => api(`/admin/users/${u.id}`, { method: 'DELETE' }));

  return (
    <>
      <ErrorText msg={error} />
      <Card title="Add user">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-5">
          <input className={input} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
          <input className={input} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
          <input className={input} type="password" placeholder="Password" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
          <select className={input} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="employee">Employee</option><option value="admin">Admin</option>
          </select>
          <button className={btn}>Create</button>
        </form>
      </Card>
      <Card title="Users">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr>
            {['Name', 'Email', 'Role', 'Verified', 'Active', ''].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.name}</td><td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <select className="rounded border px-2 py-1" value={u.role} onChange={(e) => update(u.id, { role: e.target.value })}>
                    <option value="employee">employee</option><option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-3 py-2">{u.is_verified ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2"><input type="checkbox" checked={u.is_active} onChange={(e) => update(u.id, { is_active: e.target.checked })} /></td>
                <td className="px-3 py-2 text-right"><button className="text-red-600 hover:underline" onClick={() => remove(u)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
