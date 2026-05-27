# Contributing

Thank you for your interest. Please read `AGENTS.md` first — it covers architecture, conventions, and the PR checklist. They apply to humans and AI agents alike.

## Workflow

1. Open an issue — briefly describe what and why.
2. Branch from `main`: `feat/...`, `fix/...`, `docs/...`.
3. `pnpm install`, then develop. Pre-commit hooks (lefthook) run automatically.
4. `pnpm typecheck && pnpm lint && pnpm test` must be green.
5. PR against `main` with a completed checklist.

## Scope

This project is intentionally narrow: **classic IMAP/SMTP only**. No OAuth, no calendar, no AI triage, no scheduler. Feature requests outside this scope will be politely declined.
