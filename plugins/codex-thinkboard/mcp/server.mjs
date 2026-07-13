import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

import { createMcpProtocol } from "./protocol.mjs";
import { createWebHost } from "./web-host.mjs";

const pluginRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(
  await readFile(path.join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"),
);
const dataRoot = process.env.THINKBOARD_DATA_DIR?.trim()
  || path.join(os.homedir(), ".codex", "thinkboard");
const boardPath = path.join(dataRoot, "board.json");
const distRoot = path.join(pluginRoot, "web", "dist");
const requestedHost = process.env.THINKBOARD_WEB_HOST?.trim() || "127.0.0.1";
const parsedPort = Number.parseInt(process.env.THINKBOARD_WEB_PORT || "43127", 10);
const requestedPort = Number.isInteger(parsedPort) && parsedPort >= 0 && parsedPort <= 65535
  ? parsedPort
  : 43127;

const webHost = createWebHost({
  boardPath,
  dataRoot,
  distRoot,
  manifestVersion: manifest.version,
  requestedHost,
  requestedPort,
});
const protocol = createMcpProtocol({
  boardPath,
  manifestVersion: manifest.version,
  getWebStatus: webHost.getStatus,
  send: (message) => process.stdout.write(`${JSON.stringify(message)}\n`),
});

await webHost.ensure();
const recoveryTimer = setInterval(() => void webHost.ensure(), 1500);
recoveryTimer.unref();

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on("line", (line) => {
  if (line.trim().length === 0) return;
  try {
    void protocol.handleRequest(JSON.parse(line)).catch((error) => {
      console.error(`[thinkboard] request failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  } catch {
    // Ignore malformed input so one bad line cannot terminate the local server.
  }
});

let isShuttingDown = false;
async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  clearInterval(recoveryTimer);
  await webHost.shutdown();
  process.exit(0);
}

lines.on("close", () => {
  if (process.env.THINKBOARD_STANDALONE !== "1") void shutdown();
});
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
