import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const mode = process.argv[2] ?? "all";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendCommand = resolve(rootDir, ".venv/bin/uvicorn");

const children = [];

function start(command, args, label, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      shutdown(0);
      return;
    }

    if (typeof code === "number" && code !== 0) {
      shutdown(code);
    }
  });

  children.push(child);
  console.log(`[${label}] started`);
  return child;
}

function shutdown(code) {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

if (mode === "backend") {
  start(backendCommand, ["app.main:app", "--reload", "--app-dir", "backend"], "backend", rootDir);
} else if (mode === "frontend") {
  start("npm", ["run", "dev", "--prefix", "frontend"], "frontend", rootDir);
} else {
  start(backendCommand, ["app.main:app", "--reload", "--app-dir", "backend"], "backend", rootDir);
  start("npm", ["run", "dev", "--prefix", "frontend"], "frontend", rootDir);
}