import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSales } from '../context/SalesContext';
import { btn, Card, ErrorText, input, RangePicker, SalesTable } from '../ui';
import { firstName, iso } from '../util';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { sales, uploads, loading, error, loadMine, uploadFile } = useSales();
  const [date, setDate] = useState(iso(new Date()));
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { loadMine(); }, [loadMine]);

  // The server builds the same name: <firstname>_<YYYYMMDD>.txt  e.g. arul_20261011.txt
  const fileName = `${firstName(user!.name)}_${date.replace(/-/g, '')}.txt`;

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(''); setErr('');
    if (!file) return;
    try {
      const r = await uploadFile(file, date);
      setMsg(`Saved ${r.inserted} rows as ${r.file_name}`);
      setFile(null); (e.target as HTMLFormElement).reset();
      await loadMine();
    } catch (ex) { setErr((ex as Error).message); }
  };

  return (
    <>
      <Card title="Upload daily sales file">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Sales date
            <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="text-sm">CSV / TXT file
            <input type="file" accept=".csv,.txt" className={input} onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          </label>
          <button className={btn} disabled={!file}>Upload</button>
        </form>
        <p className="mt-2 text-sm text-slate-500">Will be stored as <code className="rounded bg-slate-100 px-1">{fileName}</code></p>
        {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}
        <ErrorText msg={err} />
      </Card>

      <Card title="My uploads">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100"><tr>
            <th className="px-3 py-2 text-left">File</th><th className="px-3 py-2 text-left">Sales date</th>
            <th className="px-3 py-2 text-right">Rows</th><th className="px-3 py-2 text-left">Uploaded</th>
          </tr></thead>
          <tbody>
            {uploads.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.file_name}</td><td className="px-3 py-2">{u.sales_date}</td>
                <td className="px-3 py-2 text-right">{u.row_count}</td>
                <td className="px-3 py-2">{new Date(u.uploaded_at).toLocaleString()}</td>
              </tr>
            ))}
            {!uploads.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">No uploads yet</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card title="My sales">
        <div className="mb-3"><RangePicker /></div>
        <ErrorText msg={error} />
        {loading ? <p className="text-sm text-slate-500">Loading...</p> : <SalesTable rows={sales} />}
      </Card>
    </>
  );
}
