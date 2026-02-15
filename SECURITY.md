# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅ Active |
| 1.x     | ⚠️ Security fixes only |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Use [GitHub Security Advisories](https://github.com/huynhtrungcip/ageis-gnfw/security/advisories/new) to privately report
3. Or email: **huynhtrungcip@gmail.com**
4. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within **48 hours** and provide a detailed response within **7 days**.

## Repository

- **GitHub**: [https://github.com/huynhtrungcip/ageis-gnfw](https://github.com/huynhtrungcip/ageis-gnfw)
- **Issues**: [https://github.com/huynhtrungcip/ageis-gnfw/issues](https://github.com/huynhtrungcip/ageis-gnfw/issues)

## Security Measures

### Application Security

- **Authentication**: Email/password with bcrypt hashing
- **Authorization**: Role-based access control (Super Admin, Admin, Operator, Auditor)
- **Session Management**: JWT tokens with configurable expiration
- **Input Validation**: Server-side validation on all API endpoints
- **Audit Logging**: All configuration changes are logged with user, timestamp, and details

### Infrastructure Security

- **TLS**: Let's Encrypt with auto-renewal, TLS 1.2/1.3 only
- **HSTS**: Strict-Transport-Security with 2-year max-age, preload
- **CSP**: Content-Security-Policy restricting script sources
- **Rate Limiting**: API (30 req/s), Login (5 req/min)
- **Database**: scram-sha-256 authentication, statement timeouts, connection limits
- **Containers**: `no-new-privileges`, resource limits, internal-only network
- **Secrets**: Auto-generated with cryptographic randomness (openssl)

### Network Security

- Internal Docker network (no external DB access)
- Nginx reverse proxy (no direct PostgREST exposure)
- Configurable firewall rules via iptables/nftables
- IDS/IPS integration (Suricata)

## Best Practices for Deployment

1. **Change default credentials** immediately after first login
2. **Use strong passwords** — the deploy script generates them automatically
3. **Keep the system updated** — `apt update && apt upgrade`
4. **Enable automatic backups** — enabled by default in production
5. **Restrict SSH access** — use key-based authentication
6. **Monitor logs** — `docker compose logs -f` and `journalctl -u aegis-agent -f`
7. **Use a dedicated server** — avoid shared hosting for firewall management
