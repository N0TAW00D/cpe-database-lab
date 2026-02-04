// Customer API wrapper (ชุดเรียก API สำหรับลูกค้า)
// Example usage: listCustomers().then(setCustomers)
import { http } from "./http.js";

export function listCustomers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return http(`/api/customers${query ? `?${query}` : ''}`);
}

export function getCustomer(id) {
  return http(`/api/customers/${id}`);
}

export function listCountries() {
  return http("/api/customers/countries");
}

export function createCustomer(data) {
  return http("/api/customers", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateCustomer(id, data) {
  return http(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteCustomer(id, force = false) {
  const url = `/api/customers/${id}` + (force ? "?force=true" : "");
  return http(url, { method: "DELETE" });
}
