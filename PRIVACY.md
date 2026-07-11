# Privacy

Thinkboard is designed for local-first use because a board can reveal goals, uncertainty, constraints, and unfinished personal thoughts.

## Current alpha

The current release contains a Codex skill and a board data contract. It does not run a Thinkboard-operated server, create an account, send telemetry, or independently transmit board data.

Your existing Codex client, model provider, operating environment, and installed tools still process data according to their own settings and policies. Installing Thinkboard does not change those boundaries.

## Planned local canvas

The planned local MCP server and web canvas will:

- bind to the local machine by default;
- store sessions in the plugin's writable local data directory;
- avoid analytics and remote assets by default;
- make export and deletion explicit;
- never commit session data to the repository.

Any future hosted or collaborative mode must be optional, documented separately, and disabled by default.

## Reporting and examples

Do not paste raw sessions into public issues. Remove names, private goals, prompts, API keys, access tokens, machine paths, repository secrets, and identifying metadata. Prefer a small synthetic board that reproduces the behavior.

Security concerns should be reported privately as described in [SECURITY.md](SECURITY.md).
