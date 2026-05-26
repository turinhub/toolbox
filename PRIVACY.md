# Privacy

Turinhub Toolbox is designed to keep data local whenever a tool can work entirely in the browser. Some tools need network access or server-side execution to do their job. This document explains the default data flow.

## Browser-local tools

Examples include JSON formatting, SQL/XML formatting, JWT decoding, Base64, URL codec, UUID, timestamp, text compare, QR generation, SVG rendering, Mermaid rendering, and most calculators.

These tools process data in your browser tab. The project backend does not need the input to operate these features.

## Browser network tools

Examples include API Tester and OpenAI Checker when direct browser requests are used.

These tools send requests from your browser to the endpoint you enter. Request URLs, headers, bodies, API keys, and responses are handled by your browser and the remote service you choose.

Saved test cases are stored in the current browser's `localStorage`. Treat saved headers and request bodies as local sensitive data if they contain tokens or private content.

## Server-assisted tools

Examples include S3 Checker and FTP/FTPS/SFTP Checker.

These tools may send connection details to the server running this deployment so the server can test or proxy storage connections. The server should not persist those credentials, but it necessarily receives them while handling the request.

Saved S3/FTP configurations are stored in the current browser's `localStorage`. Secret keys, passwords, private keys, and passphrases are not saved by default.

## Third-party AI tools

Prompt Optimizer sends the prompt you enter to the OpenAI-compatible provider configured by the deployment through server-side environment variables.

Do not submit secrets, private source code, personal data, or confidential business data unless you trust the configured provider and this deployment.

## Analytics and anti-abuse

The application may load analytics and Cloudflare Turnstile scripts. Those providers can receive standard browser request metadata according to their own policies.

## Local deployment

You can self-host the project and inspect the code paths that handle your data. Review `.env.example` before enabling provider-backed features.
