# InvoiceDoc v2

[![InvoiceDoc2](https://img.shields.io/badge/InvoiceDoc2-v2.0-232F3E)](.)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellowgreen)](.)

A full-stack Invoice Management System built with React, Express, and PostgreSQL.

## 📦 Required software & downloads

Install these before running the project:

| Resource | Purpose | Download |
|----------|---------|----------|
| **Node.js** (v18 or newer) | Run server and client; includes **npm** | [https://nodejs.org/](https://nodejs.org/) |
| **Docker Desktop** | Run PostgreSQL (and optional full stack) | [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/) |

- **Node.js:** Choose LTS. After install, check: `node -v` and `npm -v`.
- **Docker Desktop:** Start Docker before using `npm run docker:db:start` or `docker-compose`.
- **yarn** (optional): [https://classic.yarnpkg.com/](https://classic.yarnpkg.com/) — you can use `npm` only.

All `npm run` scripts (e.g. `docker:db:start`, `docker:db:stop`) are implemented in Node.js and work on **Windows, macOS, and Linux**.

## 🚀 Quick Start (Local Development)

Recommended: run the database in Docker, then run server and client in the terminal.

### Prerequisites
- Node.js (v18+) and npm — see [downloads](#-required-software--downloads) above.
- Docker Desktop — see [downloads](#-required-software--downloads) above.

### Step 1: Start the database (run this first)

```bash
npm run docker:db:start
```

This starts PostgreSQL from `database/compose.yaml`, applies schema updates, and seeds sample data only when the database is empty. When it finishes you should see "Database is ready!".

**DB access:** Host `localhost:15432` | Database `invoices_db` | User `root` | Password `root`  
**Adminer (web UI):** http://localhost:8080 — System: PostgreSQL | Server: `pgdatabase` | Username: `root` | Password: `root` | Database: `invoices_db`

**Useful DB commands:**
- `npm run docker:db:stop` — Stop the database
- `npm run docker:db:check` — Check status and row counts

### Step 2: Run the server

Open a terminal:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Server: http://localhost:4000  
Set `DATABASE_URL` in `.env` if needed (default: `postgresql://root:root@localhost:15432/invoices_db`).

### Step 3: Run the client

Open another terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Client: http://localhost:5173  
Set `VITE_API_BASE` in `.env` if needed (default: `http://localhost:4000`).

---

## 🐳 Docker Compose (Deployment)

Use this when you want to run **everything** in containers (database + server + client) for deployment or full-stack run.

```bash
docker compose up -d --build
docker compose ps        # Status
docker compose logs -f   # Logs
docker compose down      # Stop all
```

**Access:** Client http://localhost:3000 | Server http://localhost:4000 | DB localhost:15432 | Adminer http://localhost:8080

See [README.DOCKER.md](./README.DOCKER.md) for deployment details.

## 📁 Project Structure

```
InvoiceDoc2/
├── client/                      # React frontend (Vite)
│   ├── src/
│   │   ├── api/                 # API client (http.js, customers.api.js, products.api.js, invoices.api.js)
│   │   ├── components/          # Reusable UI (DataList, InvoiceForm, LineItemsEditor, Modal, ReportTable, SearchableSelect, Loading)
│   │   ├── pages/               # Page views
│   │   │   ├── invoices/        # InvoiceList, InvoicePage (view/create/edit)
│   │   │   ├── customers/       # CustomerList, CustomerPage
│   │   │   ├── products/        # ProductList, ProductPage
│   │   │   └── reports/        # Reports.jsx, filters/ (ReportFilters, DateRangeFilter, ProductFilter, etc.)
│   │   ├── main.jsx             # App entry, routes, layout
│   │   ├── index.css            # Global styles
│   │   └── utils.js             # formatBaht, formatDate
│   ├── Dockerfile
│   └── package.json
├── server/                      # Express backend
│   ├── src/
│   │   ├── controllers/         # Request handlers (invoices, customers, products, reports)
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Business logic & DB queries (invoices, customers, products, reports)
│   │   ├── models/              # Zod validation schemas (invoice, customer, product)
│   │   ├── db/                  # PostgreSQL pool (pool.js)
│   │   ├── utils/               # Response helpers (response.js)
│   │   └── app.js               # Express app entry
│   ├── Dockerfile
│   └── package.json
├── database/                    # PostgreSQL setup
│   ├── init/                    # 01_schema.sql (schema only, run on first start)
│   ├── sql/                     # 001_schema.sql, 003_seed.sql, sql_run.sql (full reset)
│   ├── compose.yaml             # Database-only Docker Compose
│   └── setup_db.js              # Run schema, then seed only if DB is empty
├── docker-compose.yml           # Full stack (database + server + client)
├── docker-compose.coolify.yml   # Server + client only (DB via env)
├── scripts/                     # Helper Node.js scripts (run from repo root)
│   ├── docker-start.js          # Start full stack
│   ├── docker-stop.js           # Stop full stack
│   ├── docker-logs.js           # View logs
│   ├── docker-db-start.js       # Start DB only + setup_db
│   ├── docker-db-stop.js        # Stop DB only
│   └── docker-db-check.js       # Check DB status & counts
├── README.DOCKER.md             # Docker deployment guide
├── GUIDE.md                     # Project guide (Thai/English)
└── PROJECT_STRUCTURE.md         # Detailed structure notes
```

## 🎯 Features

### Invoice Management
- ✅ Create, view, edit, and delete invoices
- ✅ Auto-generate invoice numbers (`INV-001`, `INV-002`, ...)
- ✅ Multiple line items per invoice with auto-merge duplicates
- ✅ Automatic VAT calculation
- ✅ Print/PDF export with optimized styling
- ✅ Server-side search for customers and products

### Master Data Management
- ✅ **Customers**: Full CRUD with auto-code generation (`C{ID}`)
- ✅ **Products**: Full CRUD with auto-code generation (`P{ID}`)
- ✅ Cascading delete with force delete option
- ✅ Server-side search and pagination

### Reports & Analytics
- ✅ Sales reports by product and customer
- ✅ Monthly sales reports
- ✅ Advanced filtering (product, customer, date range, year/month)
- ✅ Table sorting and pagination
- ✅ Custom modals for alerts and confirmations

### UI/UX Enhancements
- ✅ Responsive design with mobile warning
- ✅ Loading indicators on all pages
- ✅ Custom modal components (replacing browser alerts)
- ✅ Collapsible navigation submenus
- ✅ Empty states and user-friendly messages

## 🔌 API Endpoints

### Customers
- `GET /api/customers` - List customers (supports `search`, `page`, `limit`, `sortBy`, `sortDir`)
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (with force delete option)

### Products
- `GET /api/products` - List products (supports `search`, `page`, `limit`, `sortBy`, `sortDir`)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (with force delete option)

### Invoices
- `GET /api/invoices` - List invoices (supports `page`, `limit`, `sortBy`, `sortDir`)
- `GET /api/invoices/:id` - Get invoice with line items
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Reports
- `GET /api/reports/sales-by-product` - Sales by product (supports filters, pagination, sorting)
- `GET /api/reports/sales-by-customer` - Sales by customer (supports filters, pagination, sorting)
- `GET /api/reports/sales-by-product-monthly` - Monthly sales by product (supports filters, pagination, sorting)

**Report Filters:**
- `product_id` - Filter by product
- `customer_id` - Filter by customer
- `date_from` / `date_to` - Date range filter
- `year` / `month` - Year/month filter
- `page` / `limit` - Pagination
- `sortBy` / `sortDir` - Sorting

## 🛠 Tech Stack

- **Frontend**: React 18, React Router 6, Vite 5
- **Backend**: Node.js, Express 4, pg (PostgreSQL client), Zod (validation)
- **Database**: PostgreSQL 17 (Docker)
- **Deployment**: Docker, Docker Compose
- **Tools**: Adminer, serve (static file server)

## 📜 NPM Scripts (root package.json)

**Local dev (run DB first, then server/client in terminal):**
| Command | Description |
|---------|-------------|
| `npm run docker:db:start` | Start database only + apply schema, then seed if empty *(run this first)* |
| `npm run docker:db:stop` | Stop database |
| `npm run docker:db:check` | Check DB status and table row counts |
| `npm run docker:db:logs` | View database container logs |
| `npm run docker:db:ps` | Show database container status |

**Repo sync (pull latest from upstream):**
| Command | Description |
|---------|-------------|
| `npm run sync` | Check [llbumpbumpll/InvoiceDoc2](https://github.com/llbumpbumpll/InvoiceDoc2); if your branch is behind, pull the latest |

**Deploy / full stack in Docker (manual Docker Compose):**
| Command | Description |
|---------|-------------|
| `docker compose up -d --build` | Start all services (DB + server + client) in containers |
| `docker compose ps` | Show container status |
| `docker compose logs -f` | View logs (server, client, database) |
| `docker compose down` | Stop all |

Scripts live in `scripts/`. DB commands use `database/compose.yaml`.

## 📝 Development Notes

### Auto-Numbering
- Customers: Auto-generates `C{ID}` if code is blank
- Products: Auto-generates `P{ID}` if code is blank
- Invoices: Auto-generates `INV-{ID}` if invoice_no is blank

### Cascading Deletes
- **Customer Delete**: Prevents deletion if invoices exist. Force delete removes customer and all related invoices.
- **Product Delete**: Prevents deletion if product is in invoices. Force delete removes product and all invoices containing it.

### Line Items Auto-Merge
- When adding duplicate products to an invoice, quantities are automatically merged instead of creating separate line items.

### Server-Side Search
- Customer and Product dropdowns use server-side search with debouncing
- Initial load limited to 10 items for better performance
- Search queries executed when user types

### Database Schema
- `country` - Country master data
- `units` - Unit of measurement
- `customer` - Customer information
- `product` - Product catalog
- `invoice` - Invoice headers
- `invoice_line_item` - Invoice line items

## 🐛 Troubleshooting

### Database Connection Error
If you see `relation "invoice" does not exist`:
1. Start DB and apply schema: `npm run docker:db:start`
2. Or manually: `cd database && docker compose up -d && node setup_db.js`
3. Or run schema directly: `cd database && PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f sql/001_schema.sql`
4. If the DB is empty, run seed directly: `cd database && PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f sql/003_seed.sql`
5. To reset from scratch: `cd database && PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f sql/sql_run.sql`

### Port Already in Use
- Change `PORT` in `server/.env` for backend
- Change port in `client/vite.config.js` for frontend
- Change port mapping in `docker-compose.yml` for Docker deployment
- Change port mapping in `database/compose.yaml` for database only

### Adminer not loading or connection failed (http://localhost:8080)
`npm run docker:db:start` starts both the database and Adminer. If you started the DB earlier and Adminer was not running, start it with:
```bash
docker compose -f database/compose.yaml up -d adminer
```
Then open http://localhost:8080 and log in with: System **PostgreSQL**, Server **pgdatabase**, Username **root**, Password **root**, Database **invoices_db**.

### Docker Issues
- **Port conflict**: Stop existing containers using the same ports
- **Build errors**: Check Docker Desktop is running and has enough resources
- **Platform issues**: Docker Compose is configured for `linux/amd64` platform
- See [README.DOCKER.md](./README.DOCKER.md) for detailed troubleshooting

### Windows: "running scripts is disabled" when running npm (PowerShell)
If you see an error like:
`File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system`

**Option A — Keep using PowerShell:** set the execution policy for the current user (run once, no admin required), then `npm run dev` will work:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
npm run dev
```

**Option B — Use Command Prompt instead:** no settings to change. Press **Win + R** → type `cmd` → Enter → `cd` to your project folder (e.g. `InvoiceDoc2\client`) → run `npm run dev` as usual.

## 📚 Additional Documentation

- [README.DOCKER.md](./README.DOCKER.md) - Docker deployment guide
- [GUIDE.md](./GUIDE.md) - Detailed project guide (Thai/English)
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detailed project structure

## For AI assistants

If you are an AI helping on this repo, please read these instruction files first so your behaviour matches the project’s expectations:

- **[AGENTS.md](./AGENTS.md)** – Project-level instructions (e.g. for Codex and other tools that read this file).
- **[.cursor/rules/teaching-juniors.mdc](./.cursor/rules/teaching-juniors.mdc)** – Cursor rule: guide and teach juniors; suggest options instead of doing the whole task for them.

We ask this so that juniors using this repo actually learn: we’d rather they get choices and step-by-step guidance than have everything done for them and learn nothing. It’s for their benefit.

## 📄 License

This project is licensed under the **MIT License**. It is intended as a template for learning and development purposes.
