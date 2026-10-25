import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSales } from './context/SalesContext';
import { SaleRow } from './types';
import { inr } from './util';

export const input = 'w-full rounded border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400';
export const btn = 'rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50';

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function ErrorText({ msg }: { msg: string }) {
  return msg ? <p className="rounded bg-red-50 p-2 text-sm text-red-700">{msg}</p> : null;
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <>
      <header className="flex items-center justify-between bg-indigo-700 px-6 py-3 text-white">
        <nav className="flex items-center gap-5">
          <span className="text-lg font-bold">Sales Tracker</span>
          {user?.role === 'admin' && (<>
            <Link to="/admin" className="hover:underline">Dashboard</Link>
            <Link to="/admin/employees" className="hover:underline">Employees</Link>
          </>)}
          {user?.role === 'employee' && <Link to="/employee" className="hover:underline">My sales</Link>}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.name} ({user?.role})</span>
          <button className="rounded bg-white/20 px-3 py-1 hover:bg-white/30" onClick={() => { logout(); nav('/login'); }}>Logout</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 p-6">{children}</main>
    </>
  );
}

export function RangePicker() {
  const { from, to, setRange } = useSales();
  return (
    <div className="flex items-center gap-2 text-sm">
      <label>From <input type="date" className={input + ' !w-auto'} value={from} onChange={(e) => setRange(e.target.value, to)} /></label>
      <label>To <input type="date" className={input + ' !w-auto'} value={to} onChange={(e) => setRange(from, e.target.value)} /></label>
    </div>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function SalesTable({ rows, showEmployee = false }: { rows: SaleRow[]; showEmployee?: boolean }) {
  const th = 'px-3 py-2 text-left font-medium';
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className={th}>Date</th>{showEmployee && <th className={th}>Employee</th>}
            <th className={th}>Cust ID</th><th className={th}>Customer</th><th className={th}>Order</th>
            <th className={th}>Item</th><th className={th + ' text-right'}>Qty</th>
            <th className={th + ' text-right'}>Price</th><th className={th + ' text-right'}>Total</th><th className={th}>Delivered</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">{r.order_date}</td>{showEmployee && <td className="px-3 py-2">{r.employee}</td>}
              <td className="px-3 py-2">{r.cust_id}</td><td className="px-3 py-2">{r.cust_name}</td><td className="px-3 py-2">{r.order_id}</td>
              <td className="px-3 py-2">{r.item_name}</td><td className="px-3 py-2 text-right">{r.quantity}</td>
              <td className="px-3 py-2 text-right">{inr(r.price)}</td><td className="px-3 py-2 text-right font-medium">{inr(r.total)}</td>
              <td className="px-3 py-2"><span className={r.is_delivered ? 'text-green-600' : 'text-amber-600'}>{r.is_delivered ? 'Yes' : 'No'}</span></td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={10} className="px-3 py-6 text-center text-slate-500">No data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
