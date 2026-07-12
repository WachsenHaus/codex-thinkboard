# Product principles

## The product is guided externalization

Thinkboard should not choose between conversation and canvas. Conversation directs attention, the board externalizes working memory, and user corrections in Codex remain authoritative. The web canvas is a semantic read-only projection; visual layout remains locally adjustable.

The default balance is:

- **70% guided dialogue:** one high-leverage question at a time, using native quick choices when useful.
- **20% visual inspection and correction:** understand the current board, then correct meaning through natural language in Codex.
- **10% detective-board atmosphere:** spotlight, pins, red strings, and case language.

Roleplay is decoration, not ontology. A user should understand the board without knowing the theme.

## Why this form

This is a product inference from established cognitive and HCI findings, not a clinical claim.

- Self-explanation can improve understanding, supporting a dialogue that asks users to articulate reasons rather than passively accept an AI summary: [Chi et al., 1994](https://doi.org/10.1207/s15516709cog1803_3).
- Actions on external representations can make some cognitive work easier and more reliable than doing it mentally, supporting a manipulable board: [Kirsh & Maglio, 1994](https://doi.org/10.1207/s15516709cog1804_1).
- Direct manipulation reduces the distance between intention and interface action when representations map clearly to meaning: [Hutchins, Hollan, and Norman, 1985](https://doi.org/10.1207/S15327051HCI0104_2).
- Verbal and visual material both have limited processing capacity, supporting a focused board rather than a wall of animated cards: [Mayer & Moreno, 2003](https://doi.org/10.1207/S15326985EP3801_6).

## Core interaction loop

1. **Reflect:** state the current interpretation in one sentence.
2. **Pin:** add or change only the cards justified by the user's words.
3. **Spotlight:** select the ambiguity with the highest decision impact.
4. **Ask:** use one question that can change the graph.
5. **Correct:** let the user correct the model's interpretation through Codex dialogue.
6. **Connect:** Codex writes typed relationships; the user corrects their meaning in natural language instead of drawing lines.
7. **Close:** confirm outcome, non-goals, ranked unknowns, and next action.

## Visual semantics

- Wants use cool, stable colors.
- Unknowns use warm colors and a visible unresolved state.
- Evidence looks pinned and grounded.
- Assumptions remain translucent until confirmed.
- Red strings are reserved for high-impact dependencies and contradictions; using them everywhere destroys their meaning.
- The currently discussed card receives a spotlight while the rest of the board quiets down.

## Technical direction

The canonical state is structured board JSON. The web canvas is a projection of that state.

React Flow is the semantic graph engine because it supports custom React nodes and typed edges under an MIT license. The detective-board feel comes from CSS/SVG styling rather than making a freehand drawing file the source of truth. See the [React Flow repository](https://github.com/xyflow/xyflow) and [layout guide](https://reactflow.dev/learn/layouting/layouting).

The first visual release is local-first and runs on loopback only:

```text
Thinkboard skill -> local MCP tools -> board JSON -> local React Flow web UI
```

The bundled stdio MCP process owns board persistence and also serves the static canvas at `127.0.0.1:43127`. The canvas reads the canonical board through loopback-only HTTP endpoints. Card positions remain a local visual preference; semantic cards and typed edges can change only through validated MCP updates from Codex.

An embedded Apps SDK surface may follow, but public OpenAI documentation currently describes custom UI as ChatGPT UI, so standalone structured-text and local-web fallbacks remain required. See [Build plugins](https://learn.chatgpt.com/docs/build-plugins) and [Build an app](https://learn.chatgpt.com/docs/build-app).

The planned real-time Codex conversation client, quick-choice questions, automatic relationship management, and remote CLI handoff are specified in [Thinkboard real-time conversation development](./REALTIME_CONVERSATION.md).

## Deliberate non-goals for the first release

- General-purpose whiteboarding
- Freehand drawing
- Multi-user collaboration
- Accounts or cloud sync
- AI-generated certainty
- Therapy, diagnosis, or professional decision-making
- A large taxonomy of card and edge types
