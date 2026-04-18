// Invoice CRUD: list (search, pagination, sort), get with line items, create/update/delete. Transactions for create/update.
import { pool } from "../db/pool.js";

export async function getVatRate() {
  const r = await pool.query("SELECT value FROM configuration WHERE key = 'vat_percent'");
  if (r.rowCount > 0) {
    return Number(r.rows[0].value) / 100;
  }
  return 0.07; // Default if not found
}

export async function listInvoices({
  search = "",
  page = 1,
  limit = 10,
  sortBy = "invoice_date",
  sortDir = "desc",
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);

  const allowedSort = ["invoice_no", "customer_name", "invoice_date", "amount_due"];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : "invoice_date";
  const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

  const searchParam = `%${search}%`;

  const countResult = await pool.query(
    `
      SELECT COUNT(*) as total
      FROM invoice i
      JOIN customer c ON c.id = i.customer_id
      WHERE i.invoice_no ILIKE $1 OR c.name ILIKE $1
    `,
    [searchParam],
  );
  const total = Number(countResult.rows[0].total);

  const { rows } = await pool.query(
    `
      SELECT i.invoice_no, i.invoice_date, i.amount_due,
             c.name as customer_name,
             sp.name as sales_person_name
      FROM invoice i
      JOIN customer c ON c.id = i.customer_id
      LEFT JOIN sales_person sp ON sp.id = i.sales_person_id
      WHERE i.invoice_no ILIKE $1 OR c.name ILIKE $1 OR sp.name ILIKE $1
      ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, i.id DESC
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

/** Resolve invoice_no to id (for internal use). */
async function resolveInvoiceId(invoice_no) {
  const r = await pool.query("SELECT id FROM invoice WHERE invoice_no = $1", [invoice_no]);
  return r.rowCount > 0 ? r.rows[0].id : null;
}

export async function getInvoice(idOrInvoiceNo) {
  // Support both id (number) and invoice_no (string) for backward compatibility during migration
  let id = idOrInvoiceNo;
  if (typeof idOrInvoiceNo === "string" && String(idOrInvoiceNo).trim() !== "" && isNaN(Number(idOrInvoiceNo))) {
    id = await resolveInvoiceId(String(idOrInvoiceNo).trim());
    if (id == null) return null;
  } else {
    id = Number(idOrInvoiceNo);
  }

  const header = await pool.query(
    `
      select i.invoice_no, i.invoice_date, i.total_amount, i.total_price, i.total_discount, i.net_price, i.vat, i.vat_rate, i.amount_due,
             c.code as customer_code, c.name as customer_name,
             c.address_line1, c.address_line2,
             co.name as country_name,
             sp.code as sales_person_code, sp.name as sales_person_name
      from invoice i
      join customer c on c.id = i.customer_id
      left join country co on co.id = c.country_id
      left join sales_person sp on sp.id = i.sales_person_id
      where i.id = $1
    `,
    [id],
  );

  if (header.rowCount === 0) return null;

  const lines = await pool.query(
    `
      select li.id,
             p.code as product_code, p.name as product_name,
             u.code as units_code,
             li.quantity, li.unit_price, li.extended_price,
             li.line_discount_percent, li.line_discount_amount, li.line_net_price
      from invoice_line_item li
      join product p on p.id = li.product_id
      join units u on u.id = p.units_id
      where li.invoice_id = $1
      order by li.id
    `,
    [id],
  );

  return { header: header.rows[0], line_items: lines.rows };
}

function roundToSatang(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/** Resolve product_code to id and get unit_price. line_items use product_code (not product_id). */
async function enrichLineItems(client, line_items) {
  const enriched = [];
  for (const li of line_items) {
    const product_code = li.product_code != null ? String(li.product_code).trim() : null;
    if (!product_code) throw new Error("Line item missing product_code");
    const pr = await client.query(
      "SELECT id, unit_price FROM product WHERE code = $1",
      [product_code],
    );
    if (pr.rowCount === 0) throw new Error(`Product not found: ${product_code}`);
    const product_id = pr.rows[0].id;
    const unit_price = li.unit_price ?? Number(pr.rows[0].unit_price ?? 0);
    const quantity = Number(li.quantity || 0);
    const line_discount_percent = Number(li.line_discount_percent || 0);
    
    const extended_price = roundToSatang(quantity * unit_price);
    const line_discount_amount = roundToSatang((line_discount_percent / 100) * extended_price);
    const line_net_price = roundToSatang(extended_price - line_discount_amount);

    enriched.push({ 
      ...li, 
      product_id, 
      unit_price, 
      extended_price,
      line_discount_percent,
      line_discount_amount,
      line_net_price
    });
  }
  return enriched;
}

export async function createInvoice({ invoice_no, customer_code, sales_person_code, invoice_date, vat_rate, line_items }) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const code = customer_code != null ? String(customer_code).trim() : "";
    const cust = await client.query("SELECT id, credit_limit FROM customer WHERE code = $1", [code]);
    if (cust.rowCount === 0) throw new Error(`Customer not found: ${code}`);
    const customer_id = cust.rows[0].id;

    let sales_person_id = null;
    if (sales_person_code) {
      const sp = await client.query("SELECT id FROM sales_person WHERE code = $1", [sales_person_code]);
      if (sp.rowCount > 0) sales_person_id = sp.rows[0].id;
    }

    let resolvedInvoiceNo = invoice_no;
    if (!resolvedInvoiceNo || String(resolvedInvoiceNo).trim() === "") {
      const maxRes = await client.query("SELECT MAX(id) as m FROM invoice");
      const nextId = (maxRes.rows[0].m || 0) + 1;
      resolvedInvoiceNo = `INV-${nextId.toString().padStart(3, "0")}`;
    }

    const enriched = await enrichLineItems(client, line_items);

    const total_price = roundToSatang(enriched.reduce((s, x) => s + x.extended_price, 0));
    const total_discount = roundToSatang(enriched.reduce((s, x) => s + x.line_discount_amount, 0));
    const net_price = roundToSatang(total_price - total_discount);
    const vat_amount = roundToSatang(net_price * vat_rate);
    const amount_due = roundToSatang(net_price + vat_amount);

    if (cust.rows[0].credit_limit != null) {
      const limit = Number(cust.rows[0].credit_limit);
      if (amount_due > limit) {
        throw new Error(`Amount due (${amount_due}) exceeds customer credit limit (${limit}).`);
      }
    }

    const inv = await client.query(
      `
        insert into invoice (id, created_at, invoice_no, invoice_date, customer_id, sales_person_id, total_amount, total_price, total_discount, net_price, vat, vat_rate, amount_due)
        values (
          (select coalesce(max(id),0)+1 from invoice),
          now(),
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
        )
        returning id, invoice_no
      `,
      [resolvedInvoiceNo, invoice_date, customer_id, sales_person_id, total_price, total_price, total_discount, net_price, vat_amount, vat_rate, amount_due],
    );

    const invoice_id = inv.rows[0].id;

    for (const li of enriched) {
      await client.query(
        `
          insert into invoice_line_item (id, created_at, invoice_id, product_id, quantity, unit_price, extended_price, line_discount_percent, line_discount_amount, line_net_price)
          values (
            (select coalesce(max(id),0)+1 from invoice_line_item),
            now(),
            $1,$2,$3,$4,$5,$6,$7,$8
          )
        `,
        [invoice_id, li.product_id, li.quantity, li.unit_price, li.extended_price, li.line_discount_percent, li.line_discount_amount, li.line_net_price],
      );
    }

    await client.query("commit");
    return { invoice_no: inv.rows[0].invoice_no };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteInvoice(idOrInvoiceNo) {
  let id = idOrInvoiceNo;
  if (typeof idOrInvoiceNo === "string" && String(idOrInvoiceNo).trim() !== "" && isNaN(Number(idOrInvoiceNo))) {
    id = await resolveInvoiceId(String(idOrInvoiceNo).trim());
    if (id == null) return null;
  } else {
    id = Number(idOrInvoiceNo);
  }
  await pool.query("delete from invoice where id=$1", [id]);
  return { ok: true };
}

export async function updateInvoice(
  idOrInvoiceNo,
  { invoice_no, customer_code, sales_person_code, invoice_date, vat_rate, line_items },
) {
  let id = idOrInvoiceNo;
  if (typeof idOrInvoiceNo === "string" && String(idOrInvoiceNo).trim() !== "" && isNaN(Number(idOrInvoiceNo))) {
    id = await resolveInvoiceId(String(idOrInvoiceNo).trim());
    if (id == null) return null;
  } else {
    id = Number(idOrInvoiceNo);
  }

  const code = customer_code != null ? String(customer_code).trim() : "";
  const cust = await pool.query("SELECT id, credit_limit FROM customer WHERE code = $1", [code]);
  if (cust.rowCount === 0) throw new Error(`Customer not found: ${code}`);
  const customer_id = cust.rows[0].id;

  let sales_person_id = null;
  if (sales_person_code) {
    const sp = await pool.query("SELECT id FROM sales_person WHERE code = $1", [sales_person_code]);
    if (sp.rowCount > 0) sales_person_id = sp.rows[0].id;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");

    const enriched = await enrichLineItems(client, line_items);

    const total_price = roundToSatang(enriched.reduce((s, x) => s + x.extended_price, 0));
    const total_discount = roundToSatang(enriched.reduce((s, x) => s + x.line_discount_amount, 0));
    const net_price = roundToSatang(total_price - total_discount);
    const vat_amount = roundToSatang(net_price * vat_rate);
    const amount_due = roundToSatang(net_price + vat_amount);

    if (cust.rows[0].credit_limit != null) {
      const limit = Number(cust.rows[0].credit_limit);
      if (amount_due > limit) {
        throw new Error(`Amount due (${amount_due}) exceeds customer credit limit (${limit}).`);
      }
    }

    let resolvedInvoiceNo = (invoice_no != null && String(invoice_no).trim() !== "") ? String(invoice_no).trim() : null;
    if (resolvedInvoiceNo === null) {
      const cur = await client.query("SELECT invoice_no FROM invoice WHERE id=$1", [id]);
      if (cur.rowCount > 0) resolvedInvoiceNo = cur.rows[0].invoice_no;
      else resolvedInvoiceNo = `INV-${id}`;
    }

    await client.query(
      `
        UPDATE invoice 
        SET invoice_no=$1, invoice_date=$2, customer_id=$3, sales_person_id=$4, total_amount=$5, total_price=$6, total_discount=$7, net_price=$8, vat=$9, vat_rate=$10, amount_due=$11
        WHERE id=$12
      `,
      [resolvedInvoiceNo, invoice_date, customer_id, sales_person_id, total_price, total_price, total_discount, net_price, vat_amount, vat_rate, amount_due, id],
    );

    const keptLineIds = line_items.filter((li) => li.id != null && Number(li.id) > 0).map((li) => Number(li.id));

    if (keptLineIds.length > 0) {
      await client.query(
        "DELETE FROM invoice_line_item WHERE invoice_id = $1 AND id != ALL($2::bigint[])",
        [id, keptLineIds],
      );
    } else {
      await client.query("DELETE FROM invoice_line_item WHERE invoice_id = $1", [id]);
    }

    for (const li of enriched) {
      const lineId = li.id != null && Number(li.id) > 0 ? Number(li.id) : null;
      if (lineId) {
        await client.query(
          `
            UPDATE invoice_line_item
            SET product_id=$1, quantity=$2, unit_price=$3, extended_price=$4, line_discount_percent=$5, line_discount_amount=$6, line_net_price=$7
            WHERE id=$8 AND invoice_id=$9
          `,
          [li.product_id, li.quantity, li.unit_price, li.extended_price, li.line_discount_percent, li.line_discount_amount, li.line_net_price, lineId, id],
        );
      } else {
        await client.query(
          `
            INSERT INTO invoice_line_item (id, created_at, invoice_id, product_id, quantity, unit_price, extended_price, line_discount_percent, line_discount_amount, line_net_price)
            VALUES (
              (select coalesce(max(id),0)+1 from invoice_line_item),
              now(),
              $1,$2,$3,$4,$5,$6,$7,$8
            )
          `,
          [id, li.product_id, li.quantity, li.unit_price, li.extended_price, li.line_discount_percent, li.line_discount_amount, li.line_net_price],
        );
      }
    }

    await client.query("commit");
    const inv = await pool.query("SELECT invoice_no FROM invoice WHERE id = $1", [id]);
    return { invoice_no: inv.rows[0]?.invoice_no };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

