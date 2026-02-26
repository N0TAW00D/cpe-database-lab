#!/usr/bin/env node
"use strict";
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { spawnSafe, execShell, isWin } = require("./run-safe.js");

const root = path.resolve(__dirname, "..");
const composeDb = path.join(root, "database", "compose.yaml");
const svc = "pgdatabase";
const adminerSvc = "adminer";

function runCompose(args, opts = {}) {
  const r = spawnSafe("docker-compose", ["-f", composeDb, ...args], { cwd: root, stdio: "inherit", ...opts });
  return r.status === 0;
}

function runComposeQuiet(args, opts = {}) {
  const r = spawnSafe("docker-compose", ["-f", composeDb, ...args], { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...opts });
  return r.status === 0;
}

function portInUse(port) {
  const net = require("net");
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => { resolve(true); s.close(); });
    s.once("listening", () => { resolve(false); s.close(); });
    s.listen(port, "127.0.0.1");
  });
}

async function main() {
  console.log("🚀 Starting InvoiceDoc2 Database...");
  try {
    execShell("docker info", { cwd: root, stdio: "pipe" });
  } catch {
    console.error("❌ Docker is not running. Please start Docker Desktop first.");
    process.exit(1);
  }

  const inUse = await portInUse(15432);
  if (inUse) {
    let name = "";
    try {
      const out = execShell("docker ps --filter publish=15432 --format \"{{.Names}}\"", { cwd: root, encoding: "utf8" });
      name = (out && out.toString ? out.toString() : out).trim().split("\n")[0] || "";
    } catch {}
    if (name) {
      console.log("⚠️  Port 15432 in use by " + name + ". Stopping it...");
      execShell("docker stop " + name, { cwd: root });
      if (isWin) execShell("timeout /t 2 /nobreak > nul", { cwd: root });
      else execShell("sleep 2", { cwd: root });
    } else {
      console.error("❌ Port 15432 is in use. Free it or change the port in database/compose.yaml");
      process.exit(1);
    }
  }

  console.log("📦 Starting database and Adminer...");
  runCompose(["up", "-d", svc, adminerSvc]);
  console.log("⏳ Waiting for database...");
  if (isWin) execShell("timeout /t 5 /nobreak > nul", { cwd: root });
  else execShell("sleep 5", { cwd: root });

  for (let i = 0; i < 30; i++) {
    if (runComposeQuiet(["exec", "-T", svc, "pg_isready", "-U", "root"])) {
      console.log("✅ Database is ready!");
      break;
    }
    if (i === 29) console.log("⚠️  Database slow to start");
    else if (isWin) execShell("timeout /t 1 /nobreak > nul", { cwd: root });
    else execShell("sleep 1", { cwd: root });
  }

  console.log("\n🔧 Setting up schema...");
  const setupPath = path.join(root, "database", "setup_db.js");
  const setupSh = path.join(root, "database", "setup_db.sh");
  if (fs.existsSync(setupPath)) {
    const r = spawnSafe("node", [setupPath], { cwd: root, stdio: "inherit" });
    if (r.status !== 0) console.log("⚠️  Setup had errors (exit " + r.status + ")");
  } else if (fs.existsSync(setupSh) && !isWin) {
    execShell("cd database && ./setup_db.sh", { cwd: root });
  } else {
    console.log("⚠️  Run manually: node database/setup_db.js  or  cd database && ./setup_db.sh");
  }
  console.log("\n✅ Database started. Host: localhost:15432 | DB: invoices_db | User: root");
  console.log("   Adminer (web UI): http://localhost:8080 — Server: pgdatabase | User: root | Password: root | Database: invoices_db");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
