// Receipt CRUD: list/get/create/update/delete plus unpaid invoice lookup for the receipt form.
import { pool } from "../db/pool.js";

function roundToSatang(num) {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
}

async function resolveReceiptId(receiptNo) {
  const r = await pool.query("SELECT id FROM receipt WHERE receipt_no = $1", [receiptNo]);
  return r.rowCount > 0 ? r.rows[0].id : null;
}

async function resolveCustomer(client, customer_code) {
  const code = customer_code != null ? String(customer_code).trim() : "";
  const cust = await client.query("SELECT id FROM customer WHERE code = $1", [code]);
  if (cust.rowCount === 0) throw new Error(`Customer not found: ${code}`);
  return cust.rows[0].id;
}

async function nextReceiptNo(client) {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `RCT${year}-`;
  const r = await client.query(
    "SELECT receipt_no FROM receipt WHERE receipt_no LIKE $1 ORDER BY receipt_no DESC LIMIT 1",
    [`${prefix}%`],
  );
  const next = r.rowCount === 0 ? 1 : Number(String(r.rows[0].receipt_no).slice(prefix.length)) + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export async function listReceipts({
  search = "",
  page = 1,
  limit = 10,
  sortBy = "receipt_date",
  sortDir = "desc",
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const allowedSort = ["receipt_no", "customer_name", "receipt_date", "total_amount_received"];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : "receipt_date";
  const sortDirection = sortDir === "asc" ? "ASC" : "DESC";
  const searchParam = `%${search}%`;

  const countResult = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM receipt r
      JOIN customer c ON c.id = r.customer_id
      WHERE r.receipt_no ILIKE $1 OR c.name ILIKE $1 OR c.code ILIKE $1
    `,
    [searchParam],
  );

  const { rows } = await pool.query(
    `
      SELECT r.receipt_no, r.receipt_date, r.total_invoice_amount_due,
             r.total_amount_received, r.total_amount_still_remaining,
             c.code AS customer_code, c.name AS customer_name
      FROM receipt r
      JOIN customer c ON c.id = r.customer_id
      WHERE r.receipt_no ILIKE $1 OR c.name ILIKE $1 OR c.code ILIKE $1
      ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, r.id DESC
      LIMIT $2 OFFSET $3
    `,
    [searchParam, Number(limit), offset],
  );

  const total = Number(countResult.rows[0].total);
  return { data: rows, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
}

export async function listUnpaidInvoices({ customer_code, receipt_no } = {}) {
  const params = [];
  let customerFilter = "";
  if (customer_code) {
    params.push(String(customer_code).trim());
    customerFilter = `AND c.code = $${params.length}`;
  }
  let currentReceiptFilter = "";
  if (receipt_no) {
    params.push(String(receipt_no).trim());
    currentReceiptFilter = `OR cr.receipt_no = $${params.length}`;
  }

  const { rows } = await pool.query(
    `
      WITH paid AS (
        SELECT invoice_id, SUM(receipt_amount) AS paid_amount
        FROM receipt_line_item
        GROUP BY invoice_id
      )
      SELECT i.invoice_no, i.invoice_date, i.amount_due,
             round((i.amount_due - COALESCE(p.paid_amount, 0))::numeric, 2) AS amount_still_remaining,
             c.code AS customer_code, c.name AS customer_name
      FROM invoice i
      JOIN customer c ON c.id = i.customer_id
      LEFT JOIN paid p ON p.invoice_id = i.id
      LEFT JOIN receipt_line_item crli ON crli.invoice_id = i.id
      LEFT JOIN receipt cr ON cr.id = crli.receipt_id
      WHERE (i.amount_due - COALESCE(p.paid_amount, 0) > 0 ${currentReceiptFilter})
        ${customerFilter}
      GROUP BY i.id, c.code, c.name, p.paid_amount
      ORDER BY i.invoice_date, i.invoice_no
    `,
    params,
  );
  return rows;
}

export async function getReceipt(idOrReceiptNo) {
  let id = idOrReceiptNo;
  if (typeof idOrReceiptNo === "string" && String(idOrReceiptNo).trim() !== "" && isNaN(Number(idOrReceiptNo))) {
    id = await resolveReceiptId(String(idOrReceiptNo).trim());
    if (id == null) return null;
  } else {
    id = Number(idOrReceiptNo);
  }

  const header = await pool.query(
    `
      SELECT r.receipt_no, r.receipt_date, r.total_invoice_amount_due,
             r.total_amount_received, r.total_amount_still_remaining,
             c.code AS customer_code, c.name AS customer_name,
             c.address_line1, c.address_line2, co.name AS country_name
      FROM receipt r
      JOIN customer c ON c.id = r.customer_id
      LEFT JOIN country co ON co.id = c.country_id
      WHERE r.id = $1
    `,
    [id],
  );
  if (header.rowCount === 0) return null;

  const lines = await pool.query(
    `
      SELECT rli.id, i.invoice_no, i.invoice_date,
             rli.invoice_amount_due, rli.receipt_amount, rli.invoice_amount_still_remaining
      FROM receipt_line_item rli
      JOIN invoice i ON i.id = rli.invoice_id
      WHERE rli.receipt_id = $1
      ORDER BY rli.id
    `,
    [id],
  );

  return { header: header.rows[0], line_items: lines.rows };
}

async function enrichLineItems(client, customer_id, line_items, receiptIdToIgnore = null) {
  if (!Array.isArray(line_items) || line_items.length === 0) {
    throw new Error("At least one invoice line is required");
  }

  const enriched = [];
  for (const li of line_items) {
    const invoiceNo = li.invoice_no != null ? String(li.invoice_no).trim() : "";
    if (!invoiceNo) throw new Error("Line item missing invoice_no");

    const inv = await client.query(
      `
        SELECT i.id, i.amount_due
        FROM invoice i
        WHERE i.invoice_no = $1 AND i.customer_id = $2
      `,
      [invoiceNo, customer_id],
    );
    if (inv.rowCount === 0) throw new Error(`Invoice not found for selected customer: ${invoiceNo}`);

    const invoice_id = inv.rows[0].id;
    const invoice_amount_due = roundToSatang(inv.rows[0].amount_due);
    const paid = await client.query(
      `
        SELECT COALESCE(SUM(receipt_amount), 0) AS paid_amount
        FROM receipt_line_item
        WHERE invoice_id = $1 AND ($2::bigint IS NULL OR receipt_id <> $2)
      `,
      [invoice_id, receiptIdToIgnore],
    );
    const available = roundToSatang(invoice_amount_due - Number(paid.rows[0].paid_amount || 0));
    const receipt_amount = roundToSatang(li.receipt_amount);
    if (receipt_amount <= 0) throw new Error(`Receipt amount must be positive for ${invoiceNo}`);
    if (receipt_amount > available) {
      throw new Error(`Receipt amount for ${invoiceNo} exceeds remaining balance (${available}).`);
    }
    enriched.push({
      id: li.id,
      invoice_id,
      invoice_no: invoiceNo,
      invoice_amount_due,
      receipt_amount,
      invoice_amount_still_remaining: roundToSatang(available - receipt_amount),
    });
  }
  return enriched;
}

export async function createReceipt({ receipt_no, receipt_date, customer_code, line_items }) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const customer_id = await resolveCustomer(client, customer_code);
    const resolvedReceiptNo = receipt_no && String(receipt_no).trim() ? String(receipt_no).trim() : await nextReceiptNo(client);
    const enriched = await enrichLineItems(client, customer_id, line_items);

    const total_invoice_amount_due = roundToSatang(enriched.reduce((s, x) => s + x.invoice_amount_due, 0));
    const total_amount_received = roundToSatang(enriched.reduce((s, x) => s + x.receipt_amount, 0));
    const total_amount_still_remaining = roundToSatang(enriched.reduce((s, x) => s + x.invoice_amount_still_remaining, 0));

    const rec = await client.query(
      `
        INSERT INTO receipt (receipt_no, receipt_date, customer_id, total_invoice_amount_due, total_amount_received, total_amount_still_remaining)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, receipt_no
      `,
      [resolvedReceiptNo, receipt_date, customer_id, total_invoice_amount_due, total_amount_received, total_amount_still_remaining],
    );

    for (const li of enriched) {
      await client.query(
        `
          INSERT INTO receipt_line_item (receipt_id, invoice_id, invoice_amount_due, receipt_amount, invoice_amount_still_remaining)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [rec.rows[0].id, li.invoice_id, li.invoice_amount_due, li.receipt_amount, li.invoice_amount_still_remaining],
      );
    }

    await client.query("commit");
    return { receipt_no: rec.rows[0].receipt_no };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateReceipt(idOrReceiptNo, { receipt_no, receipt_date, customer_code, line_items }) {
  let id = idOrReceiptNo;
  if (typeof idOrReceiptNo === "string" && String(idOrReceiptNo).trim() !== "" && isNaN(Number(idOrReceiptNo))) {
    id = await resolveReceiptId(String(idOrReceiptNo).trim());
    if (id == null) return null;
  } else {
    id = Number(idOrReceiptNo);
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const customer_id = await resolveCustomer(client, customer_code);
    const current = await client.query("SELECT receipt_no FROM receipt WHERE id = $1", [id]);
    if (current.rowCount === 0) {
      await client.query("rollback");
      return null;
    }
    const resolvedReceiptNo = receipt_no && String(receipt_no).trim() ? String(receipt_no).trim() : current.rows[0].receipt_no;
    const enriched = await enrichLineItems(client, customer_id, line_items, id);
    const total_invoice_amount_due = roundToSatang(enriched.reduce((s, x) => s + x.invoice_amount_due, 0));
    const total_amount_received = roundToSatang(enriched.reduce((s, x) => s + x.receipt_amount, 0));
    const total_amount_still_remaining = roundToSatang(enriched.reduce((s, x) => s + x.invoice_amount_still_remaining, 0));

    await client.query(
      `
        UPDATE receipt
        SET receipt_no = $1, receipt_date = $2, customer_id = $3,
            total_invoice_amount_due = $4, total_amount_received = $5, total_amount_still_remaining = $6
        WHERE id = $7
      `,
      [resolvedReceiptNo, receipt_date, customer_id, total_invoice_amount_due, total_amount_received, total_amount_still_remaining, id],
    );
    await client.query("DELETE FROM receipt_line_item WHERE receipt_id = $1", [id]);
    for (const li of enriched) {
      await client.query(
        `
          INSERT INTO receipt_line_item (receipt_id, invoice_id, invoice_amount_due, receipt_amount, invoice_amount_still_remaining)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [id, li.invoice_id, li.invoice_amount_due, li.receipt_amount, li.invoice_amount_still_remaining],
      );
    }
    await client.query("commit");
    return { receipt_no: resolvedReceiptNo };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteReceipt(idOrReceiptNo) {
  let id = idOrReceiptNo;
  if (typeof idOrReceiptNo === "string" && String(idOrReceiptNo).trim() !== "" && isNaN(Number(idOrReceiptNo))) {
    id = await resolveReceiptId(String(idOrReceiptNo).trim());
    if (id == null) return null;
  } else {
    id = Number(idOrReceiptNo);
  }
  await pool.query("DELETE FROM receipt WHERE id = $1", [id]);
  return { ok: true };
}

export async function receiptReport({
  customer_code = "",
  date_from = "",
  date_to = "",
  page = 1,
  limit = 25,
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  const where = [];
  if (customer_code) {
    params.push(String(customer_code).trim());
    where.push(`c.code = $${params.length}`);
  }
  if (date_from) {
    params.push(date_from);
    where.push(`r.receipt_date >= $${params.length}`);
  }
  if (date_to) {
    params.push(date_to);
    where.push(`r.receipt_date <= $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM receipt r
      JOIN customer c ON c.id = r.customer_id
      ${whereSql}
    `,
    params,
  );
  params.push(Number(limit), offset);
  const { rows } = await pool.query(
    `
      SELECT r.receipt_no, r.receipt_date, c.code AS customer_code, c.name AS customer_name,
             r.total_invoice_amount_due, r.total_amount_received, r.total_amount_still_remaining
      FROM receipt r
      JOIN customer c ON c.id = r.customer_id
      ${whereSql}
      ORDER BY r.receipt_date DESC, r.receipt_no DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params,
  );
  const total = Number(countResult.rows[0].total);
  return { data: rows, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
}
