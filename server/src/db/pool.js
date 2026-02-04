// PostgreSQL connection pool (ตัวเชื่อม DB)
// Example usage: pool.query("SELECT 1")
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

// Default DATABASE_URL if not set in environment
const DEFAULT_DATABASE_URL = "postgresql://root:root@localhost:15432/invoices_db";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
});
