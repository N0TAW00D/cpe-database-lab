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
  const { rows } = await pool.query("SELECT * FROM sales_person WHERE code = $1", [code]);
  return rows[0] || null;
}

export async function deleteSalesPersonByCode(code) {
  const { rowCount } = await pool.query("DELETE FROM sales_person WHERE code = $1", [code]);
  return rowCount > 0;
}
