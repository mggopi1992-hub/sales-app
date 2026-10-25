# Sales Tracker – PERN + TypeScript + Tailwind + Electron

```
db/init.sql      tables + ALL business logic as PostgreSQL stored functions (sp_*)
server/          Express 5 + TypeScript (thin API: validates, calls sp_*, JWT auth, CSV parse)
client/          React 18 + Vite + Tailwind v4 (AuthContext + SalesContext)
electron/        Desktop wrapper (loads client build)
sample/          arul_20260901.txt  sample upload file
```

## Flow
1. **Register** (employee) -> OTP emailed -> **verify** -> JWT.
2. **Login**: email+password -> OTP emailed -> verify -> JWT (8h).
3. Admin is seeded from ADMIN_EMAIL / ADMIN_PASSWORD on server start.
4. **Employee**: picks sales date + file. Server names it `<firstname>_<YYYYMMDD>.txt`, parses the CSV
   (single-quoted values supported), sends rows as JSON to `sp_import_sales` -> stored in `sales`.
5. **Admin**: daily / weekly / monthly dashboard (`sp_admin_sales_summary`), by-employee totals, all records, user CRUD.

## Run with Docker (everything)
```bash
docker compose up --build
# App: http://localhost:8080   API: http://localhost:4000/api/health
# Login: admin@example.com / Admin@12345  (OTP is printed in `docker compose logs -f server` when SMTP is not set)
```
Reset DB (re-run init.sql): `docker compose down -v`

## Run locally (dev)
```bash
docker compose up -d db                      # just Postgres
cd server && cp .env.example .env && npm i && npm run dev
cd client && npm i && npm run dev            # http://localhost:5173
```

## Electron desktop app
The desktop app talks to the API over HTTP, so the server + DB must be running (Docker or a remote host).
```bash
cd client && npm i
VITE_API_URL=http://localhost:4000/api npm run build     # (Windows PowerShell: $env:VITE_API_URL="..."; npm run build)
cd ../electron && npm i
npm start          # run against the build
npm run dist       # create installer (exe / dmg / AppImage) in electron/dist
```
Dev with hot reload: run `npm run dev` in client, then `npm run dev` in electron.

## Real email (OTP)
Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM (Gmail app password, Brevo, SES, etc.).

## Before production
Strong JWT_SECRET + admin password, HTTPS, rate-limit /auth routes (express-rate-limit), restrict CORS origin,
keep secrets out of git, back up the `pgdata` volume.

## Ideas to extend
Pagination, charts (recharts), CSV export, edit/delete uploads, password reset, Playwright tests.
