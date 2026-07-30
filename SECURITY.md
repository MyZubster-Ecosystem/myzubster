# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

We recommend always using the latest stable release to ensure you receive security patches.

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Send a private security report via one of the following methods:

   - **GitHub Security Advisories**: Use the ["Report a vulnerability"](https://github.com/MyZubster-Ecosystem/myzubster/security/advisories/new) feature
   - **Email**: Contact the maintainers directly through GitHub

### What to Include

When reporting, please include:

- Type of vulnerability (e.g., XSS, SQL injection, CSRF, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact assessment of the vulnerability

### Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix Timeline**: Depending on severity; critical issues are addressed as soon as possible

---

## Security Best Practices

When contributing to MyZubster, please follow these security guidelines:

### General

- Never commit sensitive data (API keys, passwords, private keys, credentials)
- Use environment variables for configuration secrets
- Validate and sanitize all user inputs
- Follow the principle of least privilege

### For Payments (Monero Integration)

- Never log or store wallet private keys
- Use secure RPC connections for Monero wallet interactions
- Validate all transaction amounts and addresses
- Implement proper error handling without exposing sensitive information

### For AI Components

- Sanitize inputs to AI models to prevent prompt injection
- Validate AI outputs before using them in critical operations
- Never expose training data that may contain sensitive information

---

## Security Updates

Security updates will be released as patch versions and announced through:

- GitHub Security Advisories
- Release notes
- Project communications

---

## Bounty Information

Currently, MyZubster does not have a formal bug bounty program. However, we appreciate and acknowledge responsible disclosure of security vulnerabilities. Significant contributions may be recognized in our release notes or contributor acknowledgments.

---

## Dependencies

We use GitHub's dependency scanning and Dependabot to:

- Monitor dependencies for known vulnerabilities
- Automatically create pull requests for security updates
- Keep the ecosystem secure with up-to-date dependencies

---

*Last updated: July 2025*