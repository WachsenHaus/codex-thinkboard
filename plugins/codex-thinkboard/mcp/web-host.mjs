import { createReadStream, watch } from "node:fs";
import { stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import path from "node:path";

import { loadBoard } from "./board.mjs";

const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
const BOARD_BROADCAST_DELAY_MS = 25;

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".json") return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function jsonResponse(response, statusCode, value) {
  const body = JSON.stringify(value);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  response.end(body);
}

export function createWebHost({
  boardPath,
  dataRoot,
  distRoot,
  manifestVersion,
  requestedHost,
  requestedPort,
}) {
  const webHost = ALLOWED_HOSTS.has(requestedHost) ? requestedHost : "127.0.0.1";
  const dataRootId = createHash("sha256").update(path.resolve(dataRoot)).digest("hex");
  const eventClients = new Set();

  let webServer;
  let webPort = requestedPort;
  let isWebAvailable = false;
  let isWebOwned = false;
  let isStartingWebServer = false;
  let isShuttingDown = false;
  let boardWatcher;
  let boardChangeTimer;

  function boardUrl() {
    const displayHost = webHost === "::1" ? "[::1]" : webHost;
    return `http://${displayHost}:${webPort}`;
  }

  function getStatus() {
    return { boardUrl: boardUrl(), webAvailable: isWebAvailable };
  }

  function broadcastBoardChanged(board) {
    const data = JSON.stringify({ id: board.id, updatedAt: Date.now() });
    const payload = `event: board\ndata: ${data}\n\n`;
    for (const client of eventClients) client.write(payload);
  }

  function stopBoardWatcher() {
    if (boardChangeTimer) clearTimeout(boardChangeTimer);
    boardChangeTimer = undefined;
    boardWatcher?.close();
    boardWatcher = undefined;
  }

  function scheduleBoardBroadcast() {
    if (boardChangeTimer) clearTimeout(boardChangeTimer);
    boardChangeTimer = setTimeout(async () => {
      boardChangeTimer = undefined;
      try {
        broadcastBoardChanged(await loadBoard(boardPath));
      } catch (error) {
        console.error(`[thinkboard] board change could not be broadcast: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, BOARD_BROADCAST_DELAY_MS);
    boardChangeTimer.unref();
  }

  async function startBoardWatcher() {
    stopBoardWatcher();
    await loadBoard(boardPath);
    boardWatcher = watch(dataRoot, { persistent: false }, (_eventType, filename) => {
      if (filename && filename.toString() !== path.basename(boardPath)) return;
      scheduleBoardBroadcast();
    });
    boardWatcher.on("error", (error) => {
      console.error(`[thinkboard] board watcher unavailable: ${error.message}`);
      boardWatcher?.close();
      boardWatcher = undefined;
    });
  }

  async function serveStatic(requestPath, response) {
    const relativePath = requestPath === "/" ? "index.html" : decodeURIComponent(requestPath.slice(1));
    const resolvedDistRoot = path.resolve(distRoot);
    let filePath = path.resolve(resolvedDistRoot, relativePath);
    if (filePath !== resolvedDistRoot && !filePath.startsWith(`${resolvedDistRoot}${path.sep}`)) {
      jsonResponse(response, 403, { error: "Forbidden" });
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error("Not a file");
    } catch {
      filePath = path.join(distRoot, "index.html");
    }

    try {
      const fileStat = await stat(filePath);
      response.writeHead(200, {
        "Content-Type": contentType(filePath),
        "Content-Length": fileStat.size,
        "Cache-Control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=31536000, immutable",
        "Content-Security-Policy": "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      });
      createReadStream(filePath).pipe(response);
    } catch {
      jsonResponse(response, 503, { error: "Thinkboard web build is missing. Run npm run build:web." });
    }
  }

  async function handleHttpRequest(request, response) {
    try {
      const url = new URL(request.url || "/", boardUrl());
      const requestHost = new URL(`http://${request.headers.host || "invalid"}`).hostname;
      if (!ALLOWED_HOSTS.has(requestHost)) {
        jsonResponse(response, 403, { error: "Thinkboard accepts loopback requests only." });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/health") {
        jsonResponse(response, 200, {
          name: "codex-thinkboard",
          version: manifestVersion,
          localOnly: true,
          boardUrl: boardUrl(),
          dataRootId,
        });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/board") {
        jsonResponse(response, 200, await loadBoard(boardPath));
        return;
      }
      if (request.method === "PUT" && url.pathname === "/api/board") {
        jsonResponse(response, 405, { error: "The web board is read-only. Update it through Thinkboard MCP." });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/events") {
        response.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        response.write("event: ready\ndata: {}\n\n");
        eventClients.add(response);
        request.on("close", () => eventClients.delete(response));
        return;
      }
      if (url.pathname.startsWith("/api/")) {
        jsonResponse(response, 404, { error: "Not found" });
        return;
      }
      await serveStatic(url.pathname, response);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error(`[thinkboard] local HTTP request failed: ${detail}`);
      jsonResponse(response, 400, { error: "Thinkboard could not complete the local request." });
    }
  }

  async function hasExistingThinkboardServer() {
    try {
      const response = await fetch(`${boardUrl()}/api/health`, { signal: AbortSignal.timeout(1200) });
      if (!response.ok) return false;
      const health = await response.json();
      return health.name === "codex-thinkboard" && health.dataRootId === dataRootId;
    } catch {
      return false;
    }
  }

  async function startWebServer() {
    if (isStartingWebServer || isWebOwned || isShuttingDown) return;
    isStartingWebServer = true;
    const candidateServer = createServer((request, response) => {
      void handleHttpRequest(request, response);
    });
    webServer = candidateServer;

    await new Promise((resolve) => {
      candidateServer.once("error", async (error) => {
        if (error.code === "EADDRINUSE" && await hasExistingThinkboardServer()) {
          isWebAvailable = true;
          isWebOwned = false;
          resolve();
          return;
        }
        console.error(`[thinkboard] web server unavailable: ${error.message}`);
        isWebAvailable = false;
        resolve();
      });
      candidateServer.listen(requestedPort, webHost, async () => {
        const address = candidateServer.address();
        if (typeof address === "object" && address !== null) webPort = address.port;
        isWebAvailable = true;
        isWebOwned = true;
        try {
          await startBoardWatcher();
        } catch (error) {
          console.error(`[thinkboard] board watcher unavailable: ${error instanceof Error ? error.message : String(error)}`);
        }
        console.error(`[thinkboard] local canvas: ${boardUrl()}`);
        resolve();
      });
    });
    isStartingWebServer = false;
  }

  async function ensure() {
    if (isShuttingDown || isStartingWebServer) return;
    if (isWebOwned && webServer?.listening) {
      if (!boardWatcher) {
        try {
          await startBoardWatcher();
        } catch (error) {
          console.error(`[thinkboard] board watcher unavailable: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      return;
    }
    if (await hasExistingThinkboardServer()) {
      isWebAvailable = true;
      return;
    }
    isWebAvailable = false;
    await startWebServer();
  }

  async function shutdown() {
    isShuttingDown = true;
    stopBoardWatcher();
    for (const client of eventClients) client.end();
    if (!isWebOwned || !webServer?.listening) return;
    await new Promise((resolve) => webServer.close(resolve));
  }

  return { ensure, getStatus, shutdown };
}
