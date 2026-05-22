# classic-imap-smtp-mcp

> Ein vollständiger IMAP/SMTP-MCP-Server für AI-Assistenten. Alles, was ein guter Mailclient kann — und nichts darüber hinaus.

[![npm version](https://img.shields.io/npm/v/classic-imap-smtp-mcp.svg?style=flat-square)](https://www.npmjs.com/package/classic-imap-smtp-mcp)
[![npm downloads](https://img.shields.io/npm/dm/classic-imap-smtp-mcp.svg?style=flat-square)](https://www.npmjs.com/package/classic-imap-smtp-mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/<OWNER>/classic-imap-smtp-mcp/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/<OWNER>/classic-imap-smtp-mcp/actions)

---

## Was ist classic-imap-smtp-mcp?

classic-imap-smtp-mcp ist ein lokal laufender [MCP](https://modelcontextprotocol.io)-Server, der jeden IMAP/SMTP-Mail-Account an einen AI-Assistenten anbindet. Es macht *genau das*, was ein Mailclient macht — Mails lesen, suchen, senden, antworten, weiterleiten, verschieben, markieren, Folder verwalten — und nichts darüber hinaus.

**Was classic-imap-smtp-mcp nicht macht** (bewusst):
- Kein OAuth2 — dieser MCP implementiert klassisches IMAP/SMTP mit User/Pass-Authentifizierung (App-Passwords). Für OAuth-Provider wie Gmail-OAuth-only-Setups oder Microsoft 365 nutze einen dafür gebauten MCP daneben.
- Keine Kalender-Integration
- Keine AI-Triage oder Auto-Kategorisierung im Server
- Keine Webhooks, keine Desktop-Notifications
- Kein Scheduler für zukünftige Mails
- Kein eingebauter SMTP-Server, keine Mail-Speicherung

Wenn du sowas brauchst, kombiniere classic-imap-smtp-mcp mit anderen MCPs. Genau dafür wurde MCP gebaut.

## Warum classic-imap-smtp-mcp?

Vergleich der relevanten IMAP/SMTP-MCPs am Markt:

| | classic-imap-smtp-mcp | ai-zerolab | AIWerk | codefuturist | yunfeizhu |
|---|---|---|---|---|---|
| Volle Mailclient-Tools | ✅ | ❌ | ⚠️ | ✅ | ❌ |
| Folder-Listing | ✅ | ❌ | ✅ | ✅ | ❌ |
| Folder-CRUD | ✅ | ❌ | ❌ | ✅ | ❌ |
| Move zwischen Foldern | ✅ | ❌ | ✅ | ✅ | ❌ |
| Flag-Management | ✅ | ❌ | ✅ | ✅ | ❌ |
| Dediziertes Reply-Tool | ✅ | ❌ | ✅ | ✅ | ✅ |
| APPEND (Drafts speichern) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Multi-Account | ✅ | ✅ | ❌ | ✅ | ❌ |
| CLI-Feature-Toggles | ✅ | ❌ | ❌ | ❌ | ❌ |
| `npx`/`uvx` Distribution | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Permissive Lizenz | TBD | ✅ | ⚠️ | ❌ LGPL | ✅ |
| Scope nur Mail | ✅ | ✅ | ✅ | ❌ | ✅ |

## Installation

In deiner MCP-Client-Config:

**Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) bzw. `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "mail": {
      "command": "npx",
      "args": ["-y", "classic-imap-smtp-mcp"],
      "env": {
        "CLASSIC_IMAP_SMTP_IMAP_HOST": "imap.example.com",
        "CLASSIC_IMAP_SMTP_IMAP_PORT": "993",
        "CLASSIC_IMAP_SMTP_SMTP_HOST": "smtp.example.com",
        "CLASSIC_IMAP_SMTP_SMTP_PORT": "465",
        "CLASSIC_IMAP_SMTP_USER": "you@example.com",
        "CLASSIC_IMAP_SMTP_PASS": "your-app-password"
      }
    }
  }
}
```

**Claude Code:**
```bash
claude mcp add mail \
  -e CLASSIC_IMAP_SMTP_IMAP_HOST=imap.example.com \
  -e CLASSIC_IMAP_SMTP_SMTP_HOST=smtp.example.com \
  -e CLASSIC_IMAP_SMTP_USER=you@example.com \
  -e CLASSIC_IMAP_SMTP_PASS=your-app-password \
  -- npx -y classic-imap-smtp-mcp
```

**Cursor / Windsurf / VS Code**: analog. Snippets in [`docs/clients.md`](docs/clients.md).

Für Multi-Account-Setup siehe [Konfiguration](#konfiguration).

## Tools

classic-imap-smtp-mcp registriert je nach Modus und Toggles zwischen 16 (`--readonly`) und 36 (Default) Tools.

### IMAP — Lesen (12 Tools)

| Tool | Was es macht |
|---|---|
| `imap_list_mailboxes` | Folder enumerieren, mit Special-Use-Flags (RFC 6154) |
| `imap_status_mailbox` | Counts (unread, total, recent) ohne SELECT |
| `imap_list_messages` | Paginierte Liste in einem Folder (UID, Envelope, Flags, Size) |
| `imap_get_message` | Vollständige Mail inkl. geparsem Body + Attachment-Metadaten |
| `imap_get_message_headers` | Nur Header |
| `imap_get_message_raw` | RFC-822 raw source |
| `imap_get_messages_bulk` | Bis N UIDs in einem Call |
| `imap_search` | Vollständiger SEARCH-Builder (alle RFC-3501-Kriterien) |
| `imap_download_attachment` | Gezielt eine Attachment-Part extrahieren |
| `imap_get_thread` | Konversation via In-Reply-To/References rekonstruieren |
| `imap_get_quota` | RFC-2087 QUOTA |
| `imap_check_capabilities` | CAPABILITY-Liste des Servers |

### IMAP — Schreiben (8 Tools)

| Tool | Was es macht |
|---|---|
| `imap_mark_message` | STORE Flags setzen/entfernen (\Seen, \Flagged, \Answered, \Deleted, Keywords) |
| `imap_bulk_mark` | Bulk-STORE |
| `imap_move_message` | MOVE (RFC 6851), Fallback COPY+EXPUNGE |
| `imap_copy_message` | COPY |
| `imap_bulk_move` | Bulk-MOVE |
| `imap_append_message` | APPEND (Drafts speichern, Mails importieren) |
| `imap_expunge` | EXPUNGE |
| `imap_delete_message` | STORE \Deleted + optional EXPUNGE |

### IMAP — Folder-Management (5 Tools)

| Tool | Was es macht |
|---|---|
| `imap_create_mailbox` | Neuen Folder anlegen |
| `imap_delete_mailbox` | Folder löschen |
| `imap_rename_mailbox` | Folder umbenennen |
| `imap_subscribe_mailbox` | SUBSCRIBE |
| `imap_unsubscribe_mailbox` | UNSUBSCRIBE |

### SMTP (5 Tools)

| Tool | Was es macht |
|---|---|
| `smtp_send` | Senden mit allen Optionen (to/cc/bcc, text+html, attachments, inline-images, custom headers). Legt nach Versand automatisch eine Kopie im Sent-Folder ab (`save_to_sent`, Default an). |
| `smtp_reply` | Senden mit korrekter In-Reply-To/References-Kette (nimmt Original-UID + Folder). Sent-Ablage wie `smtp_send`. |
| `smtp_forward` | Senden mit Original quoted oder als Attachment. Sent-Ablage wie `smtp_send`. |
| `smtp_verify_connection` | Connection-Health-Check |
| `smtp_send_raw` | Vor-formatierte RFC-822 senden (Power-User). Sent-Ablage wie `smtp_send`. |

**Sent-Ablage:** SMTP verschickt eine Mail nur — es legt nichts in deinem "Gesendet"-Ordner ab. Mailclients lösen das, indem sie nach dem Versand selbst eine Kopie per IMAP in den Sent-Folder schreiben. Genau das machen die Sende-Tools automatisch (`save_to_sent`, Default `true`). Der Sent-Folder wird über das IMAP-Special-Use-Flag `\Sent` gefunden (Fallback auf gängige Namen, oder explizit via `sent_mailbox`). Wichtig: Versand und Ablage sind getrennt — gelingt der Versand, aber die Ablage scheitert (z. B. Sent-Folder fehlt), ist die Mail trotzdem raus; das Tool meldet Erfolg mit `saved_to_sent: false` plus Hinweis. Einen **Postausgang/Outbox mit Retry gibt es bewusst nicht** — ein fehlgeschlagener Versand wird sofort als Fehler gemeldet, nicht in eine Warteschlange geparkt (siehe stateless-Designprinzip).

### Account-Management (4 Tools)

| Tool | Was es macht |
|---|---|
| `account_list` | Konfigurierte Accounts auflisten (Credentials masked) |
| `account_add` | Neuen Account zur Config hinzufügen |
| `account_update` | Bestehenden Account modifizieren (z. B. neues App-Password) |
| `account_delete` | Account aus Config entfernen |

### Meta — Server-Introspektion (2 Tools)

| Tool | Was es macht |
|---|---|
| `meta_health` | IMAP + SMTP Erreichbarkeit, Latenz, Capabilities |
| `meta_server_info` | Aktive Tools, aktiver Modus, Version |

**Gesamt: 36 Tools.** Für jeden bietet `classic-imap-smtp-mcp --help` und die JSON-Schemas im MCP-Inspector vollständige Param-Doku. Die Rückgabe-Struktur jedes Tools ist in [`output-shapes.md`](output-shapes.md) festgelegt, die abhakbare Implementierungs-Liste in [`tools-checklist.md`](tools-checklist.md).

## Konfiguration

### Methode 1: Env-Vars (Single Account)

Einfachster Weg. Reicht für 90 % der User.

| Variable | Pflicht | Default | Beschreibung |
|---|---|---|---|
| `CLASSIC_IMAP_SMTP_USER` | ✅ | — | Mail-Adresse / IMAP-Login |
| `CLASSIC_IMAP_SMTP_PASS` | ✅ | — | Passwort oder App-Password |
| `CLASSIC_IMAP_SMTP_IMAP_HOST` | ✅ | — | IMAP-Hostname |
| `CLASSIC_IMAP_SMTP_IMAP_PORT` | | `993` | IMAP-Port |
| `CLASSIC_IMAP_SMTP_IMAP_TLS` | | `true` | TLS (`true` = implicit, `starttls` = STARTTLS, `false` = plain) |
| `CLASSIC_IMAP_SMTP_SMTP_HOST` | ✅ | — | SMTP-Hostname |
| `CLASSIC_IMAP_SMTP_SMTP_PORT` | | `465` | SMTP-Port |
| `CLASSIC_IMAP_SMTP_SMTP_TLS` | | `true` | TLS-Mode (analog) |
| `CLASSIC_IMAP_SMTP_FROM_NAME` | | — | Display-Name beim Senden |
| `CLASSIC_IMAP_SMTP_VERIFY_TLS` | | `true` | Zertifikat verifizieren |

Für Gmail, Outlook, iCloud, Fastmail, Posteo, mailbox.org, GMX, web.de, Yahoo, ProtonMail-Bridge reicht es, `CLASSIC_IMAP_SMTP_USER` + `CLASSIC_IMAP_SMTP_PASS` zu setzen — Host/Port werden automatisch erkannt.

### Methode 2: Config-File (Multi-Account)

Pfad (XDG-konform):
- Linux/macOS: `~/.config/classic-imap-smtp-mcp/config.toml`
- Windows: `%APPDATA%\classic-imap-smtp-mcp\config.toml`

```toml
default_account = "personal"

[[accounts]]
name = "personal"
user = "you@gmail.com"
pass = "your-app-password"
from_name = "Your Name"
# Host/Port via Provider-Auto-Detect

[[accounts]]
name = "work"
user = "you@company.com"
pass = "another-app-password"
imap_host = "imap.company.com"
imap_port = 993
smtp_host = "smtp.company.com"
smtp_port = 587
smtp_tls = "starttls"
from_name = "You at Work"

[[accounts]]
name = "selfhosted"
user = "me@mybox.tld"
pass = "supersecret"
imap_host = "mail.mybox.tld"
smtp_host = "mail.mybox.tld"
verify_tls = false  # selbst-signierte Zertifikate
```

Bei mehreren Accounts akzeptiert jedes Tool einen optionalen `account`-Parameter. Ohne Parameter wird der Default genutzt.

### Methode 3: Mischbetrieb

Env-Vars überschreiben Config-File-Werte. Praktisch für CI/Container-Umgebungen mit Basis-Config aus File + sensible Werte aus Env.

## Feature-Flags & Tool-Auswahl

classic-imap-smtp-mcp registriert Tools **konditional zur Server-Start-Zeit**. Was nicht registriert ist, kann der Client nicht sehen — saubere Capability-Boundary. Alle Schalter sind **CLI-Args** (keine Env-Vars).

### Die vier Feature-Flags (grob)

| Flag | Wirkung |
|---|---|
| `--safe` | Löschen aus: `imap_delete_message`, `imap_expunge`, `imap_delete_mailbox` weg. Senden, Verschieben, Markieren, Drafts bleiben. |
| `--readonly` | Nur Lesezugriffe: alle schreibenden IMAP-Operationen (STORE, MOVE, COPY, APPEND, Folder-CRUD) **und** SMTP-Send weg. `smtp_verify_connection` und `account_list` bleiben. |
| `--no-imap` | Alle IMAP-Tools weg. |
| `--no-smtp` | Alle SMTP-Tools weg. |

`--safe` und `--readonly` sind kombinierbar (`--readonly` ist strenger und gewinnt). `--no-imap` **und** `--no-smtp` zusammen ergeben einen leeren Server — das bricht beim Start mit Fehler ab (fast sicher ein Konfig-Versehen).

### Feingranulare Auswahl (Expertenmodus)

Zwei Flags mit **Präfix-Wildcards** für chirurgische Kontrolle:

| Flag | Wirkung |
|---|---|
| `--allow-tools=<csv>` | Tools explizit freigeben — **überschreibt die Feature-Flags**. Holt gezielt zurück, was eine grobe Geste weggeschaltet hat. |
| `--deny-tools=<csv>` | Tools explizit wegnehmen — **gewinnt über alles**, auch über `--allow-tools`. |

Wildcards matchen per Präfix: `imap_*`, `smtp_*`, `account_*`, `meta_*`, oder feiner `imap_delete_*`, `imap_bulk_*`, `imap_get_*`.

**Kaskade (grob → fein, fein gewinnt):**

```
1. Feature-Flags bilden die Basis-Menge
2. --allow-tools überschreibt sie (kann Tools zurückholen)
3. --deny-tools hat das letzte Wort
```

Beispiele:

```bash
# Nur lesen, aber Senden trotzdem erlauben
npx classic-imap-smtp-mcp --readonly --allow-tools=smtp_send

# SMTP komplett aus, nur smtp_send zurückholen
npx classic-imap-smtp-mcp --no-smtp --allow-tools=smtp_send

# Alles, aber kein Account-Management
npx classic-imap-smtp-mcp --deny-tools=account_*

# Alle IMAP-Tools außer den Lösch-Varianten
npx classic-imap-smtp-mcp --allow-tools=imap_* --deny-tools=imap_delete_*
```

## CLI

```
classic-imap-smtp-mcp [options]

Run as MCP server over stdio (default subcommand).

Options:
  --safe               Lösch-Tools deaktivieren (delete/expunge/delete-mailbox)
  --readonly           Nur Lesezugriffe (kein Schreiben, kein SMTP-Send)
  --no-imap            Alle IMAP-Tools deaktivieren
  --no-smtp            Alle SMTP-Tools deaktivieren
  --allow-tools=<list> Tools explizit freigeben, überschreibt Feature-Flags (CSV, Präfix-Wildcards)
  --deny-tools=<list>  Tools explizit wegnehmen, gewinnt über alles (CSV, Präfix-Wildcards)
  --account=<name>     Default-Account-Override
  --config=<path>      Alternativer Config-Pfad
  --log-level=<level>  trace|debug|info|warn|error (default: info)
  --log-format=<fmt>   json|pretty (default: json)
  -h, --help           Hilfe anzeigen
  -V, --version        Version anzeigen

Subcommands:
  init                 Template-Config nach XDG-Pfad schreiben
  test [account]       IMAP+SMTP-Verbindung testen
  list-tools           Welche Tools würden mit den aktuellen Flags registriert? (Dry-Run)
```

## Sicherheit

- Alle Verbindungen via TLS (implicit oder STARTTLS, je Config)
- Passwörter werden niemals geloggt
- Empfehlung: **App-Passwords** statt Account-Passwörter (Gmail, Outlook, iCloud unterstützen das)
- Config-File sollte `0600` permission haben (classic-imap-smtp-mcp warnt bei zu offenen Permissions)
- Attachment-Downloads sind auf eine konfigurierbare Maximalgröße begrenzt
- `CLASSIC_IMAP_SMTP_VERIFY_TLS=false` ist nur für selbst-signierte interne Server gedacht — wird im Log markiert

## Roadmap

Siehe [`phases.md`](phases.md) für den vollständigen Phasen-Plan.

- **v1.0** — Stable IMAP/SMTP mit allen 36 Tools, klassische Auth
- **v1.x** — OS-Keychain-Integration für Credentials
- **v2.0** — IMAP IDLE als streaming long-running tool (falls Client-Support reift)
- **v2.x** — Docker-First-Distribution

**Out of scope — permanent:** OAuth2, Calendar/ICS, AI-Triage, Scheduling, Notifications (siehe ["Was classic-imap-smtp-mcp nicht macht"](#was-ist-classic-imap-smtp-mcp) oben). Diese Grenzen sind bewusst und bleiben über alle Versionen bestehen.

## Mitwirken

PRs willkommen. Siehe [`AGENTS.md`](AGENTS.md) für Architektur und Konventionen (gilt für menschliche Contributors gleichermaßen), [`CONTRIBUTING.md`](CONTRIBUTING.md) für Workflow.

Wenn du an classic-imap-smtp-mcp **mit** einem AI-Assistenten arbeitest, lade `AGENTS.md` als erstes in den Context — das Repo ist darauf ausgelegt.

## Dokumentation in diesem Repo

| Datei | Zielgruppe | Inhalt |
|---|---|---|
| `README.md` (diese Datei) | Menschen | Übersicht, Install, Tool-Katalog, Config |
| [`llms.txt`](llms.txt) | Konsumierende LLMs | Maschinenoptimierte Install-/Setup-/Tool-Doku |
| [`AGENTS.md`](AGENTS.md) | Coding-Agents (Claude Code, Cursor, Codex) | Architektur, Konventionen, Build, Vorgaben |
| [`tools-checklist.md`](tools-checklist.md) | Implementierer | Abhakbare Liste aller 36 Tools mit Status, RFC-Refs, Definition of Done |
| [`output-shapes.md`](output-shapes.md) | Implementierer | Verbindliche Output-Struktur jedes Tools |
| [`phases.md`](phases.md) | Projekt-Mitwirkende | Entwicklungsphasen 0–5 |
| [`phase-0-marktanalyse.md`](phase-0-marktanalyse.md) | Projekt-Mitwirkende | Warum dieses Projekt existiert |
| [`phase-1-fragerunde.md`](phase-1-fragerunde.md) | Projekt-Mitwirkende | Designentscheidungen Phase 1 |
| `CONTRIBUTING.md` | Contributors | Dev-Workflow, Branching, PR-Regeln |
| `SECURITY.md` | Security-Reporter | Vulnerability-Reporting |
| `CHANGELOG.md` | Alle | Release-Notes |

## Lizenz

**TBD** — die Lizenz wird vor dem v1.0-Release final festgelegt. Bis dahin gilt: Code-Inspektion und privates Experimentieren sind okay, aber kein Production-Use oder Weiterverbreitung.
