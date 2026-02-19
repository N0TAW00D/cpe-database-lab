# API layer (calling the backend)

All backend calls go through this folder. Pages and components **never** use `fetch` or `http()` with a path directly; they use the functions exported from the `*.api.js` files here.

## Structure

| File | Role |
|------|------|
| `http.js` | Transport: base URL, `fetch`, and error handling. Other files use `http(path, options)` to send requests. |
| `customers.api.js` | Functions for customer API: `listCustomers`, `getCustomer`, `createCustomer`, etc. |
| `products.api.js` | Functions for product API: `listProducts`, `getProduct`, `createProduct`, etc. |
| `invoices.api.js` | Functions for invoice API: `listInvoices`, `getInvoice`, `createInvoice`, etc. |
| `reports.api.js` | Function for report API: `getReportData(type, params)` for all report types. |

## Pattern

- Each `*.api.js` imports `http` from `http.js`, defines an `unwrap(res)` helper if the backend returns `{ success, data, error }`, and exports functions that return **data** (or `{ data, meta }` for lists).
- Paths and query strings stay inside these files. If the backend changes a path, you only change the corresponding api file.
- Pages import from these files, e.g. `import { getReportData } from "../../api/reports.api.js"`.
