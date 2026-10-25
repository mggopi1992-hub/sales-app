import { useEffect, useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Period } from '../types';
import { Card, ErrorText, input, RangePicker, SalesTable } from '../ui';
import { inr } from '../util';

const label = (p: Period, d: string) => (p === 'monthly' ? d.slice(0, 7) : p === 'weekly' ? `Week of ${d}` : d);

export default function AdminDashboard() {
  const { period, setPeriod, from, to, summary, byEmployee, sales, loading, error, loadAdmin } = useSales();
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => { loadAdmin(employeeId || undefined); }, [loadAdmin, employeeId]);

  const total = summary.reduce((a, r) => a + Number(r.revenue), 0);
  const orders = summary.reduce((a, r) => a + Number(r.orders), 0);
  const units = summary.reduce((a, r) => a + Number(r.units), 0);
  const max = Math.max(1, ...summary.map((r) => Number(r.revenue)));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded border bg-white">
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 capitalize ${period === p ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}>{p}</button>
          ))}
        </div>
        <RangePicker />
      </div>
      <ErrorText msg={error} />
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        {[['Revenue', inr(total)], ['Orders', orders], ['Units sold', units]].map(([k, v]) => (
          <div key={k as string} className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">{k}</p><p className="text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <Card title={`${period[0].toUpperCase() + period.slice(1)} sales (${from} to ${to})`}>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr>
            <th className="px-3 py-2 text-left">Period</th><th className="px-3 py-2 text-right">Orders</th>
            <th className="px-3 py-2 text-right">Units</th><th className="px-3 py-2 text-right">Revenue</th>
            <th className="px-3 py-2 text-right">Delivered</th><th className="w-1/4 px-3 py-2" />
          </tr></thead>
          <tbody>
            {summary.map((r) => (
              <tr key={r.period} className="border-t">
                <td className="px-3 py-2">{label(period, r.period)}</td>
                <td className="px-3 py-2 text-right">{r.orders}</td><td className="px-3 py-2 text-right">{r.units}</td>
                <td className="px-3 py-2 text-right font-medium">{inr(r.revenue)}</td>
                <td className="px-3 py-2 text-right">{inr(r.delivered_revenue)}</td>
                <td className="px-3 py-2"><div className="h-3 rounded bg-indigo-500" style={{ width: `${(Number(r.revenue) / max) * 100}%` }} /></td>
              </tr>
            ))}
            {!summary.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No data</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card title="Sales by employee">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr>
            <th className="px-3 py-2 text-left">Employee</th><th className="px-3 py-2 text-right">Orders</th>
            <th className="px-3 py-2 text-right">Units</th><th className="px-3 py-2 text-right">Revenue</th>
          </tr></thead>
          <tbody>
            {byEmployee.map((r) => (
              <tr key={r.user_id} className="border-t">
                <td className="px-3 py-2">{r.employee}</td><td className="px-3 py-2 text-right">{r.orders}</td>
                <td className="px-3 py-2 text-right">{r.units}</td><td className="px-3 py-2 text-right font-medium">{inr(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="All sales records">
        <select className={input + ' mb-3 !w-auto'} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">All employees</option>
          {byEmployee.map((e) => <option key={e.user_id} value={e.user_id}>{e.employee}</option>)}
        </select>
        <SalesTable rows={sales} showEmployee />
      </Card>
    </>
  );
}
