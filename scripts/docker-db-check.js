#!/usr/bin/env node
"use strict";
const path = require("path");
const { spawnSafe, execShell } = require("./run-safe.js");

const root = path.resolve(__dirname, "..");
const composeDb = path.join(root, "database", "compose.yaml");
const svc = "pgdatabase";

function runComposeQuiet(args, opts = {}) {
  const r = spawnSafe("docker-compose", ["-f", composeDb, ...args], { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...opts });
  return r.status === 0 && r.stdout ? r.stdout.toString() : null;
}

let container = runComposeQuiet(["ps", "-q", svc], { stdio: ["pipe", "pipe", "pipe"] });
container = container ? container.trim() : "";
if (!container) {
  console.error("❌ Database container is not running. Start it: npm run docker:db:start");
  process.exit(1);
}

let running = "";
try {
  running = execShell("docker ps -q --no-trunc", { cwd: root, encoding: "utf8" });
  running = running && running.toString ? running.toString() : running;
} catch {}
if (!running.includes(container)) {
  console.error("❌ Database container is not running. Start it: npm run docker:db:start");
  process.exit(1);
}

let name = "";
try {
  const out = execShell(`docker ps --filter "id=${container}" --format "{{.Names}}"`, { cwd: root, encoding: "utf8" });
  name = (out && out.toString ? out.toString() : out).trim() || container;
} catch {
  name = container;
}

console.log("🔍 Checking InvoiceDoc2 Database...");
console.log("✅ Container " + name + " is running\n");
console.log("📊 Tables:");
try {
  spawnSafe("docker", ["exec", name, "psql", "-U", "root", "-d", "invoices_db", "-c", "\\dt"], { cwd: root, stdio: "inherit" });
} catch {}
console.log("\n📈 Counts:");
for (const t of ["customer", "product", "invoice", "invoice_line_item"]) {
  const r = spawnSafe("docker", ["exec", name, "psql", "-U", "root", "-d", "invoices_db", "-t", "-c", "SELECT COUNT(*) FROM " + t + ";"], { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  const n = (r.stdout && r.stdout.toString().trim()) || "0";
  console.log("   " + t + ": " + n);
}
console.log("\n📍 localhost:15432 | invoices_db | root/root");
