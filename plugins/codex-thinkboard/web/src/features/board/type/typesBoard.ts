import { z } from 'zod';

export const CardStatusSchema = z.enum(['candidate', 'confirmed', 'resolved', 'rejected']);
export const BoardPhaseSchema = z.enum(['opening', 'clarifying', 'challenging', 'ready']);
export const EdgeKindSchema = z.enum(['depends_on', 'blocks', 'contradicts', 'resolves']);

const CardBaseSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  status: CardStatusSchema,
  tags: z.array(z.string()),
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
export type BoardConnectionStatus = 'connecting' | 'live' | 'fallback' | 'offline';
