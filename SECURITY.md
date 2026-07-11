# Security policy

## Supported versions

During early alpha, security fixes are applied to the `main` branch and the latest published release only.

## Report a vulnerability privately

Do not open a public issue for a vulnerability. Use GitHub Private Vulnerability Reporting:

https://github.com/WachsenHaus/codex-thinkboard/security/advisories/new

Include the affected version, impact, minimal reproduction, and any suggested mitigation. Do not include unrelated private board content, credentials, or tokens.

## Security priorities

Thinkboard treats these areas as security-sensitive:

- local server binding and origin checks;
- file paths and session storage;
- Markdown/HTML rendering of user content;
- MCP tool input validation;
- exports containing private thoughts;
- dependency and GitHub Actions supply chain;
- any future network, telemetry, authentication, or collaboration feature.

We will acknowledge a valid report as soon as practical and coordinate disclosure after a fix is available.
