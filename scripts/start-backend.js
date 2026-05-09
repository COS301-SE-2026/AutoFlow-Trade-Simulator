#!/usr/bin/env node
const { ROOT, findVirtualenvPython } = require('./runtime');
const { spawnSync } = require('child_process');

const python = findVirtualenvPython();
if (!python) {
  console.error('No virtualenv python found. Run npm run setup:backend first.');
  process.exit(1);
}

const result = spawnSync(
  python,
  ['-m', 'uvicorn', 'app.main:app', '--reload', '--app-dir', 'backend'],
  {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  },
);

process.exit(result.status ?? 1);
