#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { BACKEND_DIR, FRONTEND_DIR, ROOT, findVirtualenvPython, run, systemPython } = require('./runtime');

const rootVenv = path.join(ROOT, '.venv');

if (!fs.existsSync(rootVenv)) {
  console.log('Creating virtualenv at .venv');
  const pythonCmd = systemPython();
  if (!pythonCmd) {
    console.error('Could not find a system Python interpreter. Install Python 3 and re-run setup.');
    process.exit(1);
  }
  run(pythonCmd, ['-m', 'venv', rootVenv]);
}

const py = findVirtualenvPython() || 'python';

function bootstrapPip(pythonExecutable) {
  run(pythonExecutable, ['-m', 'ensurepip', '--upgrade']);
}

function pipImportsWork(pythonExecutable) {
  const result = spawnSync(
    pythonExecutable,
    ['-c', 'import pip; import pip._vendor.rich'],
    { stdio: 'ignore', shell: false },
  );
  return result.status === 0;
}

if (fs.existsSync(rootVenv) && !pipImportsWork(py)) {
  console.log('Recreating broken virtualenv at .venv');
  fs.rmSync(rootVenv, { recursive: true, force: true });
  const pythonCmd = systemPython();
  if (!pythonCmd) {
    console.error('Could not find a system Python interpreter. Install Python 3 and re-run setup.');
    process.exit(1);
  }
  run(pythonCmd, ['-m', 'venv', rootVenv]);
}

const venvPython = findVirtualenvPython() || 'python';
bootstrapPip(venvPython);
run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip']);
run(venvPython, ['-m', 'pip', 'install', '-r', path.join(BACKEND_DIR, 'requirements.txt')]);

if (fs.existsSync(path.join(FRONTEND_DIR, 'package.json'))) {
  console.log('Installing frontend dependencies');
  run('npm', ['install'], { cwd: FRONTEND_DIR });
}

console.log('Backend and frontend setup complete. Activate with: source .venv/bin/activate (or .venv\\Scripts\\Activate.ps1 on Windows)');