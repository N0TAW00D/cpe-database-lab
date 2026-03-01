# InvoiceLab Overview

This document has 2 parts:
- Part I: Installation
- Part II: Code Overview (beginner-friendly)

# PART I. Installation

## 1) What this repo folder (InvoiceLab) contains

- `database/` = Dockerized PostgreSQL server + Adminer (compose file: `database/compose.yaml`)
- `server/` = Express API backend (port `4000`)
- `client/` = React + Vite UI frontend (port `5173` in dev)

Core defaults used by code:
- DB URL (server fallback): `postgresql://root:root@localhost:15432/invoices_db`
- API base (client fallback): `http://localhost:4000`

## 2) New machine preparation

Install:
1. Node.js `20.19+` or `22.12+`
   - Download from <https://nodejs.org>
   - Install LTS for Windows (`.msi`) with default options
   - Ensure "Add to PATH" is enabled
2. Docker Desktop
   - Download from <https://www.docker.com/products/docker-desktop/>
   - Install with default options
   - Use Linux containers (not Windows containers)

Quick checks (new terminal window):

```powershell
node -v
npm -v
docker --version
docker compose version
```

## 3) How to run the 3 tiers (DB/API/UI) on your laptop

### Step 1. Start Docker Desktop first

In Windows, open Docker Desktop and wait until it is fully running.

### Step 2. Start DB from repo root

```powershell
npm run docker:db:start
```

What this script does:
1. Starts `pgdatabase` on `localhost:15432` using `database/compose.yaml`
2. Waits for readiness (`pg_isready`)
3. Runs `node database/setup_db.js`
4. `setup_db.js` applies `database/sql/001_schema.sql` and only runs `database/sql/003_seed.sql` when the database is empty

### Step 3. (Optional) Start Adminer

Adminer is a lightweight browser UI to inspect tables and run SQL.

```powershell
docker compose -f database/compose.yaml up -d adminer
```

DB access after start:
- PostgreSQL: `localhost:15432`
- DB: `invoices_db`
- User/password: `root` / `root`
- Adminer: <http://localhost:8080>

To enter Postgres CLI (`psql`):

```powershell
docker compose -f database/compose.yaml exec -it pgdatabase psql -U root -d invoices_db
```

You should see prompt: `invoices_db=#`

### Step 4. Run API in terminal 2

```powershell
cd server
npm install
npm audit
npm audit fix
```

Notes:
- `npm audit` is optional (security report)
- `npm audit fix` only applies known safe automatic fixes

### Step 5. Create `server/.env`

This file stores local runtime settings (DB host/port/user/password, API port, keys).

Windows:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

### Step 6. Start API

```powershell
npm run dev
```

### Step 7. Run UI in terminal 3

```powershell
cd client
npm install
```

### Step 8. Create `client/.env`

Windows:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

### Step 9. Start UI

```powershell
npm run dev
```

### Step 10. Open and test app

- UI: <http://localhost:5173>

Architecture reminder:
- UI (`client`) calls API (`server`), API queries DB (PostgreSQL in Docker).
- Ports: UI `5173`, API `4000`, DB `15432`, Adminer `8080`.

Useful quick checks:
- UI test: <http://localhost:5173>
- API health: <http://localhost:4000/health>

Useful DB lifecycle commands (repo root):

```powershell
npm run docker:db:check
npm run docker:db:logs
npm run docker:db:stop
```

## 4) What to run next time you start your system

### Step 1. Start Docker Desktop

### Step 2. Terminal 1 (repo root)

```powershell
# npm install   # only needed first setup or when dependencies change
npm run docker:db:start
```

### Step 3. Terminal 2

```powershell
cd server
# npm install                 # only needed first setup or dependency changes
# Copy-Item .env.example .env # done once on first setup
npm run dev
```

### Step 4. Terminal 3

```powershell
cd client
# npm install                 # only needed first setup or dependency changes
# Copy-Item .env.example .env # done once on first setup
npm run dev
```

### Step 5. Test API quickly

```powershell
Invoke-RestMethod "http://localhost:4000/api/invoices?page=1&limit=5" | ConvertTo-Json -Depth 6
```

Run `npm install` again only if:
- first setup on this machine
- dependencies changed
- `node_modules` was deleted

## 5) Alternative: run full stack in Docker (FYI only)

This course does not officially support this mode for students, but it exists.

From repo root:

```powershell
npm run docker:start
```

This uses `docker-compose.yml` to start DB + server + client containers.

Open:
- UI: <http://localhost:3000>
- API: <http://localhost:4000>
- DB: `localhost:15432`
- Adminer: <http://localhost:8080>

Stop:

```powershell
npm run docker:stop
```

# PART II. Code Overview (Lecture Notes)

## Learning goals

By the end of this section, you should be able to:
1. Explain what each tier does: UI, API, DB.
2. Trace one request from browser click to SQL query and back.
3. Identify where to debug when invoice list data looks wrong.

## 1) Quick mental model (start here)

Think of the app as 3 teammates:
- UI tier = talks to user
- API tier = applies rules and coordinates data access
- DB tier = stores and retrieves persistent data

Standard request flow:

`UI -> API -> DB -> API -> UI`

Example in this project: **Invoice List page**.

## 2) Tier cheat sheet

### UI tier (Frontend)

Goal:
- Show data to users and collect user actions.

Key files:
- `client/src/main.jsx`
- `client/src/pages/invoices/InvoiceList.jsx`
- `client/src/components/DataList.jsx`
- `client/src/api/invoices.api.js`
- `client/src/api/http.js`

Inputs and outputs:
- Input from user: search text, page, sort, limit
- Output to API: HTTP request with query params

Important note:
- UI does **not** run SQL directly.

### API tier (Backend)

Goal:
- Receive HTTP requests, validate inputs, run business logic, return JSON.

Key files:
- `server/src/app.js`
- `server/src/routes/invoices.routes.js`
- `server/src/controllers/invoices.controller.js`
- `server/src/services/invoices.service.js`
- `server/src/utils/response.js`

API internal layers:
1. Route: maps URL to handler
2. Controller: handles `req` and `res`
3. Service: runs core logic + DB queries

Important note:
- API protects DB by validating allowed sort fields and request values.

### DB tier (Database)

Goal:
- Persist data and answer queries efficiently.

Schema/data sources:
- `database/init/01_schema.sql`
- `database/sql/sql_run.sql`

Main tables for invoice list:
- `invoice`
- `customer`

Important note:
- DB does filtering, joins, and pagination (`LIMIT/OFFSET`).

## 3) Invoice List request walkthrough

### Step 1. User action in UI

User opens `/invoices` or changes search/sort/page.

### Step 2. UI builds request

`DataList` prepares params and calls `listInvoices(params)`.

Typical request:

`GET /api/invoices?page=1&limit=10&search=&sortBy=invoice_date&sortDir=desc`

### Step 3. API receives request

- Route maps to `listInvoices` controller.
- Controller passes query params to service.
- Service validates params and prepares SQL.

### Step 4. DB executes queries

Count query (for total rows/pages):

```sql
SELECT COUNT(*) as total
FROM invoice i
JOIN customer c ON c.id = i.customer_id
WHERE i.invoice_no ILIKE $1 OR c.name ILIKE $1
```

Page query (for current page data):

```sql
SELECT i.invoice_no, i.invoice_date, i.amount_due,
       c.name as customer_name
FROM invoice i
JOIN customer c ON c.id = i.customer_id
WHERE i.invoice_no ILIKE $1 OR c.name ILIKE $1
ORDER BY <validated sort column> <ASC|DESC> NULLS LAST, i.id DESC
LIMIT $2 OFFSET $3
```

### Step 5. API sends response JSON

```json
{
  "success": true,
  "data": [
    {
      "invoice_no": "INV-051",
      "invoice_date": "2025-12-27T00:00:00.000Z",
      "amount_due": "8292.77",
      "customer_name": "..."
    }
  ],
  "error": null,
  "meta": {
    "total": 51,
    "page": 1,
    "limit": 10,
    "totalPages": 6
  }
}
```

### Step 6. UI renders table + pagination

Mapping:
- table rows <- `data`
- pagination <- `meta.total`, `meta.page`, `meta.limit`, `meta.totalPages`

## 4) Why this architecture helps

- Separation of concerns: each tier has one main job.
- Safer code: DB credentials and SQL logic stay on backend.
- Easier debugging: you can isolate issue by tier.

Quick debug rule:
- UI bug: wrong rendering/interaction
- API bug: wrong response shape/rules
- DB bug: wrong data returned by SQL

## 5) Practical debug checklist (Invoice List)

1. Check API quickly:

```powershell
Invoke-RestMethod "http://localhost:4000/api/invoices?page=1&limit=10&search=&sortBy=invoice_date&sortDir=desc" |
  ConvertTo-Json -Depth 6
```

2. Check DB query result:

```bash
docker compose -f database/compose.yaml exec -T pgdatabase psql -U root -d invoices_db -c "
SELECT i.invoice_no, i.invoice_date, i.amount_due, c.name AS customer_name
FROM invoice i
JOIN customer c ON c.id = i.customer_id
ORDER BY i.invoice_date DESC NULLS LAST, i.id DESC
LIMIT 10 OFFSET 0;
"
```

3. Check browser Network tab:
- confirm request URL/query params
- confirm response fields match table columns

## 6) Mini glossary (for early-year students)

- Route: URL pattern matched by backend (`/api/invoices`).
- Controller: function handling HTTP request/response objects.
- Service: backend logic layer called by controllers.
- Query params: URL key-value pairs after `?`.
- JSON contract: response shape both frontend and backend agree on.
- Pagination: split large result set into pages.
- JOIN: SQL operation combining related tables.

## 7) Teaching notes and caveats

1. Invoice API supports both numeric `id` and `invoice_no` in detail/update/delete service methods (backward compatibility).
2. `database/sql/sql_run.sql` is now a reset script, while normal setup uses `001_schema.sql` plus conditional seed to avoid wiping local DB changes.
3. `DataList` debounces search by 300ms before sending requests.
4. This repo is SQL-script managed (no Prisma/Knex/TypeORM migration history).

## 8) One-command sanity sequence (fresh machine)

```bash
# terminal 1 (repo root)
npm install
npm run docker:db:start

# terminal 2
cd server
npm install
# copy .env from .env.example (first setup only)
npm run dev

# terminal 3
cd client
npm install
# copy .env from .env.example (first setup only)
npm run dev

# verify endpoint (option 1)
curl "http://localhost:4000/api/invoices?page=1&limit=5"
```

PowerShell alternative:

```powershell
Invoke-RestMethod "http://localhost:4000/health"
Invoke-RestMethod "http://localhost:4000/api/invoices?page=1&limit=5" | ConvertTo-Json -Depth 6
```
