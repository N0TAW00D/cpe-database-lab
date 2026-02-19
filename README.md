# InvoiceDoc v2

A full-stack Invoice Management System built with React, Express, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+) - for local development
- Docker Desktop - for Docker deployment or database only
- npm or yarn

### Option 1: Docker Deployment (Recommended)

Run everything with Docker Compose:

```bash
# Start all services (database, server, client)
./docker-start.sh

# Or using npm
npm run docker:start

# Or using docker-compose directly
docker-compose up -d --build
```

**Access URLs:**
- Client: http://localhost:3000
- Server API: http://localhost:4000
- Database: localhost:15432
- Adminer (DB Admin): http://localhost:8080

**Useful Commands:**
```bash
# Stop services
./docker-stop.sh
# or
npm run docker:stop

# View logs
./docker-logs.sh
# or view specific service
./docker-logs.sh server

# Check status
docker-compose ps
```

For detailed Docker documentation, see [README.DOCKER.md](./README.DOCKER.md)

### Option 2: Local Development Setup

#### 1. Database Setup

Start PostgreSQL using Docker Compose:

```bash
cd database
docker-compose up -d
```

Run the database setup script:

```bash
./setup_db.sh
```

Or manually run SQL:

```bash
PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f sql/sql_run.sql
```

**Database Access:**
- Host: `localhost:15432`
- Database: `invoices_db`
- Username: `root`
- Password: `root`
- Adminer (Web UI): http://localhost:8080

#### 2. Server Setup

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Server runs on: http://localhost:4000

**Environment Variables:**
- `PORT`: Server port (default: 4000)
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://root:root@localhost:15432/invoices_db`)

#### 3. Client Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Client runs on: http://localhost:5173

**Environment Variables:**
- `VITE_API_BASE`: Backend API URL (default: `http://localhost:4000`)

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
│   ├── init/                    # 01_schema.sql (run on first start)
│   ├── sql/                     # sql_run.sql (schema + seed), 002_import_csv.sql
│   ├── data/                    # CSV test data
│   ├── compose.yaml             # Database-only Docker Compose
│   ├── setup_db.sh              # Run schema/seed against running DB
│   └── generate_sql_run.py      # Generate sql_run.sql from CSV
├── docker-compose.yml           # Full stack (database + server + client)
├── docker-compose.coolify.yml   # Server + client only (DB via env)
├── docker-start.sh
├── docker-stop.sh
├── docker-logs.sh
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
1. Make sure Docker container is running: `docker-compose ps`
2. Run the setup script: `./setup_db.sh`
3. Or manually run SQL: `psql -h localhost -p 15432 -U root -d invoices_db -f sql/sql_run.sql`

### Port Already in Use
- Change `PORT` in `server/.env` for backend
- Change port in `client/vite.config.js` for frontend
- Change port mapping in `docker-compose.yml` for Docker deployment
- Change port mapping in `database/compose.yaml` for database only

### Docker Issues
- **Port conflict**: Stop existing containers using the same ports
- **Build errors**: Check Docker Desktop is running and has enough resources
- **Platform issues**: Docker Compose is configured for `linux/amd64` platform
- See [README.DOCKER.md](./README.DOCKER.md) for detailed troubleshooting

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

This project is a template for learning and development purposes.
