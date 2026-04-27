import { http } from "./http.js";

// If backend returns success: false, throw the error.message
function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

// Report type (page) -> backend path. All under /api/reports/
const REPORT_ENDPOINTS = {
  "product-sales": "/api/reports/product-sales",
  "monthly-sales": "/api/reports/product-monthly-sales",
  "customer-sales": "/api/reports/customer-sales",
  "receipt-list": "/api/receipts/report/list",
  "invoice-receipts": "/api/reports/invoice-receipts",
};

/**
 * Fetch report data from the backend. Used by the Reports page only; all report API calls go through this layer.
 * @param {string} type - One of "product-sales", "monthly-sales", "customer-sales", "receipt-list", "invoice-receipts"
 * @param {Object} params - Query params: product_code, customer_code, date_from, date_to, year, month, page, limit, sortBy, sortDir
 * @returns {Promise<{ data: Array, meta?: { total, page, limit, totalPages } }>}
 */
export async function getReportData(type, params = {}) {
  const path = REPORT_ENDPOINTS[type] || REPORT_ENDPOINTS["product-sales"];
  const qs = new URLSearchParams();
  const keys = [
    "product_code",
    "customer_code",
    "date_from",
    "date_to",
    "year",
    "month",
    "page",
    "limit",
    "sortBy",
    "sortDir",
  ];
  for (const key of keys) {
    if (params[key] != null && params[key] !== "") {
      qs.set(key, params[key]);
    }
  }
  const queryString = qs.toString();
  const url = path + (queryString ? `?${queryString}` : "");
  const res = unwrap(await http(url));
  return { data: res.data || [], ...(res.meta || {}) };
}
