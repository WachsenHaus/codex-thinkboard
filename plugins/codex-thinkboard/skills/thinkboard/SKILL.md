---
name: thinkboard
description: Clarify fuzzy intent through a friendly, high-reasoning dialogue that identifies what the user wants, what they do not know, and which assumptions block the next decision. Use when the user says thinkboard or 씽크보드, asks to clarify an idea or requirement, feels unsure what they want, wants to expose blind spots, or needs a decision-ready map rather than a generic brainstorm.
---

# Thinkboard

Guide the user through a living case board. Treat the conversation as guided externalization: dialogue directs attention, the board holds working memory, and the user remains the authority on meaning.

## Core loop

1. Reflect the user's starting point in one plain sentence. Extract only 2-4 candidate cards; do not flood the board.
2. Find the single ambiguity whose answer would most change the board or the next action.
3. Ask one short, friendly question. Use `request_user_input` when it is available and the user is choosing among real tradeoffs. Default to one question; group 2-3 only when the answers are tightly coupled.
4. Update cards and relationships after the answer. State the meaningful change in one sentence before asking again.
5. Surface contradictions gently. Ask for priority, conditions, or exceptions instead of declaring the user inconsistent.
6. Close only when the user can confirm a concrete outcome, important non-goals, ranked unknowns, and one next action or experiment.

## MCP synchronization

When the bundled Thinkboard MCP tools are present:

1. Call `thinkboard_get_board` before resuming an existing case.
2. Call `thinkboard_update_board` after every answer that changes a card, relationship, priority, or phase.
3. Call `thinkboard_open_board` near the start and share its loopback-only canvas URL with the user.
4. Treat the MCP board as canonical. The web canvas is a semantic read-only projection; user corrections arrive through Codex dialogue and must be written through MCP.

Do not invent tool success. If a tool reports that the canvas is unavailable, continue with the Markdown fallback and state the limitation plainly.

Read [references/board-model.md](references/board-model.md) before creating or updating a structured board.

## Question discipline

- Ask only questions that can change a card, relationship, priority, or next action.
- Prefer a meaningful recommended default and include a free-form route when the question tool supports it.
- Use auto-resolution only for non-blocking details. Never auto-resolve values, identity, consent, or high-impact tradeoffs.
- If `request_user_input` is unavailable, ask one concise open-ended question. Do not imitate the tool with a numbered choice list, and never pretend the tool was called.
- Reflect before probing so the interaction feels collaborative rather than interrogative.
- Reason deeply in the background, but keep visible explanations short and concrete.

## Meaning and ownership

- Never promote an inference to a fact. Put it on an `assumption` card until the user confirms it.
- Let the user correct, merge, or reject any card through natural-language dialogue. Treat those corrections as authoritative and update the board through MCP. Visual card movement changes layout only.
- Preserve useful ambiguity when the user genuinely has not decided. The goal is clarity about uncertainty, not forced certainty.
- Do not turn the experience into therapy, diagnosis, or persuasion. For sensitive domains, clarify the decision without claiming professional authority.

## Board availability

When Thinkboard MCP tools are present, keep the canonical board synchronized through those tools. The bundled server exposes a loopback-only read-only canvas and stores the board in the user's local Codex data directory. Keep questions, quick choices, corrections, and tool approvals in the native Codex conversation. When no board UI or MCP tool is available, render the Markdown fallback from the board model and continue the same loop.

Apply the strongest invariant throughout: every unknown must connect to a want it can block, change, or resolve. Remove interesting but irrelevant unknowns from the active board.
