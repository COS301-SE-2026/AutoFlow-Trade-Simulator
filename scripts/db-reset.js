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
const alembic = venvExe('alembic', 'alembic.exe');

console.log('Dropping all tables...');
const dropScript = `from sqlalchemy import text\nfrom sqlmodel import create_engine, SQLModel\nfrom app.settings import settings\nfrom app import models\nengine = create_engine(settings.database_url)\nSQLModel.metadata.drop_all(engine)\nwith engine.begin() as conn:\n    conn.execute(text('DROP TABLE IF EXISTS alembic_version'))\nprint('✓ All tables dropped')`;
let res = spawnSync(python, ['-c', dropScript], { cwd: backendDir, stdio: 'inherit', shell: false });
if (res.status !== 0) process.exit(res.status);

console.log('Running migrations...');
res = spawnSync(alembic, ['-c', 'alembic.ini', 'upgrade', 'head'], { cwd: backendDir, stdio: 'inherit', shell: false });
if (res.status !== 0) process.exit(res.status);

// Post-migration sanity check: ensure key tables exist before seeding.
console.log('Verifying migrations created expected tables...');
const checkScript = `from sqlalchemy import create_engine, inspect\nfrom app.settings import settings\nengine = create_engine(settings.database_url)\nins = inspect(engine)\nif not ins.has_table('user'):\n    print('MISSING:user')\n    exit(2)\nprint('OK')`;
let checkRes = spawnSync(python, ['-c', checkScript], { cwd: backendDir, stdio: 'pipe', shell: false });
if (checkRes.status === 0) {
  console.log('Migration verification OK');
  console.log('Seeding database...');
  res = spawnSync(python, ['seeds.py'], { cwd: backendDir, stdio: 'inherit', shell: false });
  process.exit(res.status);
} else {
  const out = (checkRes.stdout || Buffer.from('')).toString().trim();
  console.error('Migration verification failed:', out || checkRes.stderr.toString());
  console.error('\nStrict mode: aborting before seeding because expected tables are missing.');
  console.error('Possible causes: Alembic did not apply migrations, migrations are empty, or Alembic is pointed at the wrong script_location.');
  console.error('\nRun these checks to debug:');
  console.error('  cd backend && alembic current');
  console.error('  cd backend && alembic history --verbose');
  console.error('  ls backend/alembic/versions');
  console.error('  python -c "from app import models; print(models.__all__)"');
  console.error('\nIf migrations are missing or empty, run:');
  console.error('  npm run migrate:dev -- "describe change"  # autogenerate a migration (dev only)');
  console.error('\nOnce migrations are correct, re-run: npm run db:reset');
  process.exit(4);
}
