import { pool } from "../db/pool.js";

export async function listSalesPersons({
  search = "",
  page = 1,
  limit = 10,
  sortBy = "code",
  sortDir = "asc",
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const searchParam = `%${search}%`;

  const allowedSort = ["code", "name", "start_work_date"];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : "code";
  const sortDirection = sortDir === "desc" ? "DESC" : "ASC";

  const countResult = await pool.query(
    "SELECT COUNT(*) as total FROM sales_person WHERE code ILIKE $1 OR name ILIKE $1",
    [searchParam],
  );
  const total = Number(countResult.rows[0].total);

  const { rows } = await pool.query(
    `SELECT * FROM sales_person WHERE code ILIKE $1 OR name ILIKE $1 ORDER BY ${sortColumn} ${sortDirection} LIMIT $2 OFFSET $3`,
    [searchParam, Number(limit), offset],
  );

  return {
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

export async function getSalesPersonByCode(code) {
  if (!code || String(code).trim() === "") return null;
  const { rows } = await pool.query("SELECT * FROM sales_person WHERE code = $1", [String(code).trim()]);
  return rows[0] || null;
}

export async function createSalesPerson({ code, name, start_work_date } = {}) {
  let resolvedCode = code;

  if (!resolvedCode || String(resolvedCode).trim() === "") {
    const maxRes = await pool.query("SELECT MAX(id) as m FROM sales_person");
    const nextId = (maxRes.rows[0].m || 0) + 1;
    resolvedCode = `SP${nextId.toString().padStart(3, "0")}`;
  }

  const { rows } = await pool.query(
    "INSERT INTO sales_person (code, name, start_work_date) VALUES ($1, $2, $3) RETURNING *",
    [resolvedCode, name, start_work_date || null]
  );
  return rows[0];
}

export async function updateSalesPersonByCode(code, { name, start_work_date } = {}) {
  const { rows } = await pool.query(
    "UPDATE sales_person SET name = $1, start_work_date = $2 WHERE code = $3 RETURNING *",
    [name, start_work_date || null, code]
  );
  return rows[0] || null;
}

export async function deleteSalesPersonByCode(code) {
  const { rowCount } = await pool.query("DELETE FROM sales_person WHERE code = $1", [code]);
  return rowCount > 0;
}
