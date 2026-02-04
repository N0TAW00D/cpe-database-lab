// HTTP helper for API calls (ตัวช่วยเรียก API)
// Example usage: http("/api/products")
export const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function http(path, options = {}) {
  // Use relative path if API_BASE is empty or path starts with /
  const baseUrl = API_BASE || (path.startsWith("/") ? "" : "http://localhost:4000");
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
