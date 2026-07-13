import { z } from 'zod';

export const CardStatusSchema = z.enum(['candidate', 'confirmed', 'resolved', 'rejected']);
export const BoardPhaseSchema = z.enum(['opening', 'clarifying', 'challenging', 'ready']);
export const EdgeKindSchema = z.enum(['depends_on', 'blocks', 'contradicts', 'resolves']);
export const CardStageSchema = z.enum(['problem', 'idea', 'decision', 'action']);
export const TopicSourceSchema = z.enum(['ai', 'user']);
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

const CardBaseSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  status: CardStatusSchema,
  tags: z.array(z.string()),
  topic: z.string().min(1).optional(),
  topicSource: TopicSourceSchema.optional(),
  stage: CardStageSchema.optional(),
  createdAt: z.string().regex(ISO_TIMESTAMP).refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date').optional(),
});

const WantCardSchema = CardBaseSchema.extend({
  type: z.literal('want'),
  polarity: z.enum(['include', 'exclude']),
});

const UnknownCardSchema = CardBaseSchema.extend({ type: z.literal('unknown') });
const EvidenceCardSchema = CardBaseSchema.extend({ type: z.literal('evidence') });
const AssumptionCardSchema = CardBaseSchema.extend({ type: z.literal('assumption') });

export const BoardCardSchema = z.discriminatedUnion('type', [
  WantCardSchema,
  UnknownCardSchema,
  EvidenceCardSchema,
  AssumptionCardSchema,
]);

export const BoardEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  kind: EdgeKindSchema,
});

export const BoardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  phase: BoardPhaseSchema,
  cards: z.array(BoardCardSchema),
  edges: z.array(BoardEdgeSchema),
});

export type Board = z.infer<typeof BoardSchema>;
export type BoardCard = z.infer<typeof BoardCardSchema>;
export type BoardEdge = z.infer<typeof BoardEdgeSchema>;
export type CardStatus = z.infer<typeof CardStatusSchema>;
export type CardStage = z.infer<typeof CardStageSchema>;
export type BoardConnectionStatus = 'connecting' | 'live' | 'fallback' | 'offline';
