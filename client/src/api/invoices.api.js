// Invoice API wrapper (ชุดเรียก API สำหรับใบแจ้งหนี้)
// Example usage: createInvoice(payload).then(({ id }) => ...)
import { http } from "./http.js";

export function listInvoices(params = {}) {
  const query = new URLSearchParams(params).toString();
  return http(`/api/invoices${query ? `?${query}` : ''}`);
}

export function getInvoice(id) {
  return http(`/api/invoices/${id}`);
}

export function createInvoice(payload) {
  return http("/api/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteInvoice(id) {
  return http(`/api/invoices/${id}`, { method: "DELETE" });
}

export function updateInvoice(id, payload) {
  return http(`/api/invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
