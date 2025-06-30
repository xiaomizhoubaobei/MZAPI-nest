# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it to us as described below.

### Where to Report

Please report security vulnerabilities by emailing **mzapi@x.mizhoubaobei.top** or by creating a private security advisory on GitHub.

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

### What to Include

Please include as much of the following information as possible:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### Response Timeline

We will acknowledge receipt of your vulnerability report within 48 hours and will send you regular updates about our progress. If you have not received a response to your email within 48 hours, please follow up to ensure we received your original message.

### Disclosure Policy

We follow a coordinated disclosure policy. We will work with you to understand and resolve the issue quickly and will coordinate the timing of the disclosure.

## Security Best Practices

### For Contributors

- Keep dependencies up to date
- Use security linting tools
- Follow secure coding practices
- Never commit secrets, API keys, or passwords
- Use environment variables for sensitive configuration

### For Users

- Keep your installation up to date
- Use strong authentication mechanisms
- Regularly review access logs
- Follow the principle of least privilege
- Use HTTPS in production environments

## Security Updates

Security updates will be released as soon as possible after a vulnerability is confirmed and a fix is available. We recommend subscribing to our security advisories to stay informed about security updates.

## Contact

For any security-related questions or concerns, please contact:

- Email: mzapi@x.mizhoubaobei.top
- GitHub Security Advisories: [Create a private security advisory](https://github.com/xiaomizhoubaobei/MZAPI-nest/security/advisories/new)

## Acknowledgments

We thank the security community for helping us maintain the security of our project. Contributors who responsibly disclose security vulnerabilities will be acknowledged in our security advisories (unless they prefer to remain anonymous).