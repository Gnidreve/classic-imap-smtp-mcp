# Security Policy

<a href="../README.md#-documentation-index">← Back to Index</a>

## Reporting

Please do **not** report security vulnerabilities as public issues. Use GitHub Security Advisory (or contact details in the repo). We will respond as quickly as possible.

## Notes

- Credentials are passed via environment variables (not stored in files). Recommendation: use app passwords.
- All connections use TLS (implicit or STARTTLS). `verify_tls=false` is intended for trusted internal servers only.
- Credentials are never logged (sanitizer enforced).
