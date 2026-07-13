import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import readline from "node:readline";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { preserveUserTopics, validateBoard } from "../plugins/codex-thinkboard/mcp/board.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverPath = path.join(root, "plugins", "codex-thinkboard", "mcp", "server.mjs");

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test("board validation preserves automatic organization metadata", () => {
  const board = validateBoard({
    id: "organized",
    title: "Organized board",
    phase: "clarifying",
    cards: [{
      id: "want-1",
      type: "want",
      text: "Keep groups stable",
      polarity: "include",
      status: "confirmed",
      tags: [],
      topic: "Board UX",
      topicSource: "user",
      stage: "decision",
      createdAt: "2026-07-13T12:00:00+09:00",
    }],
    edges: [],
  });

  assert.deepEqual(board.cards[0], {
    id: "want-1",
    type: "want",
    text: "Keep groups stable",
    status: "confirmed",
    tags: [],
    topic: "Board UX",
    topicSource: "user",
    stage: "decision",
    createdAt: "2026-07-13T12:00:00+09:00",
    polarity: "include",
  });
  assert.throws(() => validateBoard({
    ...board,
    cards: [{ ...board.cards[0], stage: "later" }],
  }), /stage is invalid/);
  assert.throws(() => validateBoard({
    ...board,
    cards: [{ ...board.cards[0], createdAt: "2026-07-13" }],
  }), /createdAt is invalid/);
});

test("user-owned topics survive AI regrouping until explicitly overridden", () => {
  const current = {
    cards: [{ id: "want-1", topic: "User topic", topicSource: "user" }],
  };
  const next = {
    cards: [{ id: "want-1", topic: "AI topic", topicSource: "ai" }],
  };

  assert.deepEqual(preserveUserTopics(current, next).cards[0], {
    id: "want-1",
    topic: "User topic",
    topicSource: "user",
  });
  assert.deepEqual(preserveUserTopics(current, next, ["want-1"]).cards[0], next.cards[0]);
});

async function getFreePort() {
  const server = createNetServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForHealth(url, timeout = 6000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {
      // A standby MCP process may still be claiming the released port.
    }
    await wait(100);
  }
  throw new Error(`Thinkboard health check timed out: ${url}`);
}

function spawnServer(dataRoot, port) {
  const child = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(path.dirname(serverPath)),
    env: {
      ...process.env,
      THINKBOARD_WEB_HOST: "127.0.0.1",
      THINKBOARD_WEB_PORT: String(port),
      THINKBOARD_DATA_DIR: dataRoot,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
  return child;
}

function createMcpClient(child) {
  let requestId = 0;
  const pending = new Map();
  const stderr = [];
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => stderr.push(chunk));

  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  lines.on("line", (line) => {
    const message = JSON.parse(line);
    const resolver = pending.get(message.id);
    if (resolver) {
      pending.delete(message.id);
      resolver(message);
    }
  });

  const request = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++requestId;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`MCP request timed out: ${method}\n${stderr.join("")}`));
    }, 5000);
    pending.set(id, (message) => {
      clearTimeout(timeout);
      resolve(message);
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });

  return { request };
}

async function waitForSseEvent(url, eventName, action, timeout = 1000) {
  const controller = new AbortController();
  const response = await fetch(`${url}/api/events`, { signal: controller.signal });
  assert.equal(response.status, 200);
  assert.ok(response.body);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const deadline = Date.now() + timeout;

  try {
    await action();
    while (Date.now() < deadline) {
      const remaining = deadline - Date.now();
      const result = await Promise.race([
        reader.read(),
        wait(remaining).then(() => { throw new Error(`SSE event timed out: ${eventName}`); }),
      ]);
      if (result.done) break;
      buffer += decoder.decode(result.value, { stream: true });
      if (buffer.includes(`event: ${eventName}\n`)) return;
    }
    throw new Error(`SSE event timed out: ${eventName}`);
  } finally {
    controller.abort();
  }
}

test("bundled MCP server updates the local web board", async (t) => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), "thinkboard-test-"));
  const child = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(path.dirname(serverPath)),
    env: {
      ...process.env,
      THINKBOARD_WEB_HOST: "127.0.0.1",
      THINKBOARD_WEB_PORT: "0",
      THINKBOARD_DATA_DIR: dataRoot,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
  t.after(async () => {
    child.kill();
    await rm(dataRoot, { recursive: true, force: true });
  });

  const { request } = createMcpClient(child);

  const initialized = await request("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "thinkboard-test", version: "1.0.0" },
  });
  assert.equal(initialized.result.serverInfo.name, "codex-thinkboard");

  const listed = await request("tools/list");
  assert.deepEqual(
    listed.result.tools.map((tool) => tool.name),
    ["thinkboard_get_board", "thinkboard_update_board", "thinkboard_open_board"],
  );

  const opened = await request("tools/call", {
    name: "thinkboard_open_board",
    arguments: {},
  });
  const url = opened.result.structuredContent.boardUrl;
  const healthResponse = await fetch(`${url}/api/health`);
  assert.equal(healthResponse.status, 200);
  const health = await healthResponse.json();
  assert.equal(health.localOnly, true);
  assert.match(health.dataRootId, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(health).includes(dataRoot), false);

  const board = {
    id: "weight-goal",
    title: "3개월 감량 계획",
    phase: "clarifying",
    cards: [
      {
        id: "want-1",
        type: "want",
        text: "3개월 동안 10kg 감량",
        polarity: "include",
        status: "confirmed",
        tags: [],
      },
      {
        id: "want-2",
        type: "want",
        text: "감량 후 다시 찌지 않기",
        polarity: "include",
        status: "confirmed",
        tags: [],
      },
      {
        id: "unknown-1",
        type: "unknown",
        text: "현재 키와 체중",
        status: "candidate",
        tags: [],
      },
    ],
    edges: [
      { id: "edge-1", from: "unknown-1", to: "want-1", kind: "blocks" },
      { id: "edge-2", from: "unknown-1", to: "want-2", kind: "blocks" },
    ],
  };
  const updated = await request("tools/call", {
    name: "thinkboard_update_board",
    arguments: { board },
  });
  assert.equal(updated.result.structuredContent.board.title, board.title);

  const boardResponse = await fetch(`${url}/api/board`);
  assert.deepEqual(await boardResponse.json(), board);

  const rejectedWebUpdate = await fetch(`${url}/api/board`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(board),
  });
  assert.equal(rejectedWebUpdate.status, 405);
});

test("malformed JSON-RPC values do not terminate the MCP server", async (t) => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), "thinkboard-malformed-"));
  const child = spawnServer(dataRoot, 0);
  const { request } = createMcpClient(child);

  t.after(async () => {
    child.kill();
    await rm(dataRoot, { recursive: true, force: true });
  });

  child.stdin.write("null\n");
  await wait(50);

  const pinged = await request("ping");
  assert.deepEqual(pinged.result, {});
});

test("local HTTP failures do not expose internal error details", async (t) => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), "thinkboard-http-error-"));
  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}`;
  const child = spawnServer(dataRoot, port);

  t.after(async () => {
    child.kill();
    await rm(dataRoot, { recursive: true, force: true });
  });

  await waitForHealth(url);
  await writeFile(path.join(dataRoot, "board.json"), "{ private-invalid-json", "utf8");

  const response = await fetch(`${url}/api/board`);
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: "Thinkboard could not complete the local request." });
  assert.equal(JSON.stringify(body).includes(dataRoot), false);
  assert.equal(JSON.stringify(body).includes("private-invalid-json"), false);
});

test("concurrent MCP updates use independent temporary files", async (t) => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), "thinkboard-concurrent-"));
  const child = spawnServer(dataRoot, 0);
  const { request } = createMcpClient(child);

  t.after(async () => {
    child.kill();
    await rm(dataRoot, { recursive: true, force: true });
  });

  await request("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "thinkboard-concurrent-test", version: "1.0.0" },
  });
  const makeBoard = (id) => ({
    id,
    title: `Concurrent ${id}`,
    phase: "clarifying",
    cards: [
      {
        id: "want-1",
        type: "want",
        text: `Keep update ${id}`,
        polarity: "include",
        status: "confirmed",
        tags: [],
      },
    ],
    edges: [],
  });

  const results = await Promise.all([
    request("tools/call", { name: "thinkboard_update_board", arguments: { board: makeBoard("alpha") } }),
    request("tools/call", { name: "thinkboard_update_board", arguments: { board: makeBoard("beta") } }),
  ]);
  assert.equal(results.some((result) => result.result.isError), false, JSON.stringify(results));

  const current = await request("tools/call", { name: "thinkboard_get_board", arguments: {} });
  assert.ok(["alpha", "beta"].includes(current.result.structuredContent.board.id));
});

test("a standby MCP process restores the canvas after the web owner exits", async (t) => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), "thinkboard-takeover-"));
  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}`;
  const owner = spawnServer(dataRoot, port);
  let standby;

  t.after(async () => {
    owner.kill();
    standby?.kill();
    await rm(dataRoot, { recursive: true, force: true });
  });

  await waitForHealth(url);
  standby = spawnServer(dataRoot, port);
  await wait(300);
  owner.kill();
  await new Promise((resolve) => owner.once("exit", resolve));

  await waitForHealth(url);
  const boardResponse = await fetch(`${url}/api/board`);
  assert.equal(boardResponse.status, 200);
});

test("a standby MCP process rejects a canvas for a different data root", async (t) => {
  const ownerRoot = await mkdtemp(path.join(os.tmpdir(), "thinkboard-owner-root-"));
  const standbyRoot = await mkdtemp(path.join(os.tmpdir(), "thinkboard-standby-root-"));
  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}`;
  const owner = spawnServer(ownerRoot, port);
  let standby;

  t.after(async () => {
    owner.kill();
    standby?.kill();
    await Promise.all([
      rm(ownerRoot, { recursive: true, force: true }),
      rm(standbyRoot, { recursive: true, force: true }),
    ]);
  });

  await waitForHealth(url);
  standby = spawnServer(standbyRoot, port);
  const { request } = createMcpClient(standby);
  await request("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "thinkboard-data-root-test", version: "1.0.0" },
  });

  const opened = await request("tools/call", { name: "thinkboard_open_board", arguments: {} });
  assert.equal(opened.result.structuredContent.webAvailable, false);
});

test("the web owner broadcasts board updates saved by a standby MCP process", async (t) => {
  const dataRoot = await mkdtemp(path.join(os.tmpdir(), "thinkboard-events-"));
  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}`;
  const owner = spawnServer(dataRoot, port);
  let standby;

  t.after(async () => {
    owner.kill();
    standby?.kill();
    await rm(dataRoot, { recursive: true, force: true });
  });

  await waitForHealth(url);
  standby = spawnServer(dataRoot, port);
  const { request } = createMcpClient(standby);
  await request("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "thinkboard-standby-test", version: "1.0.0" },
  });

  const board = {
    id: "standby-update",
    title: "Standby update",
    phase: "clarifying",
    cards: [
      {
        id: "want-1",
        type: "want",
        text: "See cross-process updates immediately",
        polarity: "include",
        status: "confirmed",
        tags: [],
      },
    ],
    edges: [],
  };
  const startedAt = Date.now();

  await waitForSseEvent(url, "board", async () => {
    const updated = await request("tools/call", {
      name: "thinkboard_update_board",
      arguments: { board },
    });
    assert.equal(updated.result.structuredContent.board.id, board.id);
  });

  assert.ok(Date.now() - startedAt < 750, "cross-process board event should arrive promptly");
  assert.deepEqual(await (await fetch(`${url}/api/board`)).json(), board);
});
