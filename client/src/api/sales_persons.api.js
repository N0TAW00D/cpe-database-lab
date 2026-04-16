import { http } from "./http.js";

function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

export async function listSalesPersons(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/sales-persons${query ? `?${query}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}

export async function getSalesPerson(code) {
  const res = unwrap(await http(`/api/sales-persons/${encodeURIComponent(code)}`));
  return res.data;
}

export async function deleteSalesPerson(code) {
  const res = unwrap(await http(`/api/sales-persons/${encodeURIComponent(code)}`, { method: "DELETE" }));
  return res.data;
}
