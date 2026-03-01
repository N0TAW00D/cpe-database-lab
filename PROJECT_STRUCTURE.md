# Project Structure and Documentation

## Overview
This project is an Invoice Management System with full CRUD for Customers, Products, and Invoices, plus Reports.
Stack: React (Vite) frontend, Node.js/Express backend, PostgreSQL.

## Directory Structure

### `client/`
Frontend (React 18, Vite 5).

- **`src/api/`** – API client layer (all backend calls go through here).
  - `http.js`: shared `fetch` wrapper and error handling.
  - `customers.api.js`, `products.api.js`, `invoices.api.js`, `reports.api.js`: list/get/create/update/delete and report data.
- **`src/components/`** – Reusable UI.
  - `DataList.jsx`: table with server-side search, sort, pagination; used by Invoice/Customer/Product lists.
  - `InvoiceForm.jsx`: invoice header + line items form (create/edit).
  - `LineItemsEditor.jsx`: line items table (add/remove/reorder, insert row between).
  - `SearchableSelect.jsx`: searchable dropdown (customer/product).
  - `Modal.jsx`: ConfirmModal, AlertModal.
  - `ReportTable.jsx`, `Loading.jsx`.
- **`src/pages/`** – Page-level views.
  - **`invoices/`**: `InvoiceList.jsx` (list), `InvoicePage.jsx` (view/create/edit by route).
  - **`customers/`**: `CustomerList.jsx`, `CustomerPage.jsx` (view/create/edit).
  - **`products/`**: `ProductList.jsx`, `ProductPage.jsx` (view/create/edit).
  - **`reports/`**: `Reports.jsx` (Product Sales, Monthly Sales, Customer Buying); `filters/` for filter components and pagination.
- **`src/main.jsx`** – App entry, routes, sidebar layout.
- **`src/index.css`** – Global styles and CSS variables.
- **`src/utils.js`** – formatBaht, formatDate.

### `server/`
Backend (Express 4, Node 20).

- **`src/controllers/`** – Request handlers (validate, call services, send response).
  - `invoices.controller.js`, `reports.controller.js`; customers/products are in services.
- **`src/routes/`** – Express route definitions.
  - `customers.routes.js`, `products.routes.js`, `invoices.routes.js`, `reports.routes.js`.
- **`src/services/`** – Business logic and DB queries (parameterized; no raw SQL concatenation).
  - `customers.service.js`, `products.service.js`, `invoices.service.js`, `reports.service.js`.
- **`src/models/`** – Zod schemas (e.g. invoice create/update).
- **`src/db/pool.js`** – PostgreSQL connection pool.
- **`src/utils/`** – Response helpers (e.g. success/error).
- **`src/app.js`** – Express app and middleware.

### `database/`
PostgreSQL schema and seed data.

- **`init/`** – `01_schema.sql` (schema only, run on first container start).
- **`sql/`** – `001_schema.sql`, `003_seed.sql`, `sql_run.sql` (full reset), `002_import_csv.sql`.
- **`data/`** – CSV test data.
- **`compose.yaml`** – Database-only Docker Compose.
- **`setup_db.sh`**, **`generate_sql_run.py`** – Run schema + conditional seed, or generate reset SQL from CSV.

### Root
- **`docker-compose.yml`** – Full stack (database + server + client).
- **`README.md`** – Quick start, structure, API summary, troubleshooting.
- **`PROJECT_STRUCTURE.md`** – This file.
- **`GUIDE.md`** – Project guide (Thai/English).
- **`AGENTS.md`** – Instructions for AI assistants (teaching juniors).

## Key Features

- **Auto-numbering**: Customers `C{id}`, Products `P{id}`, Invoices `INV-{id}` when code/no is blank.
- **Cascading deletes**: Customer/Product delete can force-delete related invoices (with confirmation).
- **Reports**: Three report types with filters (date, product, customer, year/month); data and pagination/sort on backend.
- **Security**: Parameterized queries only; no SQL injection from user input.

## Environment Variables

- **Server**: `PORT`, `HOST`, `DATABASE_URL`.
- **Client**: `VITE_API_BASE` (backend API URL).
