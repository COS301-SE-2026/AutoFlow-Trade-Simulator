#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const FRONTEND_DIR = path.join(ROOT, 'frontend');

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (result.status !== 0) {
    process.exit(result.status);
  }
}

function systemPython() {
  const candidates = process.platform === 'win32' ? ['python'] : ['python3', 'python'];

  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore', shell: false });
    if (probe.status === 0) {
      return candidate;
    }
  }

  return null;
}

function findVirtualenvPython() {
  const candidates = process.platform === 'win32'
    ? [
        path.join(ROOT, '.venv', 'Scripts', 'python.exe'),
        path.join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe'),
      ]
    : [
        path.join(ROOT, '.venv', 'bin', 'python'),
        path.join(BACKEND_DIR, '.venv', 'bin', 'python'),
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

module.exports = {
  ROOT,
  BACKEND_DIR,
  FRONTEND_DIR,
  run,
  systemPython,
  findVirtualenvPython,
};