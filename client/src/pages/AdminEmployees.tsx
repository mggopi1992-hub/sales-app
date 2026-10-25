/* import { FormEvent, useCallback, useEffect, useState } from 'react';
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

    const modify = (id: number) => act(() => api(`/admin/user/${id}`, { method: 'PUT'}));
  const modified = (m: AppUser) => confirm(`modify ${m.name} and all their sales?`) &&
    act(() => api(`/admin/users/${m.id}`, { method: 'DELETE' }));

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
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <select className="rounded border px-2 py-1" value={u.role} onChange={(e) => update(u.id, { role: e.target.value })}>
                    <option value="employee">employee</option><option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-3 py-2">{u.is_verified ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2"><input type="checkbox" checked={u.is_active} onChange={(e) => update(u.id, { is_active: e.target.checked })} /></td>
                <td className="px-3 py-2 text-right"><button className="px-1 text-blue-600 hover:underline" onClick={() => modified(m)}>Edit</button>
                <button className="text-red-600 hover:underline" onClick={() => remove(u)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
 */


import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { AppUser } from '../types';
import { btn, Card, ErrorText, input } from '../ui';

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const emptyForm: UserForm = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
};

export default function AdminEmployees() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [f, setF] = useState<UserForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await api<AppUser[]>('/admin/users'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setF({ ...emptyForm });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const editUser = (u: AppUser) => {
    setEditingId(u.id);
    setF({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
    });
    setError('');
    setSuccess('');

    // Scroll to the form so the user can edit the selected record.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (editingId !== null) {
        // Do not change the existing password unless a new one is entered.
        const body: Partial<UserForm> = {
          name: f.name,
          email: f.email,
          role: f.role,
        };

        if (f.password.trim()) {
          body.password = f.password;
        }

        // Assumes the backend PUT endpoint is /admin/users/:id.
        await api(`/admin/users/${editingId}`, {
          method: 'PUT',
          body,
        });

        setSuccess('User updated successfully.');
      } else {
        if (!f.password.trim()) {
          setError('Password is required when creating a user.');
          return;
        }

        await api('/admin/users', {
          body: f,
        });

        setSuccess('User created successfully.');
      }

      setF({ ...emptyForm });
      setEditingId(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

   /* const update = async (id: number, patch: object) => {
    setError('');
    setSuccess('');

    try {
      await api(`/admin/users/${id}`, {
        method: 'PUT',
        body: patch,
      });

    //  setSuccess('User updated successfully.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };
 */
  const remove = async (u: AppUser) => {
    if (!confirm(`Delete ${u.name} and all their sales?`)) return;

    setError('');
    setSuccess('');

    try {
      await api(`/admin/users/${u.id}`, {
        method: 'DELETE',
      });

      if (editingId === u.id) {
        resetForm();
      }

      setSuccess('User deleted successfully.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <>
      <ErrorText msg={error} />

      {success && (
        <p className="mb-3 text-sm text-green-600" role="status">
          {success}
        </p>
      )}

      <Card title={editingId !== null ? 'Update user' : 'Add user'}>
        <form
          onSubmit={submit}
          className="grid gap-3 sm:grid-cols-5"
        >
          <input
            className={input}
            placeholder="Name"
            value={f.name}
            onChange={(e) =>
              setF({ ...f, name: e.target.value })
            }
            required
          />

          <input
            className={input}
            type="email"
            placeholder="Email"
            value={f.email}
            onChange={(e) =>
              setF({ ...f, email: e.target.value })
            }
            required
          />

          <input
            className={input}
            type="password"
            placeholder={
              editingId !== null
                ? 'New password (optional)'
                : 'Password'
            }
            minLength={8}
            autoComplete="new-password"
            value={f.password}
            onChange={(e) =>
              setF({ ...f, password: e.target.value })
            }
            required={editingId === null}
          />

          <select
            className={input}
            value={f.role}
            onChange={(e) =>
              setF({ ...f, role: e.target.value })
            }
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className={btn}
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId !== null
                  ? 'Update'
                  : 'Create'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="rounded border px-3 py-2"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {editingId !== null && (
          <p className="mt-2 text-sm text-slate-500">
            Leave the password blank to keep the current password.
          </p>
        )}
      </Card>

      <Card title="Users">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                {[
                  'Name',
                  'Email',
                  'Role',
                  'Verified',
                /*   'Active', */
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-2 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={`border-t ${
                    editingId === u.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-3 py-2">{u.name}</td>

                  <td className="px-3 py-2">{u.email}</td>

                  <td className="px-3 py-2">
                    {u.role}
                  </td>

                   <td className="px-3 py-2">
                    {u.is_verified ? 'Yes' : 'No'}
                  </td>

                 {/* <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={u.is_active}
                      onChange={(e) =>
                        update(u.id, {
                          is_active: e.target.checked,
                        })
                      }
                      aria-label={`Activate ${u.name}`}
                    />
                  </td>
 */}
                  <td className="whitespace-nowrap px-1 py-2 text-left">
                    <button
                      type="button"
                      className="mr-4 text-blue-600 hover:underline"
                      onClick={() => editUser(u)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => remove(u)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
