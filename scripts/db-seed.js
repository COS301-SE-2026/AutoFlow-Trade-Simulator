#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const backendDir = path.join(ROOT, 'backend');

function loadEnvFile() {
  const envPath = fs.existsSync(path.join(ROOT, '.env')) ? path.join(ROOT, '.env') : (fs.existsSync(path.join(ROOT, '.env.example')) ? path.join(ROOT, '.env.example') : null);
  if (!envPath) {
    console.error('Missing .env and .env.example');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(ROOT, '.env')) && envPath.endsWith('.env.example')) {
    fs.copyFileSync(envPath, path.join(ROOT, '.env'));
    console.log('Created .env from .env.example');
  }
  const content = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  content.split(/\r?\n/).forEach(line => {
    if (!line || line.trim().startsWith('#')) return;
    const [k, v] = line.split('=', 2);
    if (k && v !== undefined) process.env[k.trim()] = v.trim().replace(/^"|"$/g, '');
  });
}

function venvExe(exeUnix, exeWin) {
  const candidates = [
    path.join(ROOT, '.venv', 'bin', exeUnix),
    path.join(ROOT, '.venv', 'Scripts', exeWin),
    path.join(backendDir, '.venv', 'bin', exeUnix),
    path.join(backendDir, '.venv', 'Scripts', exeWin),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return exeUnix; // fallback to PATH
}

loadEnvFile();
const python = venvExe('python', 'python.exe');

const res = spawnSync(python, ['seeds.py'], { cwd: backendDir, stdio: 'inherit', shell: false });
if (res.error) { console.error(res.error); process.exit(2); }
process.exit(res.status);
