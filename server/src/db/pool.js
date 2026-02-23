// PostgreSQL connection pool
// Example usage: pool.query("SELECT 1")
import pg from "pg";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

// Production requires DATABASE_URL; dev may use default for convenience.
const connectionString =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("DATABASE_URL is required in production. Set it in your environment.");
      })()
    : "postgresql://root:root@localhost:15432/invoices_db");

export const pool = new pg.Pool({ connectionString });

pool.on("error", (err) => {
  logger.error("Database pool error", { message: err.message });
});
