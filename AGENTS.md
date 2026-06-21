# AGENTS.md - classic-imap-smtp-mcp

## Mission
- Manage and maintain the classic-imap-smtp-mcp project.
- Work on changes that help the project move forward.
- Use Telegram as operator channel, not source of truth.

## Scope
- Stay inside this repository unless Sensai explicitly asks for outside work.
- If a task requires infrastructure changes, secret work, or host-level changes, ask first.

## Source Of Truth
- Local repo checkout is primary working state.
- GitHub is sync and backup target.
- Container is isolated runtime.

## Git Workflow
- Inspect current repo state before making changes.
- Preserve existing changes unless Sensai asks otherwise.
- Commit coherent project changes.
- Push only when explicitly requested.

## Setup-Übersicht für neue Agents

*Dieser Abschnitt wird automatisch aktualisiert, wenn sich die Architektur ändert. Lies ihn als erstes, wenn du das Repo zum ersten Mal siehst.*

### Kurzbeschreibung
`classic-imap-smtp-mcp` ist ein MCP-Server (Model Context Protocol), der klassisches IMAP/SMTP als MCP-Tools bereitstellt. 36 Tools in 6 Kategorien (imap-read, imap-write, imap-mailbox, smtp, account, meta). Node.js ≥ 20, TypeScript, pnpm.

### Projekt-Meilensteine (phases.md lesen!)
- **Phase 0–5 abgeschlossen** (v0.5.0 live): Marktanalyse → Tool-Implementierung → Docker/SSE → Security-Audits
- **Phase 6** (IMAP IDLE): noch offen/unsicher
- **Phase 7** (Puffer): noch offen
- **Phase 8** (Marketing): folgt nicht-öffentlicher Direktive
- **Phase 9** (Bug Catching): ~1 Jahr vor 1.0.0
- **Ziel:** 1.0.0 — keine Major Changes mehr, nur Critical Bugfixes

### Architektur
| Komponente | Technologie |
|---|---|
| MCP SDK | `@modelcontextprotocol/sdk` v1.x |
| IMAP | `imapflow` (persistente Pool-Verbindung, Exp-Backoff Reconnect) |
| SMTP | `nodemailer` (Pool: max 1 Conn, 100 Msg/Conn, Token-Bucket Rate-Limit) |
| MIME | `mailparser` |
| Validation | `zod` |
| Logging | `pino` (stderr, JSON default, `--log-format=pretty` für Dev) |
| Build | `tsup` (TypeScript → dist/main.js) |
| Tests | `vitest` (Unit + Integration via Dovecot/Mailpit Docker) |
| Lint | `biome` |
| Pre-commit | `lefthook` (biome check + typecheck via pnpm) |

### Betriebsmodi
- **stdio** (default): lokaler MCP-Server, stdout = MCP-Protokoll, stderr = Logs
- **http** (`--transport=http`): Streamable HTTP + Legacy SSE, Port 3000, bind 127.0.0.1

### HTTP-Endpoints (im http-Modus)
| Endpoint | Zweck |
|---|---|
| `GET /healthz` | Healthcheck für Orchestratoren/Docker HEALTHCHECK |
| `POST /mcp` | Streamable HTTP MCP (primär) |
| `GET /sse` | Legacy SSE MCP (fallback) |
| `POST /messages?sessionId=...` | Legacy SSE Messages |

### Feature-Flags
`--safe`, `--readonly`, `--no-imap`, `--no-smtp` + `--allow-tools=<csv>` / `--deny-tools=<csv>` mit Präfix-Wildcards.
3-Stufen-Kaskade: Flags → Allow → Deny (Deny gewinnt).

### Auth
Klassisch: User/Pass + App-Passwords + STARTTLS/SSL. **Kein OAuth2.**
Single-Account via `CLASSIC_*`/`CLASSIC_IMAP_SMTP_*` Env-Vars, Multi-Account via TOML (XDG-Pfad, 0600 empfohlen).
Provider-Auto-Detect für 10 Provider.

### Config
- `limits.smtp_per_minute` (default: 10) wird vom SmtpPool als Token-Bucket verwendet
- `limits.imap_ops_per_second` (default: 100) aktuell deklariert, aber noch nicht im ImapPool implementiert
- Idle-Verbindungen werden alle 60s per `pruneIdle()`-Timer geschlossen

### CI/CD (GitHub Actions)
| Workflow | Trigger | Was |
|---|---|---|
| `ci.yml` | Push/PR auf main | typecheck + lint + audit (non-blocking) + test + build + Gitleaks Secret-Scan + Dependency-Review (PR) |
| `nightly.yml` | cron 3:00 UTC + push main | Integration-Tests (Dovecot/Mailpit Docker) |
| `codeql.yml` | Push/PR + wöchentlich | CodeQL JavaScript/TypeScript Analysis |
| `docker.yml` | Tags v* + main + dispatch | Build & Push to Docker Hub (vaatu/classic-imap-smtp-mcp) |
| `publish.yml` | Tags v* | npm publish (@gnidreve/classic-imap-smtp-mcp) |
| `mirror-to-codeberg.yml` | push main | Mirror to Codeberg via SSH Deploy Key (ssh-agent) |

### Docker
- Base: `node:20.20.2-alpine` + `tini` (PID 1) + `curl` (für HEALTHCHECK)
- HEALTHCHECK: 30s Intervall, `curl -sf http://localhost:3000/healthz`
- User: `mcp` (non-root)
- HTTP-Modus default: Port 3000

### Bekannte Schwachstellen / TODOs
- `limits.imap_ops_per_second` aus der Config wird aktuell nicht ausgewertet (nur deklariert)
- Kein OAuth2 (Design-Entscheidung, siehe phases.md)
- SMTP-Timeout hartcodiert auf 30s (konfigurierbar via `MCP_PORT_TIMEOUT`-Env im HTTP-Server)

### Repository-Struktur
```
src/
  bin/main.ts           – CLI-Entrypoint, Server-Start, Shutdown, Subcommands (init/test/list-tools)
  config/               – Loader, Schema, Provider-Detect, XDG-Pfade
  connections/           – ImapPool (persistent, Reconnect), SmtpPool (Pool, Rate-Limit)
  lib/                   – MCP-Mail-Errors, MIME-Helper, Search-Builder, Sent-Folder, Threading
  server/               – MCP-Server-Builder, HTTP-Runtime, Options-Parser, Registry (Flags), Logger
  tools/                 – 36 Tool-Definitionen in 6 Unterordnern (imap-read, imap-write, imap-mailbox, smtp, account, meta)
test/
  integration/          – Integration-Tests (Docker-Compose)
  mocks/                – Test-Mocks
docs/                   – Dokumentation (Install, Config, Roadmap, Tools, Output-Shapes etc.)
.github/workflows/     – CI/CD
```

### Agent-Gedächtnis
- `phases.md` ist kanonischer Fortschritt — immer zuerst lesen vor Vorschlägen zur nächsten Phase
- `MEMORY.md` enthält dauerhafte Einstellungen (Sensai = Linuz, Operator-Channel = Telegram)
- `HEARTBEAT.md` = aktueller Modus (default: abrufbereit, keine Aktion ohne Anweisung)
- `SOUL.md` = Persönlichkeit (hilfreich, direkt, kompetent, privat)
- `TOOLS.md` = verfügbare Tools (git, SSH-Key, GitHub-Token)

### Fehler, die neue Agents nicht wiederholen sollten
- ❌ **Version-Drift** zwischen `SERVER_VERSION` in `server.ts` und `package.json` — immer synchron halten!
- ❌ **`pruneIdle()` definieren aber nie aufrufen** — entweder Timer setzen oder Methode entfernen
- ❌ **Config-Limits ignorieren** — `limits.smtp_per_minute` muss im SmtpPool ankommen (aktuell korrekt durchgereicht)
- ❌ **`pnpm audit || true` ohne Warning** — immer mit `echo "::warning::..."` kombinieren
- ❌ **Secret auf Disk schreiben** (alter Mirror-Workflow) — immer `ssh-agent` + stdin/ env nutzen
- ❌ **`lefthook` mit `npm run`** — Repo nutzt pnpm, also `pnpm run`
- ❌ **Healthcheck vergessen** — Docker-Image braucht HEALTHCHECK, HTTP-Server braucht `/healthz`

### Letzte Änderungen (Changelog für Agents)
**2026-06-21** — Phase-5-Post-Review: Healthcheck, Version-Fix, CI-Verbesserungen, Config-Limits-Durchreichung
- `src/server/http.ts`: GET /healthz-Endpoint, Security-Header (X-Content-Type-Options etc.), httpTimeoutMs
- `src/server/server.ts`: SERVER_VERSION 0.3.0 → 0.4.0 (Sync mit package.json)
- `src/server/options.ts`: healthEndpoint + httpTimeoutMs Optionen, CLI-Parsing
- `src/bin/main.ts`: pruneIdle-Timer (60s), erweiterte HELP
- `src/config/loader.ts`: ConfigStore.limits aus Config
- `src/connections/smtp-pool.ts`: Rate-Limit aus ConfigStore, nicht hartcodiert
- `Dockerfile`: tini (PID 1), curl, HEALTHCHECK
- `lefthook.yml`: npm run → pnpm run typecheck
- `.github/workflows/ci.yml`: audit mit Warning statt `|| true`, Gitleaks, Dependency-Review
- `.github/workflows/nightly.yml`: audit mit Warning
- `.github/workflows/mirror-to-codeberg.yml`: Secret via ssh-agent statt Datei
- `AGENTS.md`: Setup-Übersicht, Changelog
