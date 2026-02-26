#!/usr/bin/env node
"use strict";
const path = require("path");
const { execShell } = require("./run-safe.js");

const root = path.resolve(__dirname, "..");

console.log("🛑 Stopping InvoiceDoc2 services...");
execShell("docker-compose down", { cwd: root, stdio: "inherit" });
console.log("✅ Services stopped!");
