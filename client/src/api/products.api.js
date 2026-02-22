import { http } from "./http.js";

// If backend returns success: false, throw the error message.
function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

export async function listProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/products${query ? `?${query}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}

export async function getProduct(code) {
  const res = unwrap(await http(`/api/products/${encodeURIComponent(code)}`));
  return res.data;
}

export async function listUnits() {
  const res = unwrap(await http("/api/products/units"));
  return res.data ?? [];
}

export async function createProduct(data) {
  const res = unwrap(await http("/api/products", { method: "POST", body: JSON.stringify(data) }));
  return res.data;
}

export async function updateProduct(code, data) {
  const res = unwrap(await http(`/api/products/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) }));
  return res.data;
}

export async function deleteProduct(code, force = false) {
  const url = `/api/products/${encodeURIComponent(code)}` + (force ? "?force=true" : "");
  const res = unwrap(await http(url, { method: "DELETE" }));
  return res.data;
}
