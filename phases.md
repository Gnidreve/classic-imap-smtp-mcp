# Entwicklungs-Phasen

Dieses Dokument verfolgt den Fortschritt des Projekts. Es ist **nicht** der Einstiegspunkt — der ist `README.md` (für Menschen) bzw. `AGENTS.md` (für KI-Agenten).

## Status

| Phase | Status | Dokument |
|-------|--------|----------|
| 0 — Marktanalyse | ✅ erledigt | [`phase-0-marktanalyse.md`](phase-0-marktanalyse.md) |
| 1 — Fragerunde + Definition aller Folgephasen | ✅ erledigt | [`phase-1-fragerunde.md`](phase-1-fragerunde.md) |
| 2 — Projektstruktur | ✅ Skelett angelegt | [`phase-2-projektstruktur.md`](phase-2-projektstruktur.md) |
| 3 — Tool-Implementierung | ✅ implementiert (53 Dateien, 36 Tools, Connections, Libs) | `phase-3-implementierung.md` (entsteht bei Bedarf) |
| Lizenz (hartes Gate) | ✅ **MIT** — `LICENSE`-File erstellt, README/package.json/phases aktualisiert | [`LICENSE`](LICENSE) |
| 4 — Validierung | ⬜ offen (Sensai testet lokal) | `phase-4-validierung.md` (entsteht nach Phase 3) |
| 5 — Distribution & Reichweite | ⬜ bereit (License gate ✅ MIT) | `phase-5-distribution.md` (entsteht nach Phase 4) |

## Phasen-Logik

- **Phase 0** beweist, dass das Projekt eine echte Lücke füllt.
- **Phase 1** ist die intensive Fragerunde. Nach Phase 1 ist *alles* entschieden — Phase 2+ läuft als reine Abarbeitung.
- **Phase 2–4** sind technische Phasen. Sie werden erst am Ende von Phase 1 in Detail-Markdowns ausgeschrieben.
- **Phase 5** ist Distribution & Reichweite. User folgt hier Claude's Direktive (Reddit, HN, MCP-Registries, Posting-Texte, Demo-Video).

## Projekt-Leitplanken (verbindlich)

Diese Punkte sind **nicht mehr verhandelbar** und gelten als Vertrag mit allen folgenden Phasen. Sie sind die kompakte Entscheidungs-Referenz; Details und Begründungen stehen in `phase-1-fragerunde.md`.

**Identität & Distribution**
- Package-Name: **`classic-imap-smtp-mcp`**, Env-Var-Präfix: **`CLASSIC_IMAP_SMTP_*`**
- Transport: **stdio only** (kein HTTP/SSE)
- Distribution: **npx-only in v1** (Docker v2.x)
- Runtime: **Node ≥ 20**, **TypeScript**
- Lizenz: **MIT** (entschieden, hard gate cleared ✅)

**Stack**
- IMAP: `imapflow` · SMTP: `nodemailer` · MIME: `mailparser`
- MCP: `@modelcontextprotocol/sdk` · Validierung: `zod` · Build: `tsup` · Logger: `pino`
- Dev: `pnpm` · Tests: `vitest` + Docker (Dovecot + Mailpit)

**Scope & Auth**
- Scope: **alles, was ein guter Mailclient kann** — nichts darüber hinaus (kein Calendar, keine AI-Triage, kein Scheduler, keine Notifications)
- Auth: **klassisch, permanent** — User/Pass + App-Passwords + STARTTLS/SSL. **Kein OAuth2, nie.** OAuth ist keine IMAP/SMTP-Protokollfunktion, sondern eine Auth-Schicht darüber. Wer OAuth braucht, kombiniert mit einem dedizierten MCP.

**Tools & Toggles**
- Tool-Zahl v1: **36** in 6 Kategorien (12 IMAP-Read, 8 IMAP-Write, 5 IMAP-Folder, 5 SMTP, 4 Account, 2 Meta) — Liste in `tools-checklist.md`, Inputs in `README.md`, Outputs in `output-shapes.md`
- Feature-Flags: **CLI-Args only** (keine Env-Vars). Vier grobe Flags (`--safe`, `--readonly`, `--no-imap`, `--no-smtp`) + zwei Feingranular (`--allow-tools`, `--deny-tools` mit Präfix-Wildcards). 3-Stufen-Kaskade: Flags → Allow → Deny, Deny gewinnt, Allow überschreibt Flags. Kein Profile-Konzept. `--no-imap`+`--no-smtp` = Fail-fast.
- Tool-Registrierung konditional zur Start-Zeit; Client sieht nur registrierte Tools
- IDLE: **nicht in v1** (Roadmap v2.0)

**Config & Connections**
- Single-Account via Env-Vars (`CLASSIC_IMAP_SMTP_*`), Multi-Account via TOML (XDG-Pfad)
- Credentials Klartext mit 0600-Permission-Check; keine Pseudo-Verschlüsselung
- Provider-Auto-Detect für 10 Provider
- IMAP: persistente Connection/Account, Exp-Backoff Reconnect (1→60s, max 5), 5min Idle-Timeout
- SMTP: Nodemailer-Pool, max 1 Connection, 100 Msg/Connection
- Rate-Limit: SMTP 10/min, IMAP 100 ops/s

**Fehler & Logging**
- Strukturierte Errors `{ code, message, details?, imap_response? }` — Klasse→Code-Mapping in `AGENTS.md`
- Logging via `pino` auf **stderr** (stdout = MCP-Protokoll), Default JSON, `--log-format=pretty` für Dev, Default-Level `info`
- Credential-Sanitizer immer aktiv (`pass`, `password`, `token`, `secret`, `apikey`)

**Zielgruppe v1:** Endnutzer mit MCP-Client-Config (Claude Desktop, Cursor, Windsurf, VS Code, Claude Code)

## ⚠️ Hartes Gate vor Phase 5

**Ohne gewählte Lizenz ist der Code rechtlich "all rights reserved".** Das betrifft nicht nur npm-Publish, sondern auch die öffentliche GitHub-Veröffentlichung und jeden Reddit/HN-Post in Phase 5 — niemand dürfte den Code legal nutzen, forken oder beitragen.

✅ **Gate passiert.** Lizenz ist **MIT** (siehe [`LICENSE`](LICENSE)). Phase 5 kann starten.
