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

[PRIVACY.md](./PRIVACY.md) is the reference for which tools send data to the deployment server, contact third parties, or store browser configurations. API Tester saves headers and bodies as entered; remove secrets before saving or sharing test cases.

## Docker Registry password storage

[Registry configuration storage](./lib/docker-registry-config.ts) allows only configuration names, URLs, and usernames. New saves omit the password field. Loading a configuration clears the current password and waits for the user to enter credentials if needed and explicitly connect.

Earlier versions saved passwords in `localStorage`. When the updated Registry page opens, it rewrites valid saved configurations without passwords while preserving names, URLs, and usernames. This migration runs only in the browser and origin where the tool is opened; it cannot clean other browsers, backups, or copies from earlier deployments. Removing a stored password does not revoke the registry credential.

If the stored data is malformed or browser storage cannot be read or updated, the page displays an error and disables saving to avoid overwriting existing configurations. Check browser storage permissions, or clear this tool's saved data in browser settings and reload. A failed migration can leave an old password in storage until cleanup succeeds. Save and delete failures are reported without claiming the configuration was updated.

## Page verification

`TOOLBOX_PROXY_TURNSTILE=true` enables the optional page gate only when both Turnstile keys are configured. The home pages and excluded static resources remain accessible. API routes are excluded from this page gate; the MCP API enforces its own verification requirement. Do not treat the page gate as authentication for all APIs or server actions.

## MCP Tester proxy controls

MCP Tester accepts public HTTPS Streamable HTTP endpoints. Production allows port 443 by default and rejects URL credentials, loopback, private, link-local, and reserved IPv4 or IPv6 destinations. DNS results are validated and pinned for the connection; redirects are limited to same-origin, revalidated HTTP 307/308 responses.

Non-production self-hosted deployments can explicitly allow RFC1918 and IPv6 ULA destinations. Loopback, link-local, metadata, multicast, documentation, and other reserved addresses remain blocked even when that option is enabled.

The proxy rejects connection-level, forwarding, cookie, origin, referer, `Sec-*`, `MCP-*`, and content-length headers. Header values are redacted from returned errors and protocol records. Requests and responses have fixed size and timeout limits, and each instance applies per-IP concurrency and fixed-window rate limits.

MCP proxy operations require a signed, one-hour human-verification cookie. Production fails closed when Turnstile is not configured. The development bypass is explicit and is never honored in production. Invalid or oversized requests may be rejected before the verification check.
