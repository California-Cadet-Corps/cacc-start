# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities **privately** — do not open a public issue.

- Use GitHub's **[Report a vulnerability](https://github.com/California-Cadet-Corps/cacc-start/security/advisories/new)**
  (Security → Advisories), or
- Email the maintainers at the address listed on the California Cadet Corps site.

Include steps to reproduce, affected versions, and any relevant logs. We aim to
acknowledge reports within a few business days and will keep you updated on the fix.

## Supported versions

This project deploys continuously from `main`; the latest `main` is the only
supported version.

## Secrets

Production credentials live exclusively in **GitHub Actions Secrets** and the
server's `shared/.env` — never in the repository. If you believe a secret has
been exposed, rotate it immediately (see [docs/SECRETS.md](./docs/SECRETS.md)).
