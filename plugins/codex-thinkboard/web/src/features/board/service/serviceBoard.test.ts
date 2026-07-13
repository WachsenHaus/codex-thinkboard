import { describe, expect, test } from 'vitest';

import { BoardSchema, type Board } from '../type/typesBoard';
import {
  createEdges,
  createNodes,
  createSelectionHighlight,
  createTimeline,
  createTopicGroups,
  createVisibleBoard,
  getCardRelationships,
  parseLayout,
} from './serviceBoard';

const board: Board = BoardSchema.parse({
  id: 'case-1',
  title: 'Test case',
  phase: 'clarifying',
  cards: [
    { id: 'want-1', type: 'want', text: 'A clear outcome', polarity: 'include', status: 'confirmed', tags: [] },
    { id: 'unknown-1', type: 'unknown', text: 'A blocking question', status: 'candidate', tags: [] },
  ],
  edges: [{ id: 'edge-1', from: 'unknown-1', to: 'want-1', kind: 'blocks' }],
});

describe('serviceBoard', () => {
  test('creates a visible node for every card', () => {
    expect(createNodes(board)).toHaveLength(2);
  });

  test('includes the selected UI language in every node', () => {
    const nodes = createNodes(board, {}, 'ko', 'wide');
    expect(nodes.every((node) => node.data.language === 'ko')).toBe(true);
  });

  test('uses a denser left-to-right relationship layout on compact screens', () => {
    const nodes = createNodes(board, {}, 'ko', 'compact');
    expect(nodes.find((node) => node.id === 'unknown-1')?.position).toEqual({ x: 30, y: 70 });
    expect(nodes.find((node) => node.id === 'want-1')?.position).toEqual({ x: 320, y: 70 });
  });

  test('translates semantic edge labels without changing the board', () => {
    expect(createEdges(board, 'ko')[0].label).toBe('막고 있음');
    expect(createEdges(board, 'en')[0].label).toBe('Blocks');
    expect(createEdges(board, 'ko')[0].data?.kind).toBe('blocks');
  });

  test('collects the selected card relationships with their endpoint cards', () => {
    const relationships = getCardRelationships(board, 'unknown-1');

    expect(relationships).toHaveLength(1);
    expect(relationships[0].source?.id).toBe('unknown-1');
    expect(relationships[0].target?.id).toBe('want-1');
  });

  test('highlights only the selected card and its direct neighborhood', () => {
    const boardWithUnrelatedCard = BoardSchema.parse({
      ...board,
      cards: [
        ...board.cards,
        { id: 'evidence-1', type: 'evidence', text: 'Unrelated evidence', status: 'confirmed', tags: [] },
      ],
    });
    const selection = createSelectionHighlight(boardWithUnrelatedCard, 'unknown-1');
    const nodes = createNodes(boardWithUnrelatedCard, {}, 'en', 'wide', selection);
    const edges = createEdges(boardWithUnrelatedCard, 'en', selection);

    expect(nodes.find((node) => node.id === 'unknown-1')?.className).toBe('board-node--selected');
    expect(nodes.find((node) => node.id === 'want-1')?.className).toBe('board-node--related');
    expect(nodes.find((node) => node.id === 'evidence-1')?.className).toBe('board-node--dimmed');
    expect(edges[0].data).toMatchObject({ isRelated: true, isDimmed: false });
  });

  test('keeps only finite card positions from saved layouts', () => {
    const layout = parseLayout(JSON.stringify({
      valid: { x: 10, y: 20 },
      missingY: { x: 30 },
      invalidX: { x: 'left', y: 40 },
    }));

    expect(layout).toEqual({ valid: { x: 10, y: 20 } });
    expect(parseLayout('null')).toEqual({});
    expect(parseLayout('{broken')).toEqual({});
  });

  test('folds resolved cards and their relationships out of the active board', () => {
    const resolvedBoard = BoardSchema.parse({
      ...board,
      cards: board.cards.map((card) => (
        card.id === 'unknown-1' ? { ...card, status: 'resolved' } : card
      )),
    });

    expect(createVisibleBoard(resolvedBoard, false).cards.map((card) => card.id)).toEqual(['want-1']);
    expect(createVisibleBoard(resolvedBoard, false).edges).toHaveLength(0);
    expect(createVisibleBoard(resolvedBoard, true)).toBe(resolvedBoard);
  });

  test('groups cards by AI topic and falls back to the first existing tag', () => {
    const organizedBoard = BoardSchema.parse({
      ...board,
      cards: [
        { ...board.cards[0], topic: 'Launch', topicSource: 'ai', stage: 'decision' },
        { ...board.cards[1], tags: ['Research'] },
      ],
    });

    expect(createTopicGroups(organizedBoard.cards).map((group) => group.topic)).toEqual(['Launch', 'Research']);
  });

  test('orders timestamped cards chronologically after legacy cards', () => {
    const organizedBoard = BoardSchema.parse({
      ...board,
      cards: [
        board.cards[0],
        { ...board.cards[1], createdAt: '2026-07-13T11:00:00+09:00' },
        { id: 'evidence-1', type: 'evidence', text: 'Earlier evidence', status: 'confirmed', tags: [], createdAt: '2026-07-13T10:00:00+09:00' },
      ],
    });

    expect(createTimeline(organizedBoard.cards).map((card) => card.id)).toEqual(['want-1', 'evidence-1', 'unknown-1']);
  });
});
