#!/usr/bin/env node
"use strict";
const path = require("path");
const { execShell } = require("./run-safe.js");

const root = path.resolve(__dirname, "..");
const service = process.argv[2] || "";

const cmd = service ? "docker-compose logs -f " + service : "docker-compose logs -f";
execShell(cmd, { cwd: root, stdio: "inherit" });
