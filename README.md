# Turinhub Toolbox

Turinhub Toolbox is a free, ad-free, open source online toolbox built with Next.js.
It focuses on practical developer, text, time, image, and network utilities.

Live site: https://turinhub.com

## Features

- Developer tools: JSON formatter, JSON visual editor, SQL formatter, XML formatter, JWT, Base64, URL codec, API tester, regex tester, UUID generator.
- Image and design tools: SVG renderer, Mermaid renderer, image to ICO, QR generator, color palette.
- AI and network tools: prompt optimizer, OpenAI-compatible API checker, domain checker, S3 checker, FTP/FTPS/SFTP checker, Docker Registry browser.
- Utility tools: text compare, Chinese to pinyin, number to Chinese, timestamp converter, time calculator, math calculator, calendar.

## Privacy Model

Most tools run in the browser and do not need server-side processing. Some tools need network access by design:

- Browser-local tools process data in the current browser tab.
- API Tester and OpenAI Checker may send requests directly from your browser to the endpoint you enter.
- S3 Checker and FTP Checker may send connection details to this deployment's server to test or proxy storage connections.
- Prompt Optimizer sends prompts to the configured OpenAI-compatible service on the server.

Saved configurations are stored in the current browser's `localStorage`. Sensitive fields such as API keys, S3 secret keys, FTP passwords, private keys, and passphrases are not saved by default. See [PRIVACY.md](./PRIVACY.md) for details.

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

- Node.js 20 or newer
- pnpm 9 or newer

Install and run:

```bash
git clone https://github.com/turinhub/toolbox.git
cd toolbox
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000.

## Environment Variables

Copy `.env.example` to `.env.local` and fill only the values needed by the tools you use:

- `NEXT_PUBLIC_SITE_URL`: public site URL used for SEO metadata.
- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY` and `CLOUDFLARE_TURNSTILE_SECRETKEY`: Cloudflare Turnstile verification.
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`: Prompt Optimizer backend provider.
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`: reserved for Cloudflare-backed features.

Optional npm mirror for China-based development:

```bash
pnpm config set registry https://registry.npmmirror.com
```

## Quality Checks

Run these before opening a pull request:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Use `pnpm format` to apply Prettier formatting.

## SEO Monitoring

SEO metadata, sitemap data, structured data, and tool descriptions are generated
from `lib/routes.ts` and `lib/seo.ts`. See [SEO_MONITORING.md](./SEO_MONITORING.md)
for the post-release Search Console, Baidu, and Core Web Vitals checklist.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before sending a pull request.

## Security

Please do not open public issues for vulnerabilities or leaked secrets. See [SECURITY.md](./SECURITY.md).

## License

MIT License. See [LICENSE](./LICENSE).
