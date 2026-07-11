# Codex Thinkboard

[한국어](README.ko.md)

[![CI](https://github.com/WachsenHaus/codex-thinkboard/actions/workflows/ci.yml/badge.svg)](https://github.com/WachsenHaus/codex-thinkboard/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/WachsenHaus/codex-thinkboard)](LICENSE)

> Turn fuzzy intent into a living map of what you want and what you still need to discover.

Thinkboard is an open-source Codex plugin for guided sensemaking. It uses a friendly question loop to separate desired outcomes, important unknowns, evidence, and assumptions.

**Status:** early alpha. The conversational skill and board contract are available now. The local interactive canvas is the next milestone.

## Why this is not another mind map

A normal mind map organizes topics. Thinkboard organizes a decision.

- A `want` says what success changes.
- An `unknown` matters only when it can block or change a want.
- `evidence` records what the user has actually confirmed.
- An `assumption` keeps an AI interpretation visibly provisional.

The strongest rule is simple: **every active unknown must connect to a want it can block, change, or resolve.**

## Experience

Thinkboard follows a guided-externalization loop:

1. Codex reflects the fuzzy starting point.
2. It asks one high-leverage question.
3. The board changes visibly.
4. The user corrects the interpretation.
5. Contradictions become friendly follow-up questions.
6. The session ends with a concrete outcome, ranked unknowns, and a next action.

The intended balance is 60% guided dialogue, 30% direct board manipulation, and 10% detective-board atmosphere. See [Product principles](docs/PRODUCT.md).

## Install

Add this GitHub repository as a Codex plugin marketplace:

```sh
codex plugin marketplace add WachsenHaus/codex-thinkboard
codex plugin add codex-thinkboard@codex-thinkboard
```

Start a new Codex task after installation, then invoke the skill explicitly:

```text
$thinkboard Help me clarify whether I should build this feature.
```

Natural prompts such as `thinkboard`, `씽크보드 시작`, or “help me figure out what I actually want” are also described as triggers, but explicit invocation is the most reliable.

## Local-first privacy

Thinkboard is being designed local-first because a board may contain private goals, uncertainty, and unfinished thoughts.

- The current skill sends data nowhere beyond the Codex environment the user already chose.
- Future local board sessions will live in a user-controlled data directory.
- Session files are ignored by Git by default.
- Telemetry, accounts, collaboration, and hosted sync are not part of the first release.

Read [PRIVACY.md](PRIVACY.md) before using Thinkboard with sensitive information.

## Repository layout

```text
.agents/plugins/marketplace.json       Repository marketplace
plugins/codex-thinkboard/
  .codex-plugin/plugin.json            Plugin manifest
  skills/thinkboard/SKILL.md            Conversation protocol
  skills/thinkboard/references/         Canonical board model
docs/PRODUCT.md                         Product and interaction principles
scripts/check.mjs                       Zero-dependency repository validation
```

## Roadmap

- [x] Public plugin and marketplace scaffold
- [x] Thinkboard conversation protocol
- [x] Canonical board JSON and Markdown fallback
- [ ] Local MCP server with session storage
- [ ] React Flow canvas with spotlight and red-string interactions
- [ ] JSON and PNG export
- [ ] GitHub Pages sample-board demo
- [ ] Optional embedded Apps SDK UI where the host supports it

Collaboration, accounts, freehand drawing, and hosted sync are deliberately out of scope until the core question loop proves useful.

## Development

Requirements: Node.js 22 or newer.

```sh
npm ci
npm run check
```

The check verifies the plugin manifest, marketplace entry, skill frontmatter, and absence of scaffold placeholders. Before release, the plugin must also be installed and exercised with a real Codex client; a standalone validator is not treated as the final source of truth.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md). Use GitHub Discussions for open-ended product ideas and issues for reproducible bugs or scoped proposals. Never attach raw Thinkboard sessions without removing personal information, prompts, tokens, and local paths.

## License

Licensed under [Apache-2.0](LICENSE).
