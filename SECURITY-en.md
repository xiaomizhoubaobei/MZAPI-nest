# Security Policy

## Supported Versions

We commit to maintaining security for all currently supported versions of this project. 

| Version  | Supported          |
|----------|--------------------|
| Latest   | :white_check_mark: |
| < Latest | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** create a public issue or discuss it in public forums
2. Email our security team at: security@example.com
3. Include detailed information about:
   - The vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

We will:
- Acknowledge receipt of your report within 48 hours
- Provide a timeline for addressing the issue
- Notify you when the vulnerability has been fixed
- Credit you in our security advisories (unless you prefer to remain anonymous)

## Security Best Practices

### For Users
- Always use the latest stable version
- Review dependency updates for security fixes
- Follow principle of the least privilege when configuring permissions

### For Developers
- All dependencies are regularly scanned for vulnerabilities
- Code reviews are required for all changes
- Automated security testing is part of our CI/CD pipeline
- Secrets are never committed to version control

## Disclosure Policy

We follow a 90-day disclosure timeline for confirmed vulnerabilities:

- Day 0-30: Private remediation window
- Day 31-60: Coordinated disclosure with reporters
- Day 61-90: Public disclosure

This policy may be adjusted for critical vulnerabilities requiring immediate attention.

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.x) and announced via:
- GitHub Security Advisories
- Project mailing list (if subscribed)
- Release notes with "Security" label

Last Updated: 2025-08-07