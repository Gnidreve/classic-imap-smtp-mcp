# Contributing

Danke fuer dein Interesse. Bitte lies zuerst `AGENTS.md` — dort stehen Architektur, Konventionen und die PR-Checkliste. Sie gelten fuer Menschen und KI-Agenten gleichermassen.

## Workflow
1. Issue auf — kurz beschreiben, was/warum.
2. Branch von `main`: `feat/...`, `fix/...`, `docs/...`.
3. `pnpm install`, dann entwickeln. Pre-commit-Hooks (lefthook) laufen automatisch.
4. `pnpm typecheck && pnpm lint && pnpm test` muessen gruen sein.
5. PR gegen `main` mit ausgefuellter Checkliste.

## Scope
Dieses Projekt ist bewusst eng: **nur klassisches IMAP/SMTP**. Kein OAuth, kein Calendar, keine AI-Triage, kein Scheduler. Feature-Requests ausserhalb dieses Scopes werden freundlich abgelehnt. Begruendung in `phase-0-marktanalyse.md`.
