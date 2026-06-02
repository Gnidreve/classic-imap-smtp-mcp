# Roadmap

<a href="../README.md#-documentation-index">← Back to Index</a> · <a href="comparison.md">← Previous: Comparison</a>

This document outlines the planned development path for `@gnidreve/classic-imap-smtp-mcp` from its current state toward a stable 1.0.0 release.

> **Current version:** [v0.3.2](https://www.npmjs.com/package/@gnidreve/classic-imap-smtp-mcp) — all 36 core tools implemented, live on npm, CI/CD running.

## Vision

A classic IMAP/SMTP MCP server that does everything a good mail client does — no OAuth, no cloud lock-in, no scope creep. From `npx` to production.

## Phases

| Phase | Approx. Version | Description |
|-------|----------------|-------------|
| 0 – Market Analysis | — | ✅ Done — validated the gap |
| 1 – Requirements | — | ✅ Done — scoped all phases |
| 2 – Project Structure | — | ✅ Done — scaffolded |
| 3 – Core Implementation | **0.3.x** | ✅ Done — 36 tools, connections, auth, CI/CD, npm-published |
| **4 – Docker Packaging** | **0.4.x** | Container wrapper with SSE transport as an alternative to stdio |
| **5 – Security Audits** | **0.5.x** | Automated security scanning, published publicly in the repository |
| **6 – IMAP IDLE Evaluation** | **0.6.x** | Research phase: event-driven IMAP IDLE and its role in an MCP context |
| **7 – Polish & Feedback** | **0.7.x** | Community input, CLI ergonomics, documentation improvements |
| **8 – Launch & Distribution** | **0.8.x** | Public launch, ecosystem visibility |
| **9 – Stability** | **0.9.x** | Extended bug-catching phase (~1 year stabilization before 1.0) |
| **1.0.0** | **1.0.0** | Completed — no major changes, critical bugfixes only |
| **2.0.0** | **2.0.0** | Future: adapt to the next MCP protocol standard when it ships |

## Scope

This project stays focused on IMAP and SMTP — period. No calendar, no AI triage, no scheduling, no notifications. If you need those, compose with dedicated tools.

Authentication is classic username/password with STARTTLS/SSL. No OAuth2. Ever.

## Get Involved

- [Installation](install.md)
- [Configuration](config.md)
- [All Tools](tools.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

---

<a href="../README.md#-documentation-index">← Back to Index</a>
