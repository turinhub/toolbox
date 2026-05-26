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
- S3 Checker can send S3 access details to the deployment server for testing.
- FTP Checker can send FTP/FTPS/SFTP credentials to the deployment server for testing and file operations.
- Prompt Optimizer sends prompts to the configured OpenAI-compatible provider.

Sensitive fields are not saved to browser `localStorage` by default where the tool has structured credential fields. Users should still avoid saving test cases that contain tokens in headers or request bodies.
