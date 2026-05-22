# Phase 1 — Fragerunde + Definition aller Folgephasen

**Status:** ✅ ABGESCHLOSSEN (nach 2 Ping-Pong-Runden)
**Verbindlichkeit:** Alle Entscheidungen unten sind ab jetzt Vertrag mit Phasen 2–5. Phase-2-Markdown entsteht in der nächsten Session.

---

## Cluster A — Runtime & Toolchain ✅

| ID | Entscheidung |
|---|---|
| A1 | **npx-first und npx-only** in v1. Docker als Wrapper später. systemd auf dem Radar für Phase 6+. |
| A2 | **Node ≥ 20 (LTS)** |
| A3 | **`imapflow`** als IMAP-Library |
| A4 | **`nodemailer`** als SMTP-Library |
| A5 | **`mailparser`** für MIME-Parsing |
| A6 | **`@modelcontextprotocol/sdk`** — offizielles SDK |
| A7 | **`tsup`** für Build (esbuild-basiert) |
| A8 | **`zod`** für Tool-Input-Schemas |
| A9 | **`pnpm` für Dev**, npm-kompatible Distribution |

---

## Cluster A+ — Auth-Scope ✅ (Entscheidung Runde 3)

| ID | Entscheidung |
|---|---|
| AUTH | **Klassische Authentifizierung, permanent.** User/Pass + App-Passwords + STARTTLS/SSL. **Kein OAuth2/XOAUTH2 — nicht in v1, nicht in v2, nie.** |

**Begründung:**
- Der Package-Name `classic-imap-smtp-mcp` macht den Vertrag eindeutig: klassische Protokoll-Schicht.
- OAuth ist keine IMAP/SMTP-Protokollfunktion, sondern eine Auth-Schicht darüber. Sie gehört konzeptionell nicht in dieses Projekt.
- Implementierungs-Overhead von OAuth: ~30–40 % mehr Bau, ~50 % mehr laufende Wartung (Google/Microsoft ändern Endpoints/Scopes/Policies regelmäßig). Pro Provider eigene Quirks, Token-Refresh-Lifecycle, Consent-Flow.
- Zielgruppe (EU-Provider, Selfhoster, App-Password-Nutzer bei Gmail/Outlook/Yahoo) ist mit Klassik **vollständig** bedient. Klassisches IMAP/SMTP mit App-Passwords bleibt bei diesen Providern auf absehbare Zeit verfügbar; bei EU-Providern und Selfhostern auf unbestimmte Zeit.
- Fokus schärft das Marketing: "wir machen genau das eine Ding perfekt" statt "wir machen alles halb" (vgl. codefuturist: 47 Tools, 1 Stern).
- Falls OAuth je relevant würde: separates Schwesterprojekt `oauth-mail-mcp`, nicht hier reinquetschen.

**Konsequenz:** OAuth wurde aus README, AGENTS, llms.txt, phases.md und der Roadmap vollständig entfernt. In AGENTS.md "Was du niemals tun darfst" als Punkt 4 hartkodiert.

---

## Cluster B — Projekt-Identität ✅

| ID | Entscheidung |
|---|---|
| B1 | **Package-Name: `classic-imap-smtp-mcp`** |
| B2 | **Lizenz: TBD** — wird vor v1.0-Release festgelegt. Tendenz MIT. Für die Entwicklungsphase steht im Repo `LICENSE: TBD`, npm-Publishes erfolgen erst nach Lizenz-Entscheidung. |
| B3 | **GitHub** als Host. |
| B4 | **Strict SemVer.** `0.x.y` Entwicklung, `1.0.0` bei stabiler API. |

---

## Cluster C — Konfiguration & Multi-Account ✅

| ID | Entscheidung |
|---|---|
| C1 | **Single-Account via Env-Vars** mit Präfix `CLASSIC_IMAP_SMTP_*` (Akronym aus Package-Namen, knapp, kollisionsarm). |
| C1+ | **Account-Management** als eigene Kategorie (Runde 4): `account_list`, `account_add`, `account_update`, `account_delete`. Server-Introspektion als separate Meta-Kategorie: `meta_health`, `meta_server_info`. |
| C2 | **Multi-Account via TOML-Config-File**, XDG-konform: `~/.config/classic-imap-smtp-mcp/config.toml` (Linux/macOS), `%APPDATA%\classic-imap-smtp-mcp\config.toml` (Windows). |
| C3 | **Default-Account-Marker im Config + optionaler `account`-Parameter pro Tool.** Im Single-User-Setup nicht nötig. |
| C4 | **Klartext-Credentials im Config-File** in v1. Datei-Permission-Check 0600, der Server warnt bei zu offenen Permissions. |
| C5 | **Kein interaktiver Setup-Wizard.** README + `init`-Subcommand für Template-Config reicht. Account-Management läuft über die Tools aus C1+. |
| C6 | **Provider-Auto-Detection** für 10 Provider: Gmail, Outlook, iCloud, Fastmail, Posteo, mailbox.org, GMX, web.de, Yahoo, ProtonMail-Bridge. |

---

## Cluster D — Feature-Toggles-Mechanik ✅

| ID | Entscheidung |
|---|---|
| D1 | **Vereinfacht in Runde 4.** Vier Feature-Flags (grob): `--safe`, `--readonly`, `--no-imap`, `--no-smtp`. Plus zwei Feingranular-Flags (Expertenmodus): `--allow-tools`, `--deny-tools` mit Präfix-Wildcards. **Keine** `--no-delete`/`--no-folder-mgmt`/`--no-bulk` mehr — die deckt man bei Bedarf per `--deny-tools=imap_delete_*` etc. ab. |
| D2 | **Nur CLI-Args** für alle Flags. Keine Env-Vars. |
| D3 | **Opt-out-Default**: alles aktiv (alle 36 Tools), wenn nichts gesetzt. |
| D4 | **Profile-Konzept abgeschafft** (Runde 4). Statt `--profile=safe/readonly` gibt es die Flags `--safe` und `--readonly` direkt. Kein `--profile=`, kein `full`/`imap-only`/`smtp-only`. |
| D5 | **Konditionale Tool-Registrierung zur Server-Start-Zeit.** Client sieht nur registrierte Tools. |
| D6 | **3-Stufen-Kaskade (Runde 4), grob → fein, fein gewinnt:** (1) Feature-Flags bilden die Basis-Menge → (2) `--allow-tools` überschreibt sie und kann Tools zurückholen (b-Logik) → (3) `--deny-tools` gewinnt über alles. |
| D7 | **Fail-fast (Runde 4):** `--no-imap` + `--no-smtp` gleichzeitig → leerer Server → Abbruch beim Start mit stderr-Meldung + Exit ≠ 0. Grund: stderr erreicht die LLM nicht zuverlässig; der Mensch sieht "server failed to start" sofort. |

**Feature-Flag-Definitionen (verbindlich):**

| Flag | Wirkung |
|---|---|
| (kein Flag) | Alle 36 Tools |
| `--safe` | Alle außer `imap_delete_message`, `imap_expunge`, `imap_delete_mailbox` |
| `--readonly` | Nur lesende Tools: IMAP-Read (12) + `smtp_verify_connection` + `account_list` + `meta_health` + `meta_server_info`. Kein STORE/MOVE/COPY/APPEND/Folder-CRUD, kein SMTP-Send, keine Account-Mutation. |
| `--no-imap` | Alle `imap_*` weg |
| `--no-smtp` | Alle `smtp_*` weg |

`--safe` + `--readonly` kombinierbar (readonly strenger, gewinnt). Wildcards in Allow/Deny: `imap_*`, `smtp_*`, `account_*`, `meta_*`, `imap_delete_*`, `imap_bulk_*`, `imap_get_*`.

---

## Cluster E — Tool-Scope ✅ (Namen final in Runde 4)

**Gesamt: 36 Tools, 6 Kategorien.**

### IMAP — Lesen (12)
`imap_list_mailboxes`, `imap_status_mailbox`, `imap_list_messages`, `imap_get_message`, `imap_get_message_headers`, `imap_get_message_raw`, `imap_get_messages_bulk`, `imap_search`, `imap_download_attachment`, `imap_get_thread`, `imap_get_quota`, `imap_check_capabilities`

### IMAP — Schreiben (8)
`imap_mark_message`, `imap_bulk_mark`, `imap_move_message`, `imap_copy_message`, `imap_bulk_move`, `imap_append_message`, `imap_expunge`, `imap_delete_message`

### IMAP — Folder-CRUD (5)
`imap_create_mailbox`, `imap_delete_mailbox`, `imap_rename_mailbox`, `imap_subscribe_mailbox`, `imap_unsubscribe_mailbox`

### SMTP (5)
`smtp_send`, `smtp_reply`, `smtp_forward`, `smtp_verify_connection`, `smtp_send_raw`

**Sent-Ablage (Runde 5):** Sende-Tools (`smtp_send`/`reply`/`forward`/`send_raw`) legen nach erfolgreichem Versand automatisch eine Kopie im Sent-Folder ab — Parameter `save_to_sent` (Default `true`), Folder via `\Sent`-Special-Use mit Fallback, überschreibbar per `sent_mailbox`. Versand und Ablage getrennt: scheitert die Ablage nach erfolgreichem Send, kein Tool-Fehler (`savedToSent: false` + `sentSaveError`). **Kein Outbox/Queue/Retry** — fehlgeschlagener Versand wird synchron als `SMTP_RELAY_ERROR` gemeldet (passt zum stateless-Modell, vermeidet codefuturist-artigen Scope-Creep).

### Account-Management (4)
`account_list`, `account_add`, `account_update`, `account_delete`

### Meta — Server-Introspektion (2)
`meta_health`, `meta_server_info`

**Wildcard-Domänen:** `imap_*`, `smtp_*`, `account_*`, `meta_*` — jede Domäne sauber per Präfix erschlagbar. `--deny-tools=account_*` schaltet z.B. das komplette Account-Management weg, `meta_*` bleibt erreichbar.

**Anmerkung:** IDLE-Tool (`imap_idle_wait`) ist bewusst **nicht** in v1. Roadmap v2.0.

---

## Cluster F — Fehlerbehandlung & Logging ✅

| ID | Entscheidung |
|---|---|
| F1 | **Strukturierte Errors:** `{ code, message, details?, imap_response? }`. Die vollständige Error-Klasse→Code-Mapping-Tabelle steht in `AGENTS.md` (Single Source of Truth). Codes u.a.: `AUTH_FAILED`, `MAILBOX_NOT_FOUND`, `UID_NOT_FOUND`, `RATE_LIMITED`, `TLS_ERROR`, `CONFIG_ERROR`, `IMAP_PROTOCOL_ERROR`, `SMTP_RELAY_ERROR`, `ACCOUNT_NOT_FOUND`, `ATTACHMENT_NOT_FOUND`, `PERMISSION_DENIED`. |
| F2 | **Logging:** `pino`-Library. Default JSON auf stderr, `--log-format=pretty` für Dev. Default-Level `info`, via `--log-level=` oder `CLASSIC_IMAP_SMTP_LOG_LEVEL=`. Hartkodierter Sanitizer für `pass`, `password`, `token`, `secret`, `apikey`, `apiKey` → `***`. |
| F3 | **Connection-Resilience:** Persistente IMAP-Connection pro Account, Reconnect mit Exp-Backoff (1s → 60s, max 5 Versuche, danach Tool-Error). IMAP-Idle-Timeout 5 Minuten — danach Connection schließen, beim nächsten Tool-Call neu öffnen. Nodemailer SMTP-Pool aktiv, max 1 Connection, max 100 Messages/Connection. |
| F4 | **Rate-Limiting:** Token-Bucket pro Account. Defaults: SMTP 10/min, IMAP-Hard-Cap 100 ops/sec. Konfigurierbar via Config-File. |

---

## Cluster G — Test-Strategie ✅

| ID | Entscheidung |
|---|---|
| G1 | **Vitest** für Unit-Tests. Mocks für IMAP/SMTP-Connections. Coverage-Ziel ≥ 85 % `tools/`, ≥ 70 % gesamt. |
| G2 | **Integration-Tests via Docker-Compose** mit Dovecot (IMAP) + Mailpit (SMTP). Läuft nightly + auf `main`. Bei normalen PRs nur Unit-Tests, um CI-Zeit niedrig zu halten. |
| G3 | **Manuelle Provider-Smoke-Tests** in Phase 4 gegen: Gmail, Outlook, iCloud, mailbox.org, Posteo, GMX, web.de, ProtonMail-Bridge, eigener Server. Ergebnisse in `docs/provider-matrix.md`. |

---

## Cluster H — Phase 2 (Projektstruktur) — Skelett

**Detail-Markdown `phase-2-projektstruktur.md` entsteht in der nächsten Session als erste Handlung.** Vertraglich verbindlich:

- Repo-Init: git, `.gitignore` (Node-Standard + `dist/`, `.env`, `coverage/`), `.editorconfig`
- `package.json` mit allen Deps aus Cluster A, `bin.classic-imap-smtp-mcp` → `dist/bin/main.js`
- `tsconfig.json` strict (`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`)
- `src/`-Layout exakt wie in `AGENTS.md` definiert
- CI (GitHub Actions): typecheck, lint, unit-test bei jedem PR; integration-test + build nightly und auf `main`
- README, AGENTS, llms.txt, phases.md, phase-*.md, CONTRIBUTING.md, SECURITY.md, CHANGELOG.md, LICENSE (TBD-Marker)
- Issue-/PR-Templates
- Pre-commit-Hooks: `lefthook` (lint + typecheck on staged)

---

## Cluster I — Phase 3 (Implementierung) — Skelett

**Detail-Markdown `phase-3-implementierung.md` entsteht nach Phase 2.** Reihenfolge:

1. Connection-Layer (`connections/imap-pool.ts`, `connections/smtp-pool.ts`)
2. Config-Layer (`config/schema.ts`, `config/loader.ts`, `config/xdg.ts`, `config/providers.ts`)
3. Error-Layer (`lib/errors.ts`)
4. Logging-Layer (`server/logging.ts`)
5. Tool-Definition-Interface (`tools/_types.ts`)
6. Registry-Layer (`server/registry.ts`) — 3-Stufen-Kaskade (Feature-Flags → Allow → Deny)
7. Server-Bootstrap (`server/server.ts`)
8. CLI-Entry (`bin/main.ts`)
9. IMAP-Read-Tools (12)
10. IMAP-Write-Tools (8)
11. IMAP-Folder-CRUD-Tools (5)
12. SMTP-Tools (5)
13. Meta-Tools (6)
14. Search-Builder (`lib/search-builder.ts`)
15. Threading-Walk (`lib/threading.ts`)
16. MIME-Helpers (`lib/mime.ts`)

Pro Tool: Zod-Schema → Implementation → Unit-Test → Integration-Test (wo zutreffend) → README/llms.txt-Konsistenz-Check.

---

## Cluster J — Phase 4 (Validierung) — Skelett

**Detail-Markdown `phase-4-validierung.md` entsteht nach Phase 3.** Stationen:

1. MCP-Inspector-Run gegen `npx classic-imap-smtp-mcp` — alle 36 Tools werden korrekt enumeriert
2. Claude Desktop Integration-Test manuell — Default + alle Feature-Flags (`--safe`, `--readonly`, `--no-imap`, `--no-smtp`) + Allow/Deny-Kaskade + Fail-fast bei `--no-imap --no-smtp`
3. Claude Code Integration-Test manuell
4. Cursor + Windsurf + VS Code Smoke-Test
5. Provider-Matrix (siehe G3): 9 Provider × Kernoperationen-Set
6. Performance: Cold-Start, typischer Mailclient-Workflow (open → search → fetch → reply)
7. Security-Review:
   - TLS-Verify aktiv per Default — `CLASSIC_IMAP_SMTP_VERIFY_TLS=false` wird im Log markiert
   - Credentials in Logs (Sanitizer-Test)
   - Config-Permissions-Check funktioniert
   - Toggle-Bypass-Versuche (kann ein Client deny'te Tools doch aufrufen?)
8. README/AGENTS/llms.txt Konsistenz-Final-Check vor v1.0-Release

---

## Cluster K — Phase 5 (Distribution & Reichweite) — Skelett

**Detail-Markdown `phase-5-distribution.md` entsteht nach Phase 4 mit konkreten Posting-Texten und Demo-Video-Drehbuch.** Stationen:

### Pre-Launch
- npm publish mit korrektem `package.json` (`keywords`, `repository`, `bugs`, `homepage`, Lizenz)
- README finalisieren (Demo-GIF, alle Badges aktiv)
- Eintragen in MCP-Registries:
  - `mcp-get` (https://github.com/michaellatman/mcp-get)
  - `awesome-mcp-servers` (https://github.com/punkpeye/awesome-mcp-servers)
  - `mcp.so`
  - `mcpservers.org`
  - Anthropic offizielles Verzeichnis
  - Smithery (`smithery.ai`) — `server.json` mitliefern
  - Glama (`glama.ai/mcp`)
- Demo-Video (60s, Screencast mit Untertiteln, kein Voice-Over)

### Launch (Posting-Texte werden in Phase 5 konkret geschrieben)
- Reddit: r/ClaudeAI, r/LocalLLaMA, r/selfhosted, r/programming
- Hacker News (Show HN, Dienstag oder Mittwoch früh US-Zeit)
- Anthropic Discord (MCP-Channel)
- Twitter/X mit MCP-Hashtag
- LinkedIn (Backend-Crowd)
- Mastodon (Fediverse-Devs)
- Dev.to / Hashnode — technischer Blog-Post über Marktanalyse + Architektur

### Post-Launch
- Issues + PRs zügig bearbeiten
- GitHub Discussions für User-Support
- Roadmap-Issue öffnen (v2.0: IDLE-Streaming; v1.x: Keychain-Integration; v2.x: Docker-First)
- Status-Badges im README aktiv (CI, npm-version, downloads, license, star-history)

---

## Konsistenz-Stand der Dokumente

Alle deklarativen Dokumente (README, AGENTS, llms.txt, tools-checklist, output-shapes, phases, .env.example, config.example.toml) sind auf den finalen Phase-1-Stand inkl. Runde-4-Änderungen (Feature-Flags statt Profile, `account_*`/`meta_*`-Kategorien, 3-Stufen-Kaskade, Fail-fast) nachgezogen.

Offen bleibt nur die **Lizenz (B2)** — bewusst TBD, hartes Gate vor Phase 5 (siehe `phases.md`).

Damit ist Phase 1 abgeschlossen. Nächster Schritt: `phase-2-projektstruktur.md` erstellen.
