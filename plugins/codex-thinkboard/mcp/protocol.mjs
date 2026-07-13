import { loadBoard, saveBoard } from "./board.mjs";

const BOARD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    phase: { type: "string", enum: ["opening", "clarifying", "challenging", "ready"] },
    cards: { type: "array", items: { type: "object" } },
    edges: { type: "array", items: { type: "object" } },
  },
  required: ["id", "title", "phase", "cards", "edges"],
};

const TOOLS = [
  {
    name: "thinkboard_get_board",
    title: "Get Thinkboard",
    description: "Read the canonical local Thinkboard board before resuming or changing a case.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "thinkboard_update_board",
    title: "Update Thinkboard",
    description: "Replace the canonical local board after the user confirms or corrects cards and relationships.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: { board: BOARD_SCHEMA },
      required: ["board"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "thinkboard_open_board",
    title: "Open Thinkboard Canvas",
    description: "Return the loopback-only URL for the local interactive Thinkboard canvas.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
];

export function createMcpProtocol({ boardPath, manifestVersion, getWebStatus, send }) {
  function sendResult(id, result) {
    send({ jsonrpc: "2.0", id, result });
  }

  function sendError(id, code, message) {
    send({ jsonrpc: "2.0", id, error: { code, message } });
  }

  async function handleToolCall(id, params) {
    const { boardUrl, webAvailable } = getWebStatus();
    if (params?.name === "thinkboard_get_board") {
      const board = await loadBoard(boardPath);
      sendResult(id, {
        content: [{ type: "text", text: `Current Thinkboard: ${board.title}` }],
        structuredContent: { board, boardUrl, webAvailable },
      });
      return;
    }

    if (params?.name === "thinkboard_update_board") {
      const board = await saveBoard(boardPath, params.arguments?.board);
      sendResult(id, {
        content: [{ type: "text", text: `Thinkboard updated: ${board.title}` }],
        structuredContent: { board, boardUrl, webAvailable },
      });
      return;
    }

    if (params?.name === "thinkboard_open_board") {
      const board = await loadBoard(boardPath);
      const message = webAvailable
        ? `Local Thinkboard canvas: ${boardUrl}`
        : `Thinkboard canvas could not start on ${boardUrl}. The board remains available through MCP.`;
      sendResult(id, {
        content: [{ type: "text", text: message }],
        structuredContent: { board, boardUrl, webAvailable, localOnly: true },
      });
      return;
    }

    sendError(id, -32602, `Unknown tool: ${params?.name ?? ""}`);
  }

  async function handleRequest(message) {
    if (typeof message !== "object" || message === null || Array.isArray(message)) return;
    const { id, method, params } = message;
    if (method === "initialize") {
      sendResult(id, {
        protocolVersion: params?.protocolVersion ?? "2025-11-25",
        capabilities: { tools: {} },
        serverInfo: { name: "codex-thinkboard", version: manifestVersion },
        instructions: "Keep the canonical Thinkboard synchronized after every meaningful user answer. Every active unknown must connect to an active want.",
      });
      return;
    }
    if (method === "ping") {
      sendResult(id, {});
      return;
    }
    if (method === "tools/list") {
      sendResult(id, { tools: TOOLS });
      return;
    }
    if (method === "tools/call") {
      try {
        await handleToolCall(id, params);
      } catch (error) {
        sendResult(id, {
          isError: true,
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        });
      }
      return;
    }
    if (id !== undefined) sendError(id, -32601, `Method not found: ${method}`);
  }

  return { handleRequest };
}
