// Product API wrapper (ชุดเรียก API สำหรับสินค้า)
// Example usage: listProducts().then(setProducts)
import { http } from "./http.js";

export function listProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return http(`/api/products${query ? `?${query}` : ''}`);
}

export function getProduct(id) {
  return http(`/api/products/${id}`);
}

export function listUnits() {
  return http("/api/products/units");
}

export function createProduct(data) {
  return http("/api/products", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateProduct(id, data) {
  return http(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteProduct(id, force = false) {
  const url = `/api/products/${id}` + (force ? "?force=true" : "");
  return http(url, { method: "DELETE" });
}
