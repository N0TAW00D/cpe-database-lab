import { http } from "./http.js";

// If backend returns success: false, throw the error message so callers can catch.
function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

export async function listCustomers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/customers${query ? `?${query}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}

export async function getCustomer(code) {
  const res = unwrap(await http(`/api/customers/${encodeURIComponent(code)}`));
  return res.data;
}

export async function listCountries() {
  const res = unwrap(await http("/api/customers/countries"));
  return res.data ?? [];
}

export async function createCustomer(data) {
  const res = unwrap(await http("/api/customers", { method: "POST", body: JSON.stringify(data) }));
  return res.data;
}

export async function updateCustomer(code, data) {
  const res = unwrap(await http(`/api/customers/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) }));
  return res.data;
}

export async function deleteCustomer(code, force = false) {
  const url = `/api/customers/${encodeURIComponent(code)}` + (force ? "?force=true" : "");
  const res = unwrap(await http(url, { method: "DELETE" }));
  return res.data;
}
