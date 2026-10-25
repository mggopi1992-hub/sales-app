import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { call, one } from '../db';
import { requireAuth } from '../middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const REQUIRED = ['cust_id', 'cust_name', 'order_id', 'item_name', 'order_date', 'quantity', 'price', 'isDelivered'];

// Employee uploads daily sales file. Server builds the file name:  <firstname>_<YYYYMMDD>.txt
router.post('/upload', requireAuth('employee'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'FILE_REQUIRED' });
  const salesDate = String(req.body.salesDate || new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(salesDate)) return res.status(400).json({ error: 'INVALID_DATE' });

  const slug = req.user!.name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileName = `${slug}_${salesDate.replace(/-/g, '')}.txt`;

  let records: Record<string, string>[];
  try {
    // values are wrapped in single quotes in the sample file -> quote: "'"
    records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true, quote: "'", bom: true });
  } catch {
    return res.status(400).json({ error: 'INVALID_CSV' });
  }
  if (!records.length || !REQUIRED.every((h) => h in records[0]))
    return res.status(400).json({ error: 'MISSING_COLUMNS' });

  const rows = records.map((r) => ({
    cust_id: r.cust_id, cust_name: r.cust_name, order_id: r.order_id, item_name: r.item_name,
    order_date: r.order_date, quantity: Number(r.quantity), price: Number(r.price),
    is_delivered: /^(yes|true|1)$/i.test(r.isDelivered),
  }));

  const result = await one('sp_import_sales', [req.user!.id, fileName, JSON.stringify(rows)]);
  res.status(201).json(result);
});

router.get('/my', requireAuth('employee'), async (req, res) => {
  const { from, to } = req.query as Record<string, string | undefined>;
  res.json(await call('sp_get_sales', [req.user!.id, from || null, to || null]));
});

router.get('/uploads', requireAuth('employee'), async (req, res) => {
  res.json(await call('sp_my_uploads', [req.user!.id]));
});

export default router;
