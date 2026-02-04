// Invoice controller (ตรรกะจัดการใบแจ้งหนี้)
// Example usage: listInvoices -> GET /api/invoices
import { pool } from "../db/pool.js";
import { z } from "zod";

// Schema validation for creating/updating invoices
const CreateInvoiceSchema = z.object({
  invoice_no: z.string().optional(), // Optional for auto-generation
  customer_id: z.number().int(),
  invoice_date: z.string().min(8), // YYYY-MM-DD
  vat_rate: z.number().min(0).max(1).default(0.07),
  line_items: z.array(z.object({
    product_id: z.number().int(),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative().optional()
  })).min(1)
});

// GET list of invoices with pagination, search, sort
export async function listInvoices(req, res) {
  const { search = '', page = 1, limit = 10, sortBy = 'invoice_date', sortDir = 'desc' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  
  // Allowed sort columns
  const allowedSort = ['invoice_no', 'customer_name', 'invoice_date', 'amount_due'];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'invoice_date';
  const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

  // Build WHERE clause for search
  const searchParam = `%${search}%`;
  
  // Count total
  const countResult = await pool.query(`
    SELECT COUNT(*) as total
    FROM invoice i
    JOIN customer c ON c.id = i.customer_id
    WHERE i.invoice_no ILIKE $1 OR c.name ILIKE $1
  `, [searchParam]);
  const total = Number(countResult.rows[0].total);

  // Get paginated data
  const { rows } = await pool.query(`
    SELECT i.id, i.invoice_no, i.invoice_date, i.amount_due,
           c.name as customer_name
    FROM invoice i
    JOIN customer c ON c.id = i.customer_id
    WHERE i.invoice_no ILIKE $1 OR c.name ILIKE $1
    ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, i.id DESC
    LIMIT $2 OFFSET $3
  `, [searchParam, Number(limit), offset]);

  res.json({
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit))
  });
}

// GET single invoice with header + line items
export async function getInvoice(req, res) {
  const id = Number(req.params.id);

  const header = await pool.query(`
    select i.*, c.code as customer_code, c.name as customer_name,
           c.address_line1, c.address_line2,
           co.name as country_name
    from invoice i
    join customer c on c.id = i.customer_id
    left join country co on co.id = c.country_id
    where i.id = $1
  `, [id]);

  if (header.rowCount === 0) return res.status(404).json({ error: "Invoice not found" });

  const lines = await pool.query(`
    select li.id, li.product_id, p.code as product_code, p.name as product_name,
           u.code as units_code,
           li.quantity, li.unit_price, li.extended_price
    from invoice_line_item li
    join product p on p.id = li.product_id
    join units u on u.id = p.units_id
    where li.invoice_id = $1
    order by li.id
  `, [id]);

  res.json({ header: header.rows[0], line_items: lines.rows });
}

// POST create invoice (auto invoice_no if blank)
export async function createInvoice(req, res) {
  const parsed = CreateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Use let so we can modify invoice_no
  let { invoice_no, customer_id, invoice_date, vat_rate, line_items } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("begin");

    // Auto-generate invoice number if empty
    if (!invoice_no || invoice_no.trim() === "") {
      const maxRes = await client.query("SELECT MAX(id) as m FROM invoice");
      const nextId = (maxRes.rows[0].m || 0) + 1;
      invoice_no = `INV-${nextId.toString().padStart(3, '0')}`;
    }

    const enriched = [];
    for (const li of line_items) {
      const pr = await client.query(`select unit_price from product where id=$1`, [li.product_id]);
      if (pr.rowCount === 0) throw new Error(`product_id ${li.product_id} not found`);
      const unit_price = (li.unit_price ?? Number(pr.rows[0].unit_price ?? 0));
      const extended_price = Number(li.quantity) * Number(unit_price);
      enriched.push({ ...li, unit_price, extended_price });
    }

    const total = enriched.reduce((s, x) => s + x.extended_price, 0);
    const vat = total * vat_rate;
    const amount_due = total + vat;

    const inv = await client.query(`
      insert into invoice (id, created_at, invoice_no, invoice_date, customer_id, total_amount, vat, amount_due)
      values (
        (select coalesce(max(id),0)+1 from invoice),
        now(),
        $1,$2,$3,$4,$5,$6
      )
      returning id
    `, [invoice_no, invoice_date, customer_id, total, vat, amount_due]);

    const invoice_id = inv.rows[0].id;

    for (const li of enriched) {
      await client.query(`
        insert into invoice_line_item (id, created_at, invoice_id, product_id, quantity, unit_price, extended_price)
        values (
          (select coalesce(max(id),0)+1 from invoice_line_item),
          now(),
          $1,$2,$3,$4,$5
        )
      `, [invoice_id, li.product_id, li.quantity, li.unit_price, li.extended_price]);
    }

    await client.query("commit");
    res.status(201).json({ id: invoice_id });
  } catch (e) {
    await client.query("rollback");
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    client.release();
  }
}

// DELETE invoice by id
export async function deleteInvoice(req, res) {
  const id = Number(req.params.id);
  await pool.query(`delete from invoice where id=$1`, [id]);
  res.json({ ok: true });
}

// PUT update invoice header + replace line items
export async function updateInvoice(req, res) {
  const id = Number(req.params.id);
  const parsed = CreateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { invoice_no, customer_id, invoice_date, vat_rate, line_items } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("begin");

    // Prepare line items
    const enriched = [];
    for (const li of line_items) {
      const pr = await client.query(`select unit_price from product where id=$1`, [li.product_id]);
      if (pr.rowCount === 0) throw new Error(`product_id ${li.product_id} not found`);
      const unit_price = (li.unit_price ?? Number(pr.rows[0].unit_price ?? 0));
      const extended_price = Number(li.quantity) * Number(unit_price);
      enriched.push({ ...li, unit_price, extended_price });
    }

    const total = enriched.reduce((s, x) => s + x.extended_price, 0);
    const vat = total * vat_rate;
    const amount_due = total + vat;

    // Update Header
    await client.query(`
            UPDATE invoice 
            SET invoice_no=$1, invoice_date=$2, customer_id=$3, total_amount=$4, vat=$5, amount_due=$6
            WHERE id=$7
        `, [invoice_no, invoice_date, customer_id, total, vat, amount_due, id]);

    // Delete existing lines
    await client.query(`DELETE FROM invoice_line_item WHERE invoice_id=$1`, [id]);

    // Insert new lines
    for (const li of enriched) {
      await client.query(`
                INSERT INTO invoice_line_item (id, created_at, invoice_id, product_id, quantity, unit_price, extended_price)
                VALUES (
                    (select coalesce(max(id),0)+1 from invoice_line_item),
                    now(),
                    $1,$2,$3,$4,$5
                )
            `, [id, li.product_id, li.quantity, li.unit_price, li.extended_price]);
    }

    await client.query("commit");
    res.json({ id });
  } catch (e) {
    await client.query("rollback");
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    client.release();
  }
}
