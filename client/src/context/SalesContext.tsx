import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { api, qs } from '../api';
import { EmployeeRow, Period, SaleRow, SummaryRow, Upload } from '../types';
import { daysAgo, iso } from '../util';

interface SalesState {
  period: Period; from: string; to: string;
  summary: SummaryRow[]; byEmployee: EmployeeRow[]; sales: SaleRow[]; uploads: Upload[];
  loading: boolean; error: string;
  setPeriod(p: Period): void;
  setRange(from: string, to: string): void;
  loadAdmin(employeeId?: string): Promise<void>;
  loadMine(): Promise<void>;
  uploadFile(file: File, salesDate: string): Promise<{ file_name: string; inserted: number }>;
}

const SalesContext = createContext<SalesState | null>(null);

export function SalesProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>('daily');
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(iso(new Date()));
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [byEmployee, setByEmployee] = useState<EmployeeRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setLoading(true); setError('');
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };

  const loadAdmin = useCallback((employeeId?: string) => run(async () => {
    const [s, e, all] = await Promise.all([
      api<SummaryRow[]>('/admin/summary' + qs({ period, from, to })),
      api<EmployeeRow[]>('/admin/by-employee' + qs({ from, to })),
      api<SaleRow[]>('/admin/sales' + qs({ from, to, employeeId })),
    ]);
    setSummary(s); setByEmployee(e); setSales(all);
  }), [period, from, to]);

  const loadMine = useCallback(() => run(async () => {
    const [s, u] = await Promise.all([
      api<SaleRow[]>('/sales/my' + qs({ from, to })),
      api<Upload[]>('/sales/uploads'),
    ]);
    setSales(s); setUploads(u);
  }), [from, to]);

  const uploadFile = async (file: File, salesDate: string) => {
    const form = new FormData();
    form.append('salesDate', salesDate);
    form.append('file', file);
    return api<{ file_name: string; inserted: number }>('/sales/upload', { form });
  };

  const value: SalesState = {
    period, from, to, summary, byEmployee, sales, uploads, loading, error,
    setPeriod, setRange: (f, t) => { setFrom(f); setTo(t); }, loadAdmin, loadMine, uploadFile,
  };
  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be used inside <SalesProvider>');
  return ctx;
}
