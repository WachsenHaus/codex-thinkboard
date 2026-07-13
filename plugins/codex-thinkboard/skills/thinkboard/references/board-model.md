# Thinkboard board model

Use a small semantic graph. The visual canvas is a projection of this data, never the source of truth.

## Card types

| Type | Meaning | Test |
| --- | --- | --- |
| `want` | Desired outcome or explicit non-goal | Would achieving or avoiding this change success? |
| `unknown` | Missing answer that can change a want, choice, or next action | What changes when this becomes known? |
| `evidence` | User-confirmed fact, observation, or source | What supports this claim? |
| `assumption` | Plausible but unconfirmed interpretation | Has the user confirmed this? |

Represent constraints as tags on relevant cards instead of adding another card type. Represent non-goals as `want` cards with `polarity: "exclude"`.

## Automatic organization metadata

Each card may include these projection fields:

- `topic`: a short semantic group label inferred by the AI or corrected by the user.
- `topicSource`: `ai` or `user`. A user-sourced topic must not be overwritten without explicit user direction.
- `stage`: `problem`, `idea`, `decision`, or `action`.
- `createdAt`: the card creation time as an ISO 8601 string. Preserve it across updates.

Topics are the default grouping dimension. Stages are badges inside a topic, and timestamps power the separate timeline view. These fields organize the canvas but do not change the card's semantic type or relationships.

## Relationships

Use only these edge kinds until a real case requires more:

- `depends_on`: the source cannot be satisfied without the target.
- `blocks`: the source prevents or delays the target.
- `contradicts`: both cards cannot currently be true under the same conditions.
- `resolves`: the source answers or removes the target unknown.

## Canonical JSON shape

```json
{
  "id": "board-id",
  "title": "Short case title",
  "phase": "opening",
  "cards": [
    {
      "id": "want-1",
      "type": "want",
      "text": "A concrete outcome",
      "polarity": "include",
      "status": "candidate",
      "tags": [],
      "topic": "Product direction",
      "topicSource": "ai",
      "stage": "decision",
      "createdAt": "2026-07-13T12:00:00+09:00"
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "from": "unknown-1",
      "to": "want-1",
      "kind": "blocks"
    }
  ]
}
```

Allowed phases are `opening`, `clarifying`, `challenging`, and `ready`.
Allowed card statuses are `candidate`, `confirmed`, `resolved`, and `rejected`.

## Invariants

1. Every active `unknown` connects to at least one active `want`.
2. Every `evidence` card records a user statement or source; model inference belongs in `assumption`.
3. Contradictions identify a condition to clarify, not a defect in the user.
4. Keep the active board small. Merge semantic duplicates and archive rejected cards.
5. Do not mark the board `ready` while a high-impact candidate want remains unconfirmed.
6. Preserve `topicSource: "user"` assignments and existing `createdAt` values unless the user explicitly requests a correction.

## Markdown fallback

```markdown
### What I want
- [confirmed/candidate] ...

### What I do not know yet
- ... -> affects: ...

### Evidence
- ...

### Assumptions to confirm
- ...

### Next question
...
```
