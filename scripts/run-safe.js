#!/usr/bin/env node
"use strict";
const { execSync, spawnSync } = require("child_process");

const isWin = process.platform === "win32";

function spawnSafe(executable, args, options = {}) {
  return spawnSync(executable, args, options);
}

function execShell(cmd, options = {}) {
  return execSync(cmd, { shell: true, ...options });
}

module.exports = {
  spawnSafe,
  execShell,
  isWin,
};
