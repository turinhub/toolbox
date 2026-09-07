# Turinhub Toolbox

Turinhub Toolbox is a free, ad-free, open source online toolbox built with Next.js.
It focuses on practical developer, text, time, image, and network utilities.

Live site: [toolbox.turinhub.com](https://toolbox.turinhub.com)

## Features

- Developer tools: JSON formatter, JSON visual editor, SQL formatter, XML formatter, JWT, Base64, URL codec, API tester, MCP tester, regex tester, UUID generator.
- Image and design tools: SVG renderer, Mermaid renderer, image to ICO, QR generator, color palette.
- AI and network tools: prompt optimizer, OpenAI-compatible API checker, domain checker, S3 checker, FTP/FTPS/SFTP checker, Docker Registry browser.
- Utility tools: text compare, Markdown to WeChat, Chinese to pinyin, number to Chinese, timestamp converter, time calculator, math calculator, calendar, GPU VRAM calculator, database storage calculator.

## Privacy Model

Most tools process input in the browser. Network tools can send data directly to the endpoint you enter or through the deployment server; Prompt Optimizer uses a server-configured AI provider. [PRIVACY.md](./PRIVACY.md) describes each processing mode, local storage, remote preview resources, and analytics.

Saving a configuration can retain sensitive data: API Tester preserves headers and bodies as entered. Docker Registry saves the config name, URL, and username without the password; see [password storage and migration](./SECURITY.md#docker-registry-password-storage) for how older configurations are cleaned up.

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS and shadcn/ui
- Lucide React
- pnpm
- Vercel
- Cloudflare Turnstile

## Local Development

Requirements:

- Node.js 20.9.0 or newer
- pnpm 10.18.3 (pinned in `packageManager`; use `corepack pnpm` to match the repository version)

Install and run:

```bash
git clone https://github.com/turinhub/toolbox.git
cd toolbox
corepack pnpm install
cp .env.example .env.local
corepack pnpm dev
```

Open http://localhost:3000.

## Environment Variables

Copy `.env.example` to `.env.local` and fill only the values needed by the tools you use:

- `NEXT_PUBLIC_SITE_URL`: public site URL used for SEO metadata; use `https://toolbox.turinhub.com` for the official deployment and your own origin when self-hosting. The example uses `http://localhost:3000` for local development. See [SEO Monitoring](./SEO_MONITORING.md) for domain checks, including the generated `robots.txt` sitemap URL.
- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY` and `CLOUDFLARE_TURNSTILE_SECRETKEY`: Cloudflare Turnstile verification.
- `TOOLBOX_PROXY_TURNSTILE`: optional page-level verification gate in `proxy.ts`; enabled only when set to `true` and both Turnstile keys are configured. It defaults to off and does not control the MCP API's separate verification requirement.
- `MCP_TESTER_ALLOWED_PORTS`: comma-separated MCP destination ports; defaults to `443`.
- `MCP_TESTER_ALLOW_PRIVATE_NETWORKS`: allows RFC1918/ULA destinations only in non-production self-hosted environments; loopback, link-local, metadata, multicast, and reserved addresses remain blocked.
- `MCP_TESTER_BYPASS_HUMAN_VERIFICATION`: explicit development/E2E bypass; it is ignored in production.
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`: Prompt Optimizer backend provider.

The example credentials are placeholders, not working keys. Browser-local tools can be used without provider credentials; MCP proxy operations require valid Turnstile configuration and verification in production.

Optional npm mirror for China-based development:

```bash
corepack pnpm config set registry https://registry.npmmirror.com
```

## Quality Checks

Run these before opening a pull request:

```bash
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

Use `corepack pnpm format` to apply Prettier formatting. GitHub Actions runs these four checks; browser tests are separate.

### Logic Tests

```bash
corepack pnpm exec playwright test --config playwright.unit.config.ts
```

These tests use the Playwright test runner without starting an application server or browser. They cover JSON editing, QR image loading and cancellation, regex Worker behavior, safe highlighting, and the static Worker verification exemption. Run them separately from the browser suite; GitHub Actions does not currently run either test suite.

### Browser Tests

```bash
corepack pnpm exec playwright install chromium
corepack pnpm test:e2e
```

Playwright uses one worker and starts a local development server on port 3000 when needed. Use `PORT` to choose another port, or set `PLAYWRIGHT_BASE_URL` to test an already running deployment without starting a server. The local test server enables the development-only MCP verification bypass; that bypass does not apply to production deployments.

SEO tests expect `https://toolbox.turinhub.com` by default. The Playwright-managed server uses the same origin, overriding local env files. Set `SEO_EXPECTED_ORIGIN` (or a shell-level `NEXT_PUBLIC_SITE_URL`) to test another canonical origin. When using `PLAYWRIGHT_BASE_URL`, set the expected origin to match that deployment's build-time site URL; this can differ from its test access URL.

For navigation and browser-local tool smoke tests against an existing deployment:

```bash
PLAYWRIGHT_BASE_URL=https://toolbox.turinhub.com corepack pnpm test:e2e tests/e2e/navigation.spec.ts tests/e2e/tools.spec.ts
```

## Documentation

| Document                                 | Purpose                                                             |
| ---------------------------------------- | ------------------------------------------------------------------- |
| [PRIVACY.md](./PRIVACY.md)               | Current data flows, storage, and third-party requests               |
| [SECURITY.md](./SECURITY.md)             | Private vulnerability reporting, protections, and known limitations |
| [CONTRIBUTING.md](./CONTRIBUTING.md)     | Contribution workflow and documentation update rules                |
| [AGENTS.md](./AGENTS.md)                 | Agent implementation and review conventions                         |
| [SEO_MONITORING.md](./SEO_MONITORING.md) | Domain configuration, known SEO issues, and release checks          |
| [CHANGELOG.md](./CHANGELOG.md)           | Released changes and pending updates                                |

Vulnerabilities and leaked secrets should be reported through SECURITY.md, not public issues.

## License

MIT License. See [LICENSE](./LICENSE).
