#!/usr/bin/env node
"use strict";
const path = require("path");
const { spawnSafe } = require("./run-safe.js");

const root = path.resolve(__dirname, "..");
const composeDb = path.join(root, "database", "compose.yaml");

console.log("🛑 Stopping InvoiceDoc2 Database...");
spawnSafe("docker-compose", ["-f", composeDb, "down"], { cwd: root, stdio: "inherit" });
console.log("✅ Database stopped!");
