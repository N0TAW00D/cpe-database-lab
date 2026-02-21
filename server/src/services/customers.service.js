// Customer CRUD and list (search by code/name/address, pagination, sort). Parameterized queries only.
import { pool } from "../db/pool.js";

export async function listCustomers({
  search = "",
  page = 1,
  limit = 10,
  sortBy = "name",
  sortDir = "asc",
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);

  const allowedSort = ["code", "name", "address_line1", "credit_limit"];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : "name";
  const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

  const searchParam = `%${search}%`;

  const countResult = await pool.query(
    `
      SELECT COUNT(*) as total FROM customer
      WHERE code ILIKE $1 OR name ILIKE $1 OR address_line1 ILIKE $1
    `,
    [searchParam],
  );
  const total = Number(countResult.rows[0].total);

  const { rows } = await pool.query(
    `
      SELECT code, name, address_line1, address_line2, country_id, credit_limit, created_at
      FROM customer
      WHERE code ILIKE $1 OR name ILIKE $1 OR address_line1 ILIKE $1
      ORDER BY ${sortColumn} ${sortDirection} NULLS LAST
      LIMIT $2 OFFSET $3
    `,
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

export async function createCustomer({
  code,
  name,
  address_line1,
  address_line2,
  country_id,
  credit_limit,
} = {}) {
  let resolvedCode = code;

  if (!resolvedCode || String(resolvedCode).trim() === "") {
    const maxRes = await pool.query("SELECT MAX(id) as m FROM customer");
    const nextId = (maxRes.rows[0].m || 0) + 1;
    resolvedCode = `C${nextId.toString().padStart(3, "0")}`;
  }

  await pool.query(
    "INSERT INTO customer (code, name, address_line1, address_line2, country_id, credit_limit) VALUES ($1, $2, $3, $4, $5, $6)",
    [resolvedCode, name, address_line1, address_line2, country_id, credit_limit],
  );

  return { code: resolvedCode };
}

export async function updateCustomer(
  id,
  { code, name, address_line1, address_line2, country_id, credit_limit } = {},
) {
  // If code is empty (e.g. frontend "auto" on edit), keep existing to avoid unique constraint
  let resolvedCode = (code != null && String(code).trim() !== "") ? String(code).trim() : null;
  if (resolvedCode === null) {
    const cur = await pool.query("SELECT code FROM customer WHERE id=$1", [id]);
    resolvedCode = cur.rowCount > 0 ? cur.rows[0].code : `C${id}`;
  }
  await pool.query(
    "UPDATE customer SET code=$1, name=$2, address_line1=$3, address_line2=$4, country_id=$5, credit_limit=$6 WHERE id=$7",
    [resolvedCode, name, address_line1, address_line2, country_id, credit_limit, id],
  );
  return { ok: true };
}

export async function deleteCustomer(id, { force = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    if (force) {
      const invs = await client.query("SELECT id FROM invoice WHERE customer_id=$1", [id]);
      const invIds = invs.rows.map((i) => i.id);

      if (invIds.length > 0) {
        await client.query("DELETE FROM invoice_line_item WHERE invoice_id = ANY($1::int[])", [invIds]);
        await client.query("DELETE FROM invoice WHERE id = ANY($1::int[])", [invIds]);
      }
    }

    await client.query("DELETE FROM customer WHERE id=$1", [id]);
    await client.query("commit");
    return { ok: true };
  } catch (err) {
    await client.query("rollback");
    if (err?.code === "23503") {
      const e = new Error("Cannot delete customer because they have existing invoices.");
      e.statusCode = 400;
      throw e;
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function listCountries() {
  const { rows } = await pool.query("SELECT id, code, name FROM country ORDER BY name");
  return { data: rows };
}

export async function getCustomerById(id) {
  const { rows } = await pool.query(
    `SELECT c.code, c.name, c.address_line1, c.address_line2, c.country_id, c.credit_limit, c.created_at,
            co.code AS country_code, co.name AS country_name
     FROM customer c
     LEFT JOIN country co ON co.id = c.country_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Get customer by business key (code). Used by API so frontend does not send primary key. */
export async function getCustomerByCode(code) {
  if (!code || String(code).trim() === "") return null;
  const { rows } = await pool.query(
    `SELECT c.code, c.name, c.address_line1, c.address_line2, c.country_id, c.credit_limit, c.created_at,
            co.code AS country_code, co.name AS country_name
     FROM customer c
     LEFT JOIN country co ON co.id = c.country_id
     WHERE c.code = $1`,
    [String(code).trim()]
  );
  return rows[0] ?? null;
}

/** Resolve customer code to id (internal use only; id never sent to client). */
export async function resolveCustomerId(code) {
  const r = await pool.query("SELECT id FROM customer WHERE code = $1", [String(code).trim()]);
  return r.rowCount > 0 ? r.rows[0].id : null;
}

export async function updateCustomerByCode(code, body) {
  const id = await resolveCustomerId(code);
  if (id == null) return null;
  await updateCustomer(id, body);
  return { ok: true };
}

export async function deleteCustomerByCode(code, opts = {}) {
  const id = await resolveCustomerId(code);
  if (id == null) return null;
  await deleteCustomer(id, opts);
  return { ok: true };
}

