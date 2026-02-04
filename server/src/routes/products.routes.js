// Product routes (เส้นทาง API สำหรับสินค้า)
// Example usage: GET /api/products
import { Router } from "express";
import { pool } from "../db/pool.js";

const r = Router();

// List products with pagination, search, sort
r.get("/", async (req, res) => {
  const { search = '', page = 1, limit = 10, sortBy = 'code', sortDir = 'asc' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  
  const allowedSort = ['code', 'name', 'units_code', 'unit_price'];
  const sortColumn = allowedSort.includes(sortBy) ? (sortBy === 'units_code' ? 'u.code' : `p.${sortBy}`) : 'p.code';
  const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';
  
  const searchParam = `%${search}%`;
  
  // Count total
  const countResult = await pool.query(`
    SELECT COUNT(*) as total
    FROM product p
    JOIN units u ON u.id = p.units_id
    WHERE p.code ILIKE $1 OR p.name ILIKE $1 OR u.code ILIKE $1
  `, [searchParam]);
  const total = Number(countResult.rows[0].total);

  // Get paginated data
  const { rows } = await pool.query(`
    SELECT p.id, p.code, p.name, p.unit_price, u.code as units_code, p.units_id
    FROM product p
    JOIN units u ON u.id = p.units_id
    WHERE p.code ILIKE $1 OR p.name ILIKE $1 OR u.code ILIKE $1
    ORDER BY ${sortColumn} ${sortDirection} NULLS LAST
    LIMIT $2 OFFSET $3
  `, [searchParam, Number(limit), offset]);

  res.json({
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit))
  });
});

r.post("/", async (req, res) => {
  let { code, name, units_id, unit_price } = req.body;
  try {
    if (!code || code.trim() === "") {
      const maxRes = await pool.query("SELECT MAX(id) as m FROM product");
      const nextId = (maxRes.rows[0].m || 0) + 1;
      code = `P${nextId.toString().padStart(3, '0')}`;
    }

    const { rows } = await pool.query(
      "INSERT INTO product (code, name, units_id, unit_price) VALUES ($1, $2, $3, $4) RETURNING id",
      [code, name, units_id, unit_price]
    );
    res.status(201).json({ id: rows[0].id, code });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

r.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { code, name, units_id, unit_price } = req.body;
  try {
    await pool.query(
      "UPDATE product SET code=$1, name=$2, units_id=$3, unit_price=$4 WHERE id=$5",
      [code, name, units_id, unit_price, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE product
// Supports ?force=true to delete associated invoices
r.delete("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const force = req.query.force === 'true';
    await client.query("begin");

    if (force) {
      // Find invoices using this product
      // We delete the whole invoice as per requirement "delete invoices too"
      const invLines = await client.query("SELECT distinct invoice_id FROM invoice_line_item WHERE product_id=$1", [req.params.id]);
      const invIds = invLines.rows.map(i => i.invoice_id);

      if (invIds.length > 0) {
        // Delete invoice line items (cascade delete on invoice_id would work if configured, but let's be explicit)
        // Wait, invoice_line_item references invoice(id) on delete cascade (sql_run.sql line 63)
        // So executing "DELETE FROM invoice" is enough to clear lines? 
        // Yes. verify: create table invoice_line_item ... invoice_id bigint not null references invoice(id) on delete cascade

        // Delete invoices
        await client.query("DELETE FROM invoice WHERE id = ANY($1::int[])", [invIds]);
      }
    }

    await client.query("DELETE FROM product WHERE id=$1", [req.params.id]);
    await client.query("commit");
    res.json({ ok: true });
  } catch (err) {
    await client.query("rollback");
    if (err.code === '23503') {
      return res.status(400).json({ error: "Cannot delete product because it is used in invoices." });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

r.get("/units", async (_, res) => {
  const { rows } = await pool.query("SELECT id, code, name FROM units ORDER BY name");
  res.json(rows);
});

// Get single product (must be after /units)
r.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(`
    SELECT p.id, p.code, p.name, p.unit_price, u.code as units_code, p.units_id
    FROM product p
    JOIN units u ON u.id = p.units_id
    WHERE p.id = $1
  `, [id]);
  if (rows.length === 0) return res.status(404).json({ error: "Product not found" });
  res.json(rows[0]);
});

export default r;
