# Privacy

Turinhub Toolbox is designed to keep data local whenever a tool can work entirely in the browser. Some tools need network access or server-side execution to do their job. This document explains the default data flow.

## Browser-local tools

Examples include JSON formatting, SQL/XML formatting, JWT decoding, Base64, URL codec, UUID, timestamp, text compare, QR generation, SVG rendering, Mermaid rendering, and most calculators.

These tools process data in your browser tab. The project backend does not need the input to operate these features.

Local processing does not mean the whole page is offline. Markdown to WeChat previews load remote images referenced in the content, including the default example image. Embedded resources and enabled interactive content can make browser requests to third parties.

## Browser network tools

Examples include API Tester, OpenAI Checker, and S3 Checker's browser mode.

These tools send requests from your browser to the endpoint you enter. Request URLs, headers, bodies, API keys, and responses are handled by your browser and the remote service you choose.

API Tester saves test cases in the current browser's `localStorage`, including headers and request bodies as entered. OpenAI Checker omits its API key when saving a configuration. Treat saved headers, bodies, and URLs as sensitive if they contain tokens or private content.

## Server-assisted tools

Examples include MCP Tester, S3 Checker's server proxy mode, FTP/FTPS/SFTP Checker, Docker Registry, Domain Checker, and Chinese to Pinyin.

Storage and registry tools send connection details to the server running this deployment so it can test connections and perform requested operations. Docker Registry also contacts the registry's authentication service when required. Chinese to Pinyin sends the input text and conversion options to `/api/chinese-to-pinyin`. Domain Checker sends the domain to the deployment server, which performs DNS, TLS, and HTTPS checks.

Saved S3/FTP configurations are stored in the current browser's `localStorage`. Secret keys, passwords, private keys, and passphrases are not saved by default.

Docker Registry saves only the configuration name, registry URL, and username to `localStorage`. The password field stays in page memory and is cleared when loading a saved configuration; loading does not connect automatically. On opening the updated tool, old saved configurations are rewritten without password fields. This cleanup only affects the current browser and origin after the update is deployed and the tool is opened. See [SECURITY.md](./SECURITY.md#docker-registry-password-storage) for migration failures and earlier versions.

MCP Tester sends its endpoint, custom headers, tool or prompt arguments, and remote MCP results through the deployment server for each requested action. Header values stay in page memory and MCP Tester does not write its endpoint, headers, arguments, or results to the URL, `localStorage`, or persistent application storage. Remote text and JSON are displayed as data; remote HTML and MCP Apps are not executed or rendered, and remote media is not loaded automatically.

The MCP proxy validates destinations, applies request and response limits, and requires Cloudflare Turnstile verification in production. It supports public HTTPS MCP endpoints on port 443 by default. `MCP_TESTER_ALLOWED_PORTS` can change allowed ports in any environment; private-network access can only be enabled in non-production self-hosted environments. These controls describe the MCP proxy and should not be assumed to cover the other network tools.

Server-assisted processing exposes submitted data to the deployment operator and the contacted services. Hosting, request, and error logs may retain metadata; review the deployment's logging configuration before using sensitive inputs.

## Third-party AI tools

Prompt Optimizer sends the prompt you enter to the OpenAI-compatible provider configured by the deployment through server-side environment variables.

Do not submit secrets, private source code, personal data, or confidential business data unless you trust the configured provider and this deployment.

## Analytics and anti-abuse

The application shell loads Umami analytics from `umami.loongtales.com` and Cloudflare Turnstile from `challenges.cloudflare.com`. Those services can receive browser request metadata. Successful human verification creates a signed `human_verified` cookie valid for one hour.

The browser also stores the five most recently visited tool paths and the theme preference. The recent-tools list can be cleared from the home page. These preferences are separate from saved tool configurations and inputs.

## Local deployment

You can self-host the project and inspect the code paths that handle your data. Review `.env.example` before enabling provider-backed features.
