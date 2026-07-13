import type { Edge, Node, XYPosition } from '@xyflow/react';

import type { Board, BoardCard, BoardEdge } from '../type/typesBoard';
import { BOARD_TEXT, type UiLanguage } from './serviceBoardLocale';

export type BoardNodeData = Record<string, unknown> & {
  card: BoardCard;
  language: UiLanguage;
};

export type BoardNode = Node<BoardNodeData, 'boardCard'>;
export type BoardLayoutMode = 'wide' | 'compact';
export type BoardEdgeData = Record<string, unknown> & {
  kind: BoardEdge['kind'];
  isDimmed: boolean;
  isRelated: boolean;
};
export type BoardFlowEdge = Edge<BoardEdgeData, 'boardString'>;
export type BoardSelectionHighlight = {
  selectedCardId: string;
  relatedCardIds: Set<string>;
  relatedEdgeIds: Set<string>;
};
export type BoardRelationship = {
  edge: BoardEdge;
  source: BoardCard | undefined;
  target: BoardCard | undefined;
};

export const createVisibleBoard = (board: Board, showResolved: boolean): Board => {
  if (showResolved) return board;
  const cards = board.cards.filter((card) => card.status !== 'resolved');
  const visibleCardIds = new Set(cards.map((card) => card.id));
  return {
    ...board,
    cards,
    edges: board.edges.filter((edge) => visibleCardIds.has(edge.from) && visibleCardIds.has(edge.to)),
  };
};

const getCardDepths = (board: Board): Map<string, number> => {
  const incoming = new Map(board.cards.map((card) => [card.id, 0]));
  const outgoing = new Map(board.cards.map((card) => [card.id, [] as string[]]));
  const depths = new Map(board.cards.map((card) => [card.id, 0]));

  for (const edge of board.edges) {
    if (!incoming.has(edge.from) || !incoming.has(edge.to)) continue;
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }

  const queue = board.cards.filter((card) => incoming.get(card.id) === 0).map((card) => card.id);
  for (let index = 0; index < queue.length; index += 1) {
    const sourceId = queue[index];
    const sourceDepth = depths.get(sourceId) ?? 0;
    for (const targetId of outgoing.get(sourceId) ?? []) {
      depths.set(targetId, Math.max(depths.get(targetId) ?? 0, sourceDepth + 1));
      const remaining = (incoming.get(targetId) ?? 1) - 1;
      incoming.set(targetId, remaining);
      if (remaining === 0) queue.push(targetId);
    }
  }

  return depths;
};

const getNodeSelectionClass = (
  cardId: string,
  selection: BoardSelectionHighlight | null,
): string | undefined => {
  if (!selection) return undefined;
  if (cardId === selection.selectedCardId) return 'board-node--selected';
  if (selection.relatedCardIds.has(cardId)) return 'board-node--related';
  return 'board-node--dimmed';
};

export const createNodes = (
  board: Board,
  savedPositions: Record<string, XYPosition> = {},
  language: UiLanguage = 'en',
  layoutMode: BoardLayoutMode = 'wide',
  selection: BoardSelectionHighlight | null = null,
): BoardNode[] => {
  const depths = getCardDepths(board);
  const columnCounts = new Map<number, number>();
  return board.cards.map((card) => {
    const maximumColumn = layoutMode === 'compact' ? 1 : 2;
    const column = Math.min(depths.get(card.id) ?? 0, maximumColumn);
    const row = columnCounts.get(column) ?? 0;
    columnCounts.set(column, row + 1);
    const position = layoutMode === 'compact'
      ? { x: 30 + column * 290, y: 70 + row * 180 }
      : { x: 80 + column * 360, y: 100 + row * 190 };
    return {
      id: card.id,
      type: 'boardCard',
      data: { card, language },
      position: savedPositions[card.id] ?? position,
      className: getNodeSelectionClass(card.id, selection),
    };
  });
};

export const createEdges = (
  board: Board,
  language: UiLanguage = 'en',
  selection: BoardSelectionHighlight | null = null,
): BoardFlowEdge[] => board.edges.map((edge) => {
  const isRelated = selection?.relatedEdgeIds.has(edge.id) ?? false;
  return {
    id: edge.id,
    source: edge.from,
    target: edge.to,
    label: BOARD_TEXT[language].edges[edge.kind],
    type: 'boardString',
    data: {
      kind: edge.kind,
      isDimmed: selection !== null && !isRelated,
      isRelated,
    },
    animated: edge.kind === 'contradicts',
  };
});

export const createSelectionHighlight = (
  board: Board,
  selectedCardId: string | null,
): BoardSelectionHighlight | null => {
  if (!selectedCardId) return null;
  const relatedCardIds = new Set([selectedCardId]);
  const relatedEdgeIds = new Set<string>();
  for (const edge of board.edges) {
    if (edge.from !== selectedCardId && edge.to !== selectedCardId) continue;
    relatedCardIds.add(edge.from);
    relatedCardIds.add(edge.to);
    relatedEdgeIds.add(edge.id);
  }
  return { selectedCardId, relatedCardIds, relatedEdgeIds };
};

export const getCardRelationships = (board: Board, cardId: string | null): BoardRelationship[] => {
  if (!cardId) return [];
  const cardsById = new Map(board.cards.map((card) => [card.id, card]));
  const relationships: BoardRelationship[] = [];
  for (const edge of board.edges) {
    if (edge.from !== cardId && edge.to !== cardId) continue;
    relationships.push({
      edge,
      source: cardsById.get(edge.from),
      target: cardsById.get(edge.to),
    });
  }
  return relationships;
};

const isLayoutPosition = (value: unknown): value is XYPosition => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if (!('x' in value) || !('y' in value)) return false;
  return typeof value.x === 'number'
    && Number.isFinite(value.x)
    && typeof value.y === 'number'
    && Number.isFinite(value.y);
};

export const parseLayout = (value: string): Record<string, XYPosition> => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const positions: Record<string, XYPosition> = {};
    for (const [cardId, position] of Object.entries(parsed)) {
      if (isLayoutPosition(position)) positions[cardId] = position;
    }
    return positions;
  } catch {
    return {};
  }
};

export const loadLayout = (boardId: string, layoutMode: BoardLayoutMode): Record<string, XYPosition> => {
  try {
    const value = window.localStorage.getItem(`thinkboard-layout:v2:${layoutMode}:${boardId}`);
    if (!value) return {};
    return parseLayout(value);
  } catch {
    return {};
  }
};

export const saveLayout = (boardId: string, layoutMode: BoardLayoutMode, nodes: BoardNode[]): void => {
  try {
    const positions: Record<string, XYPosition> = {};
    for (const node of nodes) positions[node.id] = node.position;
    window.localStorage.setItem(`thinkboard-layout:v2:${layoutMode}:${boardId}`, JSON.stringify(positions));
  } catch {
    // Layout persistence is optional; the current canvas remains usable without browser storage.
  }
};
