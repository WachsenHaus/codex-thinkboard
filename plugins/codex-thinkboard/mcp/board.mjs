import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const CARD_TYPES = new Set(["want", "unknown", "evidence", "assumption"]);
const CARD_STATUSES = new Set(["candidate", "confirmed", "resolved", "rejected"]);
const EDGE_KINDS = new Set(["depends_on", "blocks", "contradicts", "resolves"]);
const PHASES = new Set(["opening", "clarifying", "challenging", "ready"]);
const CARD_STAGES = new Set(["problem", "idea", "decision", "action"]);
const TOPIC_SOURCES = new Set(["ai", "user"]);
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
let saveQueue = Promise.resolve();

export const DEFAULT_BOARD = {
  id: "welcome",
  title: "첫 Thinkboard",
  phase: "opening",
  cards: [
    {
      id: "want-1",
      type: "want",
      text: "정리되지 않은 생각을 눈에 보이게 만든다",
      polarity: "include",
      status: "candidate",
      tags: [],
    },
    {
      id: "unknown-1",
      type: "unknown",
      text: "첫 사례로 무엇을 다룰까?",
      status: "candidate",
      tags: [],
    },
  ],
  edges: [
    {
      id: "edge-1",
      from: "unknown-1",
      to: "want-1",
      kind: "blocks",
    },
  ],
};

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${name} must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeCard(value, index) {
  if (!isObject(value)) fail(`cards[${index}] must be an object.`);
  const id = requireString(value.id, `cards[${index}].id`);
  const type = requireString(value.type, `cards[${index}].type`);
  const text = requireString(value.text, `cards[${index}].text`);
  const status = requireString(value.status, `cards[${index}].status`);
  if (!CARD_TYPES.has(type)) fail(`cards[${index}].type is invalid.`);
  if (!CARD_STATUSES.has(status)) fail(`cards[${index}].status is invalid.`);
  if (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== "string")) {
    fail(`cards[${index}].tags must be an array of strings.`);
  }

  const card = { id, type, text, status, tags: [...value.tags] };
  if (value.topic !== undefined) card.topic = requireString(value.topic, `cards[${index}].topic`);
  if (value.topicSource !== undefined) {
    const topicSource = requireString(value.topicSource, `cards[${index}].topicSource`);
    if (!TOPIC_SOURCES.has(topicSource)) fail(`cards[${index}].topicSource is invalid.`);
    if (!card.topic) fail(`cards[${index}].topicSource requires topic.`);
    card.topicSource = topicSource;
  }
  if (value.stage !== undefined) {
    const stage = requireString(value.stage, `cards[${index}].stage`);
    if (!CARD_STAGES.has(stage)) fail(`cards[${index}].stage is invalid.`);
    card.stage = stage;
  }
  if (value.createdAt !== undefined) {
    const createdAt = requireString(value.createdAt, `cards[${index}].createdAt`);
    if (!ISO_TIMESTAMP.test(createdAt) || Number.isNaN(Date.parse(createdAt))) {
      fail(`cards[${index}].createdAt is invalid.`);
    }
    card.createdAt = createdAt;
  }
  if (type === "want") {
    if (value.polarity !== "include" && value.polarity !== "exclude") {
      fail(`cards[${index}].polarity must be include or exclude.`);
    }
    card.polarity = value.polarity;
  }
  return card;
}

function normalizeEdge(value, index, cardIds) {
  if (!isObject(value)) fail(`edges[${index}] must be an object.`);
  const id = requireString(value.id, `edges[${index}].id`);
  const from = requireString(value.from, `edges[${index}].from`);
  const to = requireString(value.to, `edges[${index}].to`);
  const kind = requireString(value.kind, `edges[${index}].kind`);
  if (!cardIds.has(from) || !cardIds.has(to)) fail(`edges[${index}] references a missing card.`);
  if (!EDGE_KINDS.has(kind)) fail(`edges[${index}].kind is invalid.`);
  return { id, from, to, kind };
}

function assertUnique(items, name) {
  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) fail(`${name} must use unique ids.`);
    ids.add(item.id);
  }
}

function assertUnknownConnections(cards, edges) {
  const activeWants = new Set();
  for (const card of cards) {
    if (card.type === "want" && card.status !== "rejected" && card.status !== "resolved") {
      activeWants.add(card.id);
    }
  }

  for (const card of cards) {
    if (card.type !== "unknown" || card.status === "rejected" || card.status === "resolved") continue;
    let isConnected = false;
    for (const edge of edges) {
      if (edge.from === card.id && activeWants.has(edge.to)) isConnected = true;
      if (edge.to === card.id && activeWants.has(edge.from)) isConnected = true;
    }
    if (!isConnected) fail(`Active unknown ${card.id} must connect to an active want.`);
  }
}

export function validateBoard(value) {
  if (!isObject(value)) fail("board must be an object.");
  const id = requireString(value.id, "board.id");
  const title = requireString(value.title, "board.title");
  const phase = requireString(value.phase, "board.phase");
  if (!PHASES.has(phase)) fail("board.phase is invalid.");
  if (!Array.isArray(value.cards)) fail("board.cards must be an array.");
  if (!Array.isArray(value.edges)) fail("board.edges must be an array.");

  const cards = value.cards.map(normalizeCard);
  assertUnique(cards, "cards");
  const cardIds = new Set(cards.map((card) => card.id));
  const edges = value.edges.map((edge, index) => normalizeEdge(edge, index, cardIds));
  assertUnique(edges, "edges");
  assertUnknownConnections(cards, edges);

  if (phase === "ready" && cards.some((card) => card.type === "want" && card.status === "candidate")) {
    fail("A ready board cannot contain a candidate want.");
  }

  return { id, title, phase, cards, edges };
}

export function preserveUserTopics(currentBoard, nextBoard, overrideCardIds = []) {
  if (!Array.isArray(nextBoard?.cards)) return nextBoard;
  const protectedTopics = new Map();
  const overrideIds = new Set(Array.isArray(overrideCardIds) ? overrideCardIds : []);
  for (const card of currentBoard.cards) {
    if (card.topicSource === "user" && !overrideIds.has(card.id)) {
      protectedTopics.set(card.id, card.topic);
    }
  }
  return {
    ...nextBoard,
    cards: nextBoard.cards.map((card) => {
      const topic = protectedTopics.get(card?.id);
      return topic ? { ...card, topic, topicSource: "user" } : card;
    }),
  };
}

export async function loadBoard(boardPath) {
  try {
    const source = await readFile(boardPath, "utf8");
    return validateBoard(JSON.parse(source));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await saveBoard(boardPath, DEFAULT_BOARD);
    return structuredClone(DEFAULT_BOARD);
  }
}

export async function saveBoard(boardPath, value) {
  const board = validateBoard(value);
  const save = saveQueue.then(async () => {
    await mkdir(path.dirname(boardPath), { recursive: true });
    const temporaryPath = `${boardPath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(board, null, 2)}\n`, "utf8");
    await rename(temporaryPath, boardPath);
  });
  saveQueue = save.catch(() => undefined);
  await save;
  return board;
}
