# Contributing

Thanks for helping improve Turinhub Toolbox.

## Development

See [Local Development](./README.md#local-development) for requirements, installation, and startup instructions.

## Branches and commits

- Use a short branch name that describes the change, for example `feat/new-tool` or `fix/s3-errors`.
- Keep pull requests focused on one behavior or tool.
- Do not commit real credentials, `.env.local`, build output, or local editor files.

## Before opening a PR

Run the [Quality Checks](./README.md#quality-checks) before opening a pull request.

## Privacy and security checklist

If your change adds a new tool, API route, server action, analytics script, storage behavior, or third-party provider, update the data-flow details in `PRIVACY.md` and adjust the summary in `README.md` when needed.

Do not store API keys, passwords, private keys, tokens, or passphrases by default. If local persistence is necessary, make it explicit in the UI and document the risk.

## Environment variables

Add new environment variables to `.env.example` and document them in `README.md`. Use safe placeholder values only.

## Documentation updates

Keep setup and test commands in [README.md](./README.md), data-flow details in [PRIVACY.md](./PRIVACY.md), security protections and limitations in [SECURITY.md](./SECURITY.md), and deployment-domain checks in [SEO_MONITORING.md](./SEO_MONITORING.md). Link to these sections instead of duplicating them.

Describe implemented behavior separately from planned fixes. Keep known-issue notices until the relevant code and verification support removing them. Add changes under `Unreleased` in [CHANGELOG.md](./CHANGELOG.md); preserve published entries.

Agent conventions live in [AGENTS.md](./AGENTS.md). Local assistant entry files such as `CLAUDE.md` should only refer to that guide and remain ignored by Git.
