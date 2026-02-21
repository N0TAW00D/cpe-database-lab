// Report queries: sales by product, monthly sales, customer buying. All filters via parameterized queries.
import { pool } from "../db/pool.js";

export async function getInvoicesMonthlySummary() {
  const { rows } = await pool.query(`
    select i.invoice_no, i.invoice_date, c.name as customer_name, i.amount_due
    from invoice i
    join customer c on c.id = i.customer_id
    order by i.invoice_date desc
    limit 20
  `);
  return { data: rows };
}

export async function getSalesByProductSummary({
  product_id,
  product_code,
  date_from,
  date_to,
  page = 1,
  limit = 10,
  sortBy = "value_sold",
  sortDir = "desc",
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  let resolvedProductId = product_id;
  if (!resolvedProductId && product_code) {
    const r = await pool.query("SELECT id FROM product WHERE code = $1", [String(product_code).trim()]);
    if (r.rowCount > 0) resolvedProductId = r.rows[0].id;
  }

  let whereClause = "WHERE 1=1";
  const params = [];
  let paramIndex = 1;

  if (resolvedProductId) {
    whereClause += ` AND p.id = $${paramIndex++}`;
    params.push(resolvedProductId);
  }
  if (date_from) {
    whereClause += ` AND i.invoice_date >= $${paramIndex++}`;
    params.push(date_from);
  }
  if (date_to) {
    whereClause += ` AND i.invoice_date <= $${paramIndex++}`;
    params.push(date_to);
  }

  const allowedSort = {
    product_code: "p.code",
    product_name: "p.name",
    quantity_sold: "SUM(li.quantity)",
    value_sold: "SUM(li.extended_price)",
  };
  const sortColumn = allowedSort[sortBy] || allowedSort.value_sold;
  const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

  const countResult = await pool.query(
    `
      SELECT COUNT(DISTINCT p.id) as total
      FROM invoice_line_item li
      JOIN product p ON p.id = li.product_id
      JOIN invoice i ON i.id = li.invoice_id
      ${whereClause}
    `,
    params,
  );
  const total = Number(countResult.rows[0].total);

  const { rows } = await pool.query(
    `
      SELECT p.code as product_code, p.name as product_name,
             SUM(li.quantity) as quantity_sold,
             SUM(li.extended_price) as value_sold
      FROM invoice_line_item li
      JOIN product p ON p.id = li.product_id
      JOIN invoice i ON i.id = li.invoice_id
      ${whereClause}
      GROUP BY p.id, p.code, p.name
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `,
    [...params, Number(limit), offset],
  );

  return {
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

export async function getSalesByCustomerSummary({
  product_id,
  product_code,
  customer_id,
  customer_code,
  date_from,
  date_to,
  page = 1,
  limit = 10,
  sortBy = "product_code",
  sortDir = "asc",
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  let resolvedProductId = product_id;
  if (!resolvedProductId && product_code) {
    const r = await pool.query("SELECT id FROM product WHERE code = $1", [String(product_code).trim()]);
    if (r.rowCount > 0) resolvedProductId = r.rows[0].id;
  }
  let resolvedCustomerId = customer_id;
  if (!resolvedCustomerId && customer_code) {
    const r = await pool.query("SELECT id FROM customer WHERE code = $1", [String(customer_code).trim()]);
    if (r.rowCount > 0) resolvedCustomerId = r.rows[0].id;
  }

  let whereClause = "WHERE 1=1";
  const params = [];
  let paramIndex = 1;

  if (resolvedProductId) {
    whereClause += ` AND p.id = $${paramIndex++}`;
    params.push(resolvedProductId);
  }
  if (resolvedCustomerId) {
    whereClause += ` AND c.id = $${paramIndex++}`;
    params.push(resolvedCustomerId);
  }
  if (date_from) {
    whereClause += ` AND i.invoice_date >= $${paramIndex++}`;
    params.push(date_from);
  }
  if (date_to) {
    whereClause += ` AND i.invoice_date <= $${paramIndex++}`;
    params.push(date_to);
  }

  const allowedSort = {
    product_code: "p.code",
    product_name: "p.name",
    customer_code: "c.code",
    customer_name: "c.name",
    quantity_sold: "SUM(li.quantity)",
    value_sold: "SUM(li.extended_price)",
  };
  const sortColumn = allowedSort[sortBy] || allowedSort.product_code;
  const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

  const countResult = await pool.query(
    `
      SELECT COUNT(*) as total FROM (
        SELECT 1 FROM invoice i
        JOIN customer c ON c.id = i.customer_id
        JOIN invoice_line_item li ON li.invoice_id = i.id
        JOIN product p ON p.id = li.product_id
        ${whereClause}
        GROUP BY p.id, c.id
      ) sub
    `,
    params,
  );
  const total = Number(countResult.rows[0].total);

  const { rows } = await pool.query(
    `
      SELECT p.code as product_code, p.name as product_name,
             c.code as customer_code, c.name as customer_name,
             SUM(li.quantity) as quantity_sold,
             SUM(li.extended_price) as value_sold
      FROM invoice i
      JOIN customer c ON c.id = i.customer_id
      JOIN invoice_line_item li ON li.invoice_id = i.id
      JOIN product p ON p.id = li.product_id
      ${whereClause}
      GROUP BY p.id, p.code, p.name, c.id, c.code, c.name
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `,
    [...params, Number(limit), offset],
  );

  return {
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

export async function getSalesByProductMonthlySummary({
  product_id,
  product_code,
  year,
  month,
  date_from,
  date_to,
  page = 1,
  limit = 10,
  sortBy = "year",
  sortDir = "desc",
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  let resolvedProductId = product_id;
  if (!resolvedProductId && product_code) {
    const r = await pool.query("SELECT id FROM product WHERE code = $1", [String(product_code).trim()]);
    if (r.rowCount > 0) resolvedProductId = r.rows[0].id;
  }

  let whereClause = "WHERE 1=1";
  const params = [];
  let paramIndex = 1;

  if (resolvedProductId) {
    whereClause += ` AND p.id = $${paramIndex++}`;
    params.push(resolvedProductId);
  }
  if (year) {
    whereClause += ` AND EXTRACT(year FROM i.invoice_date) = $${paramIndex++}`;
    params.push(year);
  }
  if (month) {
    whereClause += ` AND EXTRACT(month FROM i.invoice_date) = $${paramIndex++}`;
    params.push(month);
  }
  if (date_from) {
    whereClause += ` AND i.invoice_date >= $${paramIndex++}`;
    params.push(date_from);
  }
  if (date_to) {
    whereClause += ` AND i.invoice_date <= $${paramIndex++}`;
    params.push(date_to);
  }

  const allowedSort = {
    year: "year",
    month: "month",
    product_code: "p.code",
    product_name: "p.name",
    quantity_sold: "SUM(li.quantity)",
    value_sold: "SUM(li.extended_price)",
  };
  const sortColumn = allowedSort[sortBy] || allowedSort.year;
  const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

  const countResult = await pool.query(
    `
      SELECT COUNT(*) as total FROM (
        SELECT 1 FROM invoice_line_item li
        JOIN invoice i ON i.id = li.invoice_id
        JOIN product p ON p.id = li.product_id
        ${whereClause}
        GROUP BY EXTRACT(year FROM i.invoice_date), EXTRACT(month FROM i.invoice_date), p.id
      ) sub
    `,
    params,
  );
  const total = Number(countResult.rows[0].total);

  const yearMonthSecondaryOrder =
    sortBy === "year" && sortDir === "desc"
      ? ", month DESC"
      : sortBy === "year"
        ? ", month ASC"
        : sortBy === "month" && sortDir === "desc"
          ? ", year DESC"
          : sortBy === "month"
            ? ", year ASC"
            : "";
  const extraFallbackOrder = !["year", "month"].includes(sortBy) ? ", year DESC, month DESC" : "";

  const { rows } = await pool.query(
    `
      SELECT
        EXTRACT(year FROM i.invoice_date) as year,
        EXTRACT(month FROM i.invoice_date) as month,
        p.code as product_code,
        p.name as product_name,
        SUM(li.quantity) as quantity_sold,
        SUM(li.extended_price) as value_sold
      FROM invoice_line_item li
      JOIN invoice i ON i.id = li.invoice_id
      JOIN product p ON p.id = li.product_id
      ${whereClause}
      GROUP BY year, month, p.id, p.code, p.name
      ORDER BY ${sortColumn} ${sortDirection}${yearMonthSecondaryOrder}${extraFallbackOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `,
    [...params, Number(limit), offset],
  );

  return {
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

