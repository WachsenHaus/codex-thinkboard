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
      "tags": []
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
