// Backend entry: receives HTTP requests and forwards to routes (customers, products, invoices, reports)
import express from "express";
import cors from "cors";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

import logger from "./utils/logger.js";
import invoicesRoutes from "./routes/invoices.routes.js";
import receiptsRoutes from "./routes/receipts.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import customersRoutes from "./routes/customers.routes.js";
import productsRoutes from "./routes/products.routes.js";
import salesPersonsRoutes from "./routes/sales_persons.routes.js";

const app = express();

// ANSI colors for request log (dev only; production uses JSON without codes)
const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};
const methodColor = { GET: c.green, POST: c.cyan, PUT: c.yellow, DELETE: c.magenta };
const statusColor = (s) => (s >= 500 ? c.red : s >= 400 ? c.yellow : s >= 300 ? c.blue : c.green);
const useColor = process.env.NODE_ENV !== "production" && process.stdout.isTTY;

// Request logging: one line per request, colored by method and status in dev
app.use((req, res, next) => {
  const start = Date.now();
  const method = req.method;
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    let msg = `[${method}] ${req.originalUrl} ${status} ${duration}ms`;
    if (useColor) {
      const m = methodColor[method] || c.dim;
      const s = statusColor(status);
      msg = `${m}[${method}]${c.reset} ${req.originalUrl} ${s}${status}${c.reset} ${c.dim}${duration}ms${c.reset}`;
    }
    logger.info(msg, { method, url: req.originalUrl, status, durationMs: duration });
  });
  next();
});

// CORS: allow origin from CORS_ORIGIN env, or * if unset (e.g. dev). Allows common methods/headers.
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin === undefined || corsOrigin === "" ? true : corsOrigin.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));

// Check if repo has newer commits (for frontend update banner). Uses GIT_SHA from env, or git rev-parse when running dev.
const REPO = "llbumpbumpll/InvoiceDoc2";
const REPO_URL = `https://github.com/${REPO}`;
function getCurrentSha() {
  const fromEnv = process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT_SHA;
  if (fromEnv) return fromEnv.trim();
  let repoRoot = process.cwd();
  if (!fs.existsSync(path.join(repoRoot, ".git"))) {
    repoRoot = path.resolve(repoRoot, "..");
  }
  try {
    return execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}
app.get("/api/updates-check", async (_, res) => {
  const currentSha = getCurrentSha();
  if (!currentSha) {
    res.setHeader("X-Update-Available", "false");
    return res.json({ updateAvailable: false });
  }
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!r.ok) {
      res.setHeader("X-Update-Available", "false");
      return res.json({ updateAvailable: false });
    }
    const data = await r.json();
    const latestSha = data?.sha;
    const updateAvailable = !!latestSha && latestSha !== currentSha;
    res.setHeader("X-Update-Available", updateAvailable ? "true" : "false");
    if (updateAvailable) res.setHeader("X-Update-Repo-Url", REPO_URL);
    res.json({ updateAvailable, repoUrl: REPO_URL });
  } catch {
    res.setHeader("X-Update-Available", "false");
    res.json({ updateAvailable: false });
  }
});

// API routes
app.use("/api/customers", customersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/receipts", receiptsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/sales-persons", salesPersonsRoutes);

const port = process.env.PORT || 4000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => logger.info(`Invoice server listening on ${host}:${port}`));
