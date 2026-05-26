# Contributing

Thanks for helping improve Turinhub Toolbox.

## Development

```bash
git clone https://github.com/turinhub/toolbox.git
cd toolbox
pnpm install
cp .env.example .env.local
pnpm dev
```

Use Node.js 20 or newer and pnpm 9 or newer.

## Branches and commits

- Use a short branch name that describes the change, for example `feat/new-tool` or `fix/s3-errors`.
- Keep pull requests focused on one behavior or tool.
- Do not commit real credentials, `.env.local`, build output, or local editor files.

## Before opening a PR

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Use `pnpm format` if formatting fails.

## Privacy and security checklist

If your change adds a new tool, API route, server action, analytics script, storage behavior, or third-party provider, update `README.md` and `PRIVACY.md` with the data flow.

Do not store API keys, passwords, private keys, tokens, or passphrases by default. If local persistence is necessary, make it explicit in the UI and document the risk.

## Environment variables

Add new environment variables to `.env.example` and document them in `README.md`. Use safe placeholder values only.
