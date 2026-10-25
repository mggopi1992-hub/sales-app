export const inr = (n: number | string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n));
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const daysAgo = (n: number) => iso(new Date(Date.now() - n * 864e5));
export const firstName = (name: string) => name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
