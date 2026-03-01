#!/usr/bin/env node
"use strict";
const path = require("path");
const fs = require("fs");
const { spawnSafe, execShell } = require("../scripts/run-safe.js");

const scriptDir = path.resolve(__dirname);
const root = path.join(scriptDir, "..");
const schemaPath = path.join(scriptDir, "sql", "001_schema.sql");
const seedPath = path.join(scriptDir, "sql", "003_seed.sql");
const resetPath = path.join(scriptDir, "sql", "sql_run.sql");
const composePath = path.join(scriptDir, "compose.yaml");
const shouldReset = process.argv.includes("--reset");

function runCompose(args, opts = {}) {
  const r = spawnSafe("docker-compose", ["-f", composePath, ...args], { cwd: opts.cwd || root, stdio: "inherit", ...opts });
  return r.status === 0;
}

function runComposeQuiet(args, opts = {}) {
  const r = spawnSafe("docker-compose", ["-f", composePath, ...args], {
    cwd: opts.cwd || root,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...opts,
  });
  return r.status === 0 ? (r.stdout && r.stdout.toString()) : null;
}

function dockerExecSql(containerName, sqlContent) {
  const r = spawnSafe(
    "docker",
    ["exec", "-i", containerName, "psql", "-v", "ON_ERROR_STOP=1", "-U", "root", "-d", "invoices_db"],
    { input: sqlContent, cwd: root, stdio: ["pipe", "inherit", "inherit"] }
  );
  return r.status === 0;
}

function dockerExecCmd(containerName, psqlArgs) {
  const r = spawnSafe("docker", ["exec", containerName, "psql", "-U", "root", "-d", "invoices_db", ...psqlArgs], { cwd: root, stdio: "inherit" });
  return r.status === 0;
}

function dockerQuery(containerName, sql) {
  const r = spawnSafe(
    "docker",
    ["exec", "-i", containerName, "psql", "-U", "root", "-d", "invoices_db", "-t", "-A", "-F", "|", "-c", sql],
    { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
  );
  return r.status === 0 ? (r.stdout && r.stdout.toString()) : null;
}

function composeExecSql(sqlContent) {
  const r = spawnSafe(
    "docker-compose",
    ["-f", composePath, "exec", "-T", "pgdatabase", "psql", "-v", "ON_ERROR_STOP=1", "-U", "root", "-d", "invoices_db"],
    { input: sqlContent, cwd: root, stdio: ["pipe", "inherit", "inherit"] }
  );
  return r.status === 0;
}

function composeQuery(sql) {
  return runComposeQuiet(["exec", "-T", "pgdatabase", "psql", "-U", "root", "-d", "invoices_db", "-t", "-A", "-F", "|", "-c", sql]);
}

function psqlExecSql(baseArgs, sqlFilePath, env) {
  const r = spawnSafe("psql", [...baseArgs, "-v", "ON_ERROR_STOP=1", "-f", sqlFilePath], { cwd: scriptDir, stdio: "inherit", env });
  return r.status === 0;
}

function psqlExecCmd(baseArgs, env, psqlArgs) {
  const r = spawnSafe("psql", [...baseArgs, ...psqlArgs], { cwd: scriptDir, stdio: "inherit", env });
  return r.status === 0;
}

function psqlQuery(baseArgs, env, sql) {
  const r = spawnSafe("psql", [...baseArgs, "-t", "-A", "-F", "|", "-c", sql], {
    cwd: scriptDir,
    env,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return r.status === 0 ? (r.stdout && r.stdout.toString()) : null;
}

function getTableCounts(queryFn) {
  const out = queryFn([
    "select",
    "  (select count(*) from country),",
    "  (select count(*) from units),",
    "  (select count(*) from customer),",
    "  (select count(*) from product),",
    "  (select count(*) from invoice),",
    "  (select count(*) from invoice_line_item);",
  ].join(" "));
  if (!out) return null;

  const counts = String(out).trim().split("|").map((value) => Number(String(value).trim()));
  if (counts.length !== 6 || counts.some((value) => Number.isNaN(value))) return null;

  return {
    country: counts[0],
    units: counts[1],
    customer: counts[2],
    product: counts[3],
    invoice: counts[4],
    invoiceLineItem: counts[5],
  };
}

function getSeedDecision(counts) {
  const allEmpty = Object.values(counts).every((value) => value === 0);
  if (allEmpty) {
    return { run: true, reason: "🌱 Database is empty. Running seed data..." };
  }

  const hasReferenceData = counts.country > 0 || counts.units > 0 || counts.customer > 0 || counts.product > 0;
  const missingInvoiceData = counts.invoice === 0 && counts.invoiceLineItem === 0;
  if (hasReferenceData && missingInvoiceData) {
    return { run: true, reason: "🩹 Reference data exists but invoice data is missing. Repairing seed data..." };
  }

  return { run: false, reason: "✅ Existing data found. Skipping seed." };
}

function logCounts(counts) {
  console.log(
    "📊 Current rows: country=" + counts.country +
    ", units=" + counts.units +
    ", customer=" + counts.customer +
    ", product=" + counts.product +
    ", invoice=" + counts.invoice +
    ", invoice_line_item=" + counts.invoiceLineItem
  );
}

function verifyDocker(containerName) {
  dockerExecCmd(containerName, ["-c", "\\dt"]);
}

function verifyCompose() {
  runCompose(["exec", "-T", "pgdatabase", "psql", "-U", "root", "-d", "invoices_db", "-c", "\\dt"]);
}

function verifyPsql(baseArgs, env) {
  psqlExecCmd(baseArgs, env, ["-c", "\\dt"]);
}

function runSetupWithDocker(containerName, setupSqlContent, seedSqlContent) {
  console.log("✅ Docker container (" + containerName + ") is running");
  console.log(shouldReset ? "♻️  Applying reset SQL..." : "🧱 Applying schema...");
  if (!dockerExecSql(containerName, setupSqlContent)) return false;

  if (shouldReset) {
    console.log("✅ Database reset successfully!");
    console.log("🔍 Verifying created tables:");
    verifyDocker(containerName);
    return true;
  }

  const counts = getTableCounts((sql) => dockerQuery(containerName, sql));
  if (!counts) return false;
  logCounts(counts);

  const seedDecision = getSeedDecision(counts);
  console.log(seedDecision.reason);
  if (!seedDecision.run) {
    console.log("🔍 Verifying created tables:");
    verifyDocker(containerName);
    return true;
  }

  if (!dockerExecSql(containerName, seedSqlContent)) return false;

  console.log("✅ Schema applied and seed data loaded!");
  console.log("🔍 Verifying created tables:");
  verifyDocker(containerName);
  return true;
}

function runSetupWithCompose(setupSqlContent, seedSqlContent) {
  console.log("✅ Docker container (pgdatabase) is running");
  console.log(shouldReset ? "♻️  Applying reset SQL..." : "🧱 Applying schema...");
  if (!composeExecSql(setupSqlContent)) return false;

  if (shouldReset) {
    console.log("✅ Database reset successfully!");
    console.log("🔍 Verifying created tables:");
    verifyCompose();
    return true;
  }

  const counts = getTableCounts((sql) => composeQuery(sql));
  if (!counts) return false;
  logCounts(counts);

  const seedDecision = getSeedDecision(counts);
  console.log(seedDecision.reason);
  if (!seedDecision.run) {
    console.log("🔍 Verifying created tables:");
    verifyCompose();
    return true;
  }

  if (!composeExecSql(seedSqlContent)) return false;

  console.log("✅ Schema applied and seed data loaded!");
  console.log("🔍 Verifying created tables:");
  verifyCompose();
  return true;
}

function runSetupWithPsql(label, baseArgs, env, setupSqlFile, seedSqlFile) {
  console.log("🔌 Trying " + label + "...");
  console.log(shouldReset ? "♻️  Applying reset SQL..." : "🧱 Applying schema...");
  if (!psqlExecSql(baseArgs, setupSqlFile, env)) return false;

  if (shouldReset) {
    console.log("✅ Database reset successfully!");
    console.log("🔍 Verifying created tables:");
    verifyPsql(baseArgs, env);
    return true;
  }

  const counts = getTableCounts((sql) => psqlQuery(baseArgs, env, sql));
  if (!counts) return false;
  logCounts(counts);

  const seedDecision = getSeedDecision(counts);
  console.log(seedDecision.reason);
  if (!seedDecision.run) {
    console.log("🔍 Verifying created tables:");
    verifyPsql(baseArgs, env);
    return true;
  }

  if (!psqlExecSql(baseArgs, seedSqlFile, env)) return false;

  console.log("✅ Schema applied and seed data loaded!");
  console.log("🔍 Verifying created tables:");
  verifyPsql(baseArgs, env);
  return true;
}

function help() {
  console.log("\n❌ Unable to connect to database\n");
  console.log("Please check:");
  console.log("1. Is Docker Desktop running?");
  console.log("2. Run this command first: npm run docker:db:start");
  console.log("3. To apply schema manually:");
  console.log("   PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f database/sql/001_schema.sql");
  console.log("4. To seed an empty database manually:");
  console.log("   PGPASSWORD=root psql -h localhost -p 15432 -U root -d invoices_db -f database/sql/003_seed.sql");
  console.log("5. To reset everything from scratch:");
  console.log("   npm run db:reset");
  console.log("\n6. Or use Adminer (Web UI): http://localhost:8080");
  console.log("   - System: PostgreSQL");
  console.log("   - Server: pgdatabase");
  console.log("   - Username: root");
  console.log("   - Password: root");
  console.log("   - Database: invoices_db");
  process.exit(1);
}

const requiredFiles = shouldReset ? [resetPath] : [schemaPath, seedPath];
for (const filePath of requiredFiles) {
  if (!fs.existsSync(filePath)) {
    console.error("❌ SQL file not found: " + path.relative(scriptDir, filePath));
    process.exit(1);
  }
}

const setupSqlPath = shouldReset ? resetPath : schemaPath;
const setupSqlContent = fs.readFileSync(setupSqlPath, "utf8");
const seedSqlContent = shouldReset ? "" : fs.readFileSync(seedPath, "utf8");

console.log(shouldReset ? "♻️  Resetting database..." : "🔧 Setting up database...");
console.log("📁 Working directory: " + scriptDir);

let names = [];
try {
  const out = execShell("docker ps --format \"{{.Names}}\"", { cwd: root, encoding: "utf8" });
  names = (out && out.toString ? out.toString() : out).trim().split(/\r?\n/).filter(Boolean);
} catch {}

if (names.includes("invoicedoc-db-dev")) {
  if (runSetupWithDocker("invoicedoc-db-dev", setupSqlContent, seedSqlContent)) process.exit(0);
  console.log("⚠️  Docker exec failed, trying alternative method...");
}

const psOut = runComposeQuiet(["ps", "-q", "pgdatabase"], { stdio: ["pipe", "pipe", "pipe"] });
if (psOut !== null && psOut.trim() !== "") {
  const statusOut = runComposeQuiet(["ps", "pgdatabase"]);
  if (statusOut && statusOut.includes("Up")) {
    if (runSetupWithCompose(setupSqlContent, seedSqlContent)) process.exit(0);
    console.log("⚠️  Docker exec failed, trying alternative method...");
  }
}

const dockerEnv = { ...process.env, PGPASSWORD: "root" };
if (runSetupWithPsql("psql (localhost:15432)", ["-h", "localhost", "-p", "15432", "-U", "root", "-d", "invoices_db"], dockerEnv, setupSqlPath, seedPath)) {
  process.exit(0);
}
console.log("⚠️  Connection via localhost:15432 failed, trying alternative method...");

if (runSetupWithPsql("local PostgreSQL (port 5432)", ["-d", "invoices_db"], process.env, setupSqlPath, seedPath)) {
  process.exit(0);
}

help();
