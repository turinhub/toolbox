# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately by emailing zhangxudong@turinhub.com.

Include:

- Affected feature or route.
- Steps to reproduce.
- Potential impact.
- Suggested fix, if known.

Please do not create public GitHub issues for vulnerabilities, leaked secrets, or exploit details.

## Sensitive data

Never commit real API keys, passwords, private keys, tokens, session cookies, or `.env.local`.

Some tools intentionally work with sensitive connection settings:

- OpenAI Checker can send API keys to the endpoint entered by the user.
- API Tester can send custom headers and request bodies to the endpoint entered by the user.
- MCP Tester sends endpoints, temporary headers, arguments, and results through the deployment server for one operation at a time.
- S3 Checker can send S3 access details to the deployment server for testing.
- FTP Checker can send FTP/FTPS/SFTP credentials to the deployment server for testing and file operations.
- Prompt Optimizer sends prompts to the configured OpenAI-compatible provider.

Sensitive fields are not saved to browser `localStorage` by default where the tool has structured credential fields. Users should still avoid saving test cases that contain tokens in headers or request bodies.

## MCP Tester proxy controls

MCP Tester accepts public HTTPS Streamable HTTP endpoints. Production allows port 443 by default and rejects URL credentials, loopback, private, link-local, and reserved IPv4 or IPv6 destinations. DNS results are validated and pinned for the connection; redirects are limited to same-origin, revalidated HTTP 307/308 responses.

Non-production self-hosted deployments can explicitly allow RFC1918 and IPv6 ULA destinations. Loopback, link-local, metadata, multicast, documentation, and other reserved addresses remain blocked even when that option is enabled.

The proxy rejects connection-level, forwarding, cookie, origin, referer, `Sec-*`, `MCP-*`, and content-length headers. Header values are redacted from returned errors and protocol records. Requests and responses have fixed size and timeout limits, and each instance applies per-IP concurrency and fixed-window rate limits.

Every MCP API request requires a signed, one-hour human-verification cookie. Production fails closed when Turnstile is not configured. The development bypass is explicit and is never honored in production.
