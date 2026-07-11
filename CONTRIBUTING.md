# Contributing

Thank you for helping make difficult thinking easier to inspect and correct.

## Before opening work

- Use Discussions for broad product ideas and experience proposals.
- Use an issue for a reproducible bug or a scoped feature.
- Keep changes small enough to explain and verify.
- Never include a real user's unredacted board or conversation.

## Local setup

Requirements: Node.js 22 or newer.

```sh
npm ci
npm run check
```

The repository currently has no runtime dependencies. Add a dependency only when it removes more complexity than it introduces.

## Pull requests

1. Explain the user-facing problem before the implementation.
2. Link the issue or Discussion when one exists.
3. Include verification evidence.
4. For UI changes, include before/after media and keyboard-access notes.
5. Call out privacy changes, new network access, persistent storage, or telemetry explicitly.
6. Update English and Korean installation instructions together when commands change.

Use Conventional Commit-style titles such as `feat:`, `fix:`, `docs:`, or `chore:`. A release workflow may use these titles later, but contributors do not need extra release metadata today.

## Design constraints

- Board JSON is canonical; the canvas is a view.
- Every active unknown must affect at least one want.
- AI inferences stay assumptions until the user confirms them.
- Prefer one meaningful question over a questionnaire.
- Keep detective styling subordinate to legibility and accessibility.

By contributing, you agree that your contribution is licensed under Apache-2.0.
