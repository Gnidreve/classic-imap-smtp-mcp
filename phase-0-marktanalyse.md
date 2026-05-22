# Phase 0 — Marktanalyse: IMAP/SMTP MCP-Server

**Stand:** 20.05.2026
**Zweck:** Belegen, dass es eine echte Lücke gibt, und identifizieren, was bestehende Lösungen falsch machen, damit unser Projekt diese Lücke gezielt schließt.

---

## TL;DR

Es gibt **kein** IMAP/SMTP-MCP, das gleichzeitig:
1. den vollen Funktionsumfang eines guten Mailclients abdeckt,
2. sauber via `npx` (oder `uvx`) ausgeliefert wird,
3. provider-agnostisch ist (kein Gmail/M365-Lock-in),
4. aktiv gepflegt wird,
5. eine permissive Lizenz hat,
6. eine ehrlich kommunizierte, abgeschlossene Scope-Definition besitzt.

Selbst der populärste IMAP-MCP — **ai-zerolab/mcp-email-server mit 235 Stars** — hat nur 7 Tools und lässt Folder-Listing, Move, Flag-Management und ein eigenständiges Reply-Tool *komplett aus*. Die einzige funktional vollständige Lösung (**AIWerk/mcp-server-imap, 10 Tools**) hat **0 Stars**, eine Hosted-Service-Bindung und ein widersprüchliches README. Der ambitionierteste Konkurrent (**codefuturist/email-mcp, 47 Tools**) ist mit 1 Stern praktisch unbenutzt, LGPL-3.0-lizenziert und stark overscoped (Calendar, AI-Triage, Reminders im selben Server).

**Das Marktsegment "der eine IMAP/SMTP MCP, den jeder einfach installiert" ist unbesetzt** — und die 235 Stars von ai-zerolab beweisen, dass der Bedarf existiert.

---

## 1. Bewertete Kandidaten

Untersucht wurden 9 öffentlich auffindbare IMAP/SMTP MCP-Implementierungen. Tool-Listen für `ai-zerolab` und `AIWerk` stammen aus User-Recherche direkt am Sourcecode der Repos.

### 1.1 ai-zerolab/mcp-email-server — der populärste IMAP-MCP am Markt

- **Stack:** Python
- **Distribution:** PyPI (`uvx mcp-email-server`)
- **Quelle der Tool-Liste:** direkt aus `mcp_email_server/app.py` extrahiert
- **GitHub-Status:** **235 Stars / 97 Forks** — der mit Abstand bekannteste IMAP/SMTP-MCP am Markt
- **Tool-Surface (7 Tools + 1 Resource):**
  - `list_available_accounts` — Accounts auflisten, Credentials masked
  - `add_email_account` — Account zur Config hinzufügen (Setup-Tool, kein Daily-Driver)
  - `list_emails_metadata` — Metadaten-Liste mit Filtern (page/page_size, before/since, subject, from_address, to_address, order, mailbox, seen, flagged, answered)
  - `get_emails_content` — Vollinhalte per `email_id`, Batch-fähig
  - `send_email` — Senden inkl. cc/bcc/html/attachments/in_reply_to/references (Threading über Header, kein dediziertes Reply-Tool)
  - `delete_emails` — Bulk-Delete per ID
  - `download_attachment` — Attachment-Download, nur wenn `enable_attachment_download=true`
  - Resource: `email://{account_name}` — Account-Config masked
- **Stärken:**
  - Höchstes Community-Signal aller IMAP/SMTP-MCPs (235 ⭐)
  - Sauber gepflegt, CI-Eindruck professionell
  - Header-basiertes Threading immerhin im `send_email`-Tool eingebaut
  - Mehr Augen = mehr Bugs gefunden = niedrigeres Beta-Tester-Risiko
- **Schwächen / warum es deinen Use Case nicht abdeckt:**
  - **Kein Folder-Listing-Tool** — der User kann nicht durch die Mailbox navigieren
  - **Kein Freitext-Search-Tool** — nur Metadaten-Filter, keine echte SEARCH-API
  - **Kein Move-Tool** — Mails können nicht zwischen Foldern verschoben werden
  - **Kein Flag/Mark-Read/Star-Tool** — Read-State und Stars sind nicht änderbar
  - **Kein separates Reply-/Reply-All-Tool** — Threading nur indirekt über Header-Felder
  - **Kein dediziertes Attachment-List-Tool** — Attachments kommen über die Content-Tools mit
  - **Kein Folder-CRUD** (create/rename/delete mailbox)
  - **Kein IDLE / Push**
  - **Kein APPEND** — keine Möglichkeit Drafts auf den Server zu legen oder Mails zu importieren
- **Verdict:** Beweis, dass selbst der populärste IMAP-MCP funktional schmal ist. Wer ai-zerolab nutzt, hat *kein* Mailclient-Äquivalent, sondern eine LLM-fokussierte "lies und antworte"-Schnittstelle. Der breite Star-Count zeigt: es gibt klaren Bedarf, aber niemand füllt ihn vollständig.

### 1.2 AIWerk/mcp-server-imap — funktional am stärksten, aber adoptiert von niemandem

- **Stack:** TypeScript (`src/server.ts`)
- **Distribution:** Hosted-Service-Variante + selfhost; npm-Distribution unklar
- **Quelle der Tool-Liste:** direkt aus dem Sourcecode extrahiert
- **GitHub-Status:** **0 Stars / 0 Forks**
- **Tool-Surface (10 Tools):**
  - `email_list` — Mails im Folder (folder, limit, unreadOnly)
  - `email_read` — Vollnachricht (uid, folder, format=text|html), inkl. Attachment-Metadaten
  - `email_search` — Suche mit query/from/to/subject/since/before/unread/folder/limit
  - `email_folders` — Folder-Liste inkl. Status/Counts
  - `email_move` — Verschieben (uids, from, to)
  - `email_flag` — Flag-Aktionen (read/unread/star/unstar)
  - `email_delete` — Löschen via Move-to-Trash
  - `email_send` — Senden (to/subject/body/html/cc/bcc/replyTo/inReplyTo)
  - `email_reply` — Reply mit `replyAll`-Option, baut Reply-Kontext automatisch aus Originalmail
  - `email_attachment` — Attachment listen/holen (uid, folder, filename, index)
- **Stärken:**
  - **Funktional der stärkste IMAP/SMTP-Toolkasten am Markt** — Listen, Lesen, Suchen, Folder sehen, Move, Flag, Delete, Send, Reply, Attachments
  - Saubere Trennung Send vs. Reply (im Gegensatz zu ai-zerolab)
  - Folder-Awareness durchgängig (jedes Tool akzeptiert `folder`)
- **Schwächen / Vertrauensprobleme:**
  - **0 Stars / 0 Forks** — niemand benutzt das produktiv, kein Bug-Feedback aus der Welt
  - **README ist widersprüchlich:** an einer Stelle steht, `email_send` und `email_reply` seien im Hosted-Service nicht exposed; an anderer Stelle, alle 10 Tools erscheinen sofort. Unsauber, weckt Misstrauen.
  - **Hosted-Service-Fokus** weckt Lock-in-Verdacht — der ganze Sinn eines lokalen IMAP-MCPs ist provider-agnostisch und ohne Drittanbieter zu sein
  - **Kein Folder-CRUD** (create/rename/delete mailbox)
  - **Kein APPEND** für Drafts/Import
  - **Kein IDLE**
  - **Kein Multi-Account erkennbar**
  - **Keine Feature-Toggles**
- **Verdict:** Das Tool-Set zeigt, in welche Richtung es technisch gehen muss — ist aber wegen Hosted-Service-Bindung, README-Widersprüchen und null Adoption keine Alternative für jemanden, der einen vertrauenswürdigen, autonom laufenden Mail-MCP will.

### 1.3 codefuturist/email-mcp — der ambitionierteste Konkurrent

- **Stack:** TypeScript, Node ≥ 22, `imapflow` + `nodemailer`
- **Distribution:** `npx @codefuturist/email-mcp` ✅, auch Docker
- **Lizenz:** **LGPL-3.0-or-later** ⚠️ (potenziell Adoptions-hemmend, viral-light)
- **Scope:** 47 Tools, 7 Prompts, 6 Resources
- **Features:** Multi-Account, Drafts, Templates, Labels, Bulk Ops, Email-Scheduling, IMAP IDLE Watcher, AI-Triage via MCP Sampling, Desktop-Notifications (osascript/notify-send/PowerShell), Webhook-Alerts, ICS-Calendar-Extraktion, macOS-Reminders-Integration, OAuth2 (experimentell)
- **Konfig:** XDG-konform (`~/.config/email-mcp/config.toml`), Provider-Auto-Detection
- **GitHub-Status:** **1 Stern**, 1 Fork, 1 Maintainer + Copilot-Commits, neueste Release v0.2.0 (Feb 2026)
- **Stärken:**
  - Mit Abstand größter Tool-Umfang
  - Saubere Architektur (Services-Layer, Zod-Validierung, Vitest)
  - Vollwertige CLI (`account add/edit/delete`, `test`, `install`, `scheduler`)
  - Echter Setup-Wizard mit Provider-Auto-Detection
- **Schwächen / warum es deinen Use Case nicht abdeckt:**
  - **Scope-Creep:** Calendar, Reminders, AI-Triage, Webhooks, Notifications gehören nicht in einen *Mail*-MCP. Das ist ein "Productivity Suite MCP" — kein fokussierter Mail-Server.
  - **LGPL-3.0** schreckt kommerzielle Nutzer ab; viele Firmen verbieten Copyleft-Lizenzen pauschal in `package.json`-Auditing.
  - **Node ≥ 22** ist sehr aggressiv (Node 20 ist immer noch LTS).
  - **Praktisch null Community** (1 Stern) — keine Validierung durch echte Nutzer.
  - **OAuth2 als "experimental"** markiert — d. h. die einzige Lösung für Gmail/M365 ist im Status "kann gehen, kann nicht gehen".
  - **AI-Triage hardcoded in den Server** — der MCP entscheidet selbst, was wichtig ist. Das gehört in den Client, nicht in den Server.
  - **Keine Feature-Toggles via CLI-Args** — alles wird über TOML-Config gesteuert; harte Aktivierung/Deaktivierung einzelner Tools/Tool-Gruppen ist nicht vorgesehen.

### 1.2 nikolausm/imap-mcp-server

- **Stack:** TypeScript, Node, `imap` + `nodemailer`
- **Distribution:** **Clone + build only** (`curl install.sh | bash`), kein npm-Package
- **Lizenz:** unklar/proprietär aussehend (kein klares OSS-Statement im README)
- **Features:** AES-256-verschlüsselte Credentials, Connection Pooling, Web-Setup-Wizard, 15+ Provider-Presets (inkl. mailbox.org, Posteo, IONOS, GMX, WEB.DE — guter DE/EU-Support)
- **Stärken:**
  - Gute Provider-Abdeckung für DE/EU
  - Connection Pooling
  - Sauberes Code-Layout (services/tools/types)
- **Schwächen:**
  - **Kein npm-Package** → kein `npx`-Workflow → User müssen klonen, bauen, absolute Pfade in Configs eintragen
  - Lokaler Webserver für Setup-Wizard = Angriffsfläche
  - AES-256 für Credentials klingt gut, ist aber Sicherheits-Theater: der Schlüssel liegt zwangsläufig auf derselben Maschine
  - Kein klarer Tool-Katalog im README ersichtlich; Scope undefiniert
  - Tool-Set unbekannt ohne den Repo zu klonen — schlechte Discoverability

### 1.3 yunfeizhu/mcp-mail-server

- **Stack:** TypeScript, Node, npm-published
- **Distribution:** `npx mcp-mail-server` ✅
- **Konfig:** Env-Vars (single account)
- **Features:** Search by sender/subject/recipient/body, Read, Send mit HTML/Attachments, Reply (mit `replyToAll`, `includeOriginal`), Attachment-Download (Pfad oder Base64), Multi-Mailbox
- **Stärken:**
  - Sauberes `npx`-Pattern — funktioniert out of the box
  - Pragmatischer, fokussierter Scope
  - Aktiv: kürzlich Bugfixes (`FROM/TO/SUBJECT/BODY/KEYWORD/SINCE` Search-Fix, deleteMessage read-only-Fix)
- **Schwächen:**
  - **Single Account only** über Env-Vars
  - **Kein IDLE / Push** — nur Polling möglich
  - **Kein Folder-Management** (create/rename/delete mailbox)
  - **Keine Drafts** auf dem Server speichern
  - **Keine Bulk-Operationen**
  - **Keine Labels/Flags-Verwaltung** über Standard-Flags hinaus
  - **Kein Thread-Reconstruction** via In-Reply-To/References
  - Suchparameter sind vorgegeben (separate Tools für FROM/SUBJECT/BODY) statt einer flexiblen Such-API

### 1.4 dominik1001/imap-mcp

- **Stack:** TypeScript, Node, `imap-mcp` auf npm
- **Distribution:** `npx imap-mcp` ✅
- **Scope:** **Nur Draft-Erstellung** — speichert Drafts in Drafts-Folder
- **Stärken:** Klar fokussiert, läuft
- **Schwächen:** Praktisch nutzlos als Mailclient-Ersatz, deckt 5 % des nötigen Scopes ab

### 1.5 gabigabogabu/email-mcp-server

- **Stack:** TypeScript, Node
- **Distribution:** **Clone-only** (kein npm-Package)
- **Scope:** Lesen, Senden, Suchen, Folder listen
- **Stärken:** Sehr einfach
- **Schwächen:** Sehr basic, Clone-only, kein Multi-Account, keine Bulk-Ops, keine Drafts, keine Folder-Manipulation

### 1.6 samihalawa/mcp-server-smtp

- **Stack:** TypeScript, Node
- **Distribution:** **Clone-only** + manuelle Pfade in MCP-Config
- **Scope:** **Nur SMTP** — kein IMAP. Multiple SMTP-Configs, Email-Templates, Bulk-Send, HTML-Support
- **Stärken:** Sauberes Template-System
- **Schwächen:** Halbe Lösung, Clone-only, keine IMAP-Seite

### 1.7 @martinzarfl/mail-mcp

- **Stack:** TypeScript, Node
- **Distribution:** npm-Package
- **Scope:** SMTP + IMAP basic
- **Schwächen:** Sehr klein, kaum Sichtbarkeit, Feature-Tiefe unklar

### 1.8 bradsjm/mail-imap-mcp-rs

- **Stack:** **Rust**, distribution via `npx @bradsjm/mail-imap-mcp-rs` (interessant: Rust-Binary in npm-Package gewrapped)
- **Scope:** Read/write IMAP, stdio default, optional HTTP-Transport
- **Stärken:** Performance, structured output, cursor-based pagination, security-first
- **Schwächen:**
  - **Nur IMAP** — kein SMTP
  - Rust-Build-Pipeline ist eine zusätzliche CI-Komplexität
  - Spezifische Stärken (Speed) sind bei stdio-MCP für einen User nicht relevant (I/O-bound, nicht CPU-bound)

### 1.9 non-dirty/imap-mcp

- **Stack:** Python, `uv` für Installation
- **Distribution:** Clone + `uv pip install -e .`
- **Scope:** "Learning user preferences" — also ein Lab-/Forschungs-Projekt, kein Production-MCP
- **Schwächen:** Clone-only, experimentell, ungeeignet als Endnutzer-Tool

### 1.10 djaboxx/imap-mcp-server

- **Erfasst auf mcp.so** — eigenes GitHub-Repo, Details dürftig dokumentiert, keine npm-Distribution erkennbar

---

## 2. Quer-Analyse: was bricht überall?

| Kriterium | Lage am Markt |
|---|---|
| **`npx`/`uvx`-Distribution** | ai-zerolab (uvx), codefuturist, yunfeizhu, dominik1001, bradsjm. Mehrheit ist Clone-only. |
| **IMAP + SMTP zusammen** | Etwa die Hälfte; einige machen nur eins von beiden |
| **Voller Mailclient-Scope** | **0 von 12.** AIWerk kommt am nächsten (10 Tools), bricht aber bei Folder-CRUD, APPEND, IDLE, Multi-Account. |
| **Folder-Listing** | AIWerk, codefuturist, nikolausm. **ai-zerolab nicht.** |
| **Echtes Search-Tool (Freitext)** | AIWerk, codefuturist. ai-zerolab nur Metadaten-Filter. |
| **Move zwischen Foldern** | AIWerk, codefuturist, nikolausm. **ai-zerolab nicht.** |
| **Flag/Star-Management** | AIWerk, codefuturist, nikolausm. **ai-zerolab nicht.** |
| **Dediziertes Reply-Tool** | AIWerk, codefuturist. ai-zerolab nur via Header in send_email. |
| **Multi-Account** | ai-zerolab, codefuturist, nikolausm |
| **Folder-CRUD (create/rename/delete)** | Nur codefuturist und nikolausm |
| **IDLE / Push** | Nur codefuturist |
| **Thread-Reconstruction (References-Walk)** | Nur codefuturist |
| **Bulk-Operationen** | ai-zerolab (delete), codefuturist (full), nikolausm |
| **APPEND (Drafts speichern, Import)** | Nur codefuturist |
| **Feature-Toggles via CLI-Args** | **Niemand** |
| **Read-only-Modus** | Nur codefuturist (Config), niemand via CLI |
| **Permissive Lizenz (MIT/Apache)** | dominik1001, yunfeizhu (vermutlich MIT); codefuturist ist LGPL |
| **Aktive Maintenance (≤ 3 Monate)** | ai-zerolab, codefuturist, yunfeizhu |
| **Provider-Auto-Detection** | codefuturist (8), nikolausm (15+) |
| **Klare Scope-Grenze (nur Mail)** | ai-zerolab, AIWerk, yunfeizhu, nikolausm. codefuturist ist overscoped. |
| **Stars ≥ 100** | **Nur ai-zerolab (235).** Aber funktional zu schmal. |
| **Stars ≥ 50 UND voller Mailclient-Scope** | **Keiner.** |

**Hauptbefund:** Selbst der mit Abstand populärste IMAP-MCP (ai-zerolab, 235 ⭐) lässt zentrale Mailclient-Operationen — Folder-Navigation, Move, Flag-Management, Reply als eigenständige Operation — komplett aus. Der einzige funktional starke Konkurrent (AIWerk) hat 0 Stars und Hosted-Service-Bindung. Niemand vereint *vollständig*, *fokussiert auf Mail*, *npx-distributable*, *permissiv lizenziert*, *aktiv gepflegt*, *toggle-bar*.

---

## 3. Lücken-Analyse (Was unser Projekt anders machen muss)

### 3.1 Scope-Disziplin
Strikt: **nur** IMAP + SMTP. Kein Calendar, kein Reminders, kein AI-Triage, kein Notifier, kein Scheduler. Wenn jemand das will, kann er weitere MCPs daneben hängen — das ist die ganze Idee des Protokolls.

### 3.2 Vollständige IMAP-Schema-Abdeckung
Was ein guter Mailclient kann, muss der MCP exponieren. Konkret (Auswahl, finale Liste folgt in Phase 1):

**IMAP-Lesen:**
- LIST/LSUB (Folder enumerieren, mit special-use flags)
- SELECT/EXAMINE (Folder öffnen, RO/RW)
- STATUS (Counts ohne SELECT)
- SEARCH (vollständig, inkl. CHARSET, alle RFC-3501-Kriterien)
- FETCH (Header, Body, BODYSTRUCTURE, BODY[]/BODY.PEEK, gezielte MIME-Parts)
- UID FETCH/SEARCH
- IDLE (RFC 2177)

**IMAP-Schreiben:**
- STORE (Flags setzen/entfernen, inkl. Custom-Flags/Keywords)
- COPY / MOVE (RFC 6851)
- APPEND (Drafts, importierte Mails)
- EXPUNGE / UID EXPUNGE
- CREATE / DELETE / RENAME mailbox
- SUBSCRIBE / UNSUBSCRIBE

**SMTP:**
- AUTH PLAIN / LOGIN / CRAM-MD5
- STARTTLS + implicit TLS
- Senden, Reply (mit korrektem In-Reply-To/References), Forward, BCC, CC
- Attachments (Pfad + Base64-Inline)
- Inline-Images (cid-Referenzen für HTML-Mails)
- Custom Headers
- Message-ID-Setzung
- DKIM-Signing (optional v2?)

**MIME-Verarbeitung:**
- Robustes Parsen (multipart/alternative, multipart/related, multipart/mixed)
- Encoding-Handling (quoted-printable, base64, 8bit, charsets)
- Attachment-Extraktion mit Filename-Decoding (RFC 2231)

### 3.3 Feature-Toggles via CLI-Args
Der User-Wunsch ist klar: pro Start aktivierbar/deaktivierbar. Optionen wie:
- `--no-smtp` (nur IMAP-Tools registrieren)
- `--no-imap` (nur SMTP-Tools registrieren)
- `--readonly` (alle write-Operationen ausschalten)
- `--no-delete` (alles erlaubt außer DELETE/EXPUNGE)
- `--no-folder-mgmt` (kein CREATE/DELETE/RENAME mailbox)
- `--allow-tools=tool1,tool2` und/oder `--deny-tools=tool3` (Feingranular)

Mechanik: Beim Server-Start werden Tools konditional registriert. MCP-Clients sehen nur das, was registriert wurde — saubere "Capability Surface".

### 3.4 Distribution
- npm-Package mit korrektem `bin`-Eintrag → `npx <package>` funktioniert
- Single-Account via Env-Vars (für triviale Configs)
- Multi-Account via Config-File (`~/.config/<name>/config.toml` oder JSON)
- Docker als 2. Welle nach Validierung (Phase 5)
- **Kein** lokaler Webserver für Setup, **kein** Browser-basiertes Onboarding (zu komplex, Angriffsfläche)

### 3.5 Lizenz
**MIT** oder **Apache-2.0**. Punkt. Keine Copyleft-Diskussion. Maximale Adoption ist wichtiger als ideologische Lizenz-Politik.

### 3.6 Transparente, abgeschlossene Scope-Definition
Im README direkt am Anfang: "Dieser MCP macht X. Er macht **nicht** Y." Damit ehrlich kommuniziert wird, was nicht reingehört (Calendar, AI-Triage etc.). Das ist Marketing durch Klarheit, nicht durch Feature-Listen.

---

## 4. Strategische Entscheidung: Runtime

Aus der Recherche ergibt sich folgende Empfehlung für Phase 1:

### TypeScript / Node mit `npx`-Distribution

**Pro:**
- TypeScript ist die de-facto-Lingua-franca des MCP-Ökosystems; Anthropics offizielle Beispiele sind oft in TS
- `imapflow` (modern, Promise-basiert, aktiv gepflegt) + `nodemailer` (Industrie-Standard für SMTP) sind unangefochten die besten Libraries für IMAP/SMTP in Node
- `npx`-Pattern ist im MCP-Ökosystem der erwartete Default — User kopieren Configs direkt aus README
- Cold-Start 1–3s ist für stdio-MCPs irrelevant (einmal beim Client-Start)
- Cross-Platform out-of-the-box, kein Build-Toolchain-Toll wie bei Rust (MSVC, 4 GB) oder Go-Cross-Compile

**Kontra:**
- Node-Runtime muss installiert sein (aber: bei der MCP-Zielgruppe ohnehin meist vorhanden)

### Alternativen-Bewertung

| Runtime | Distribution | Reife der IMAP/SMTP-Libs | MCP-SDK-Reife | Verdict |
|---|---|---|---|---|
| **TypeScript/Node + npx** | ✅ npx | imapflow + nodemailer = best-in-class | Tier 1, offiziell | **Empfehlung** |
| **Python + uvx** | ✅ uvx (wachsend) | `imaplib`/`aioimaplib` solide, aber niedriger Abstraktionsgrad | Tier 1, offiziell (FastMCP) | Tragfähige Alternative |
| **Rust + npx-wrapped binary** | ⚠️ möglich (bradsjm) | `async-imap` ok, kleinere Community | Tier 2 (rmcp community) | Overkill, mehr CI-Komplexität |
| **Go + manuelles Binary** | ❌ kein `npx`-Äquivalent | `go-imap` solide | Tier 2 (community) | Distributions-Hürde |

→ **Phase 1 wird TypeScript empfehlen.** Begründung wird dort vollständig diskutiert.

---

## 5. Was wir aus den Schwächen anderer mitnehmen

| Konkurrent macht falsch | Wir machen es so |
|---|---|
| ai-zerolab: 235 Stars, aber zentrale Tools fehlen (kein Folder-List, kein Move, kein Flag, kein Reply) | Wir bauen die fehlenden Operationen als Erstklass-Tools. Vollständigkeit *ist* das Marketing. |
| ai-zerolab: nur Metadaten-Filter statt echtem SEARCH | Wir bauen den vollen RFC-3501-SEARCH-Builder. |
| AIWerk: gutes Tool-Set, aber Hosted-Service-Bindung + 0 Stars + widersprüchliches README | Wir liefern lokal-only, MIT-lizenziert, mit konsistenter, knapper Doku. |
| AIWerk: kein APPEND, kein Folder-CRUD, kein IDLE | Wir bauen APPEND und Folder-CRUD in v1. IDLE entweder v1 oder v2 (in Phase 1 entscheiden). |
| codefuturist: AI-Triage hardcoded im Server | Wir bauen *nur* das Protokoll-Surface. AI-Logik gehört zum Client. |
| codefuturist: LGPL-3.0 | Wir nehmen MIT oder Apache-2.0. |
| nikolausm: Clone-only, Webserver-Setup | Wir liefern via npx, ohne Webserver. |
| yunfeizhu: Single Account, kein Folder-Mgmt, kein IDLE | Wir machen Multi-Account, vollen Folder-CRUD, IDLE prüfen. |
| dominik1001: Nur Drafts | Wir machen vollen Scope. |
| samihalawa: Nur SMTP | Wir machen beides. |
| bradsjm: Nur IMAP, Rust-Komplexität | Wir machen beides, in TS. |
| Alle: keine CLI-Feature-Toggles | Wir bauen das als Erstklass-Feature. |
| Alle: keine klare "wir machen nicht XYZ"-Scope-Aussage | Wir kommunizieren das explizit. |

---

## 6. Fazit der Marktanalyse

Die Lücke ist **konkret**, **groß**, und **adressierbar** — und wird durch die zwei prominentesten Konkurrenten *bewiesen*, nicht widerlegt:

- **ai-zerolab (235 ⭐)** zeigt: es gibt klaren Bedarf für IMAP/SMTP-MCPs, aber selbst der populärste Server lässt grundlegende Mailclient-Operationen weg. Wer das Repo bookmarkt, sucht eigentlich etwas Vollständigeres.
- **AIWerk (0 ⭐)** zeigt: jemand hat den richtigen Tool-Schnitt erkannt, scheitert aber an Vertrauen (Hosted-Service-Bindung, README-Widersprüche, keinerlei Community-Validierung).
- **codefuturist (1 ⭐)** zeigt: Technische Ambition allein reicht nicht — Scope-Creep, LGPL und fehlende User-Adoption ersticken auch ein Feature-reiches Projekt.

Wir konkurrieren also nicht mit einer dominanten Lösung, sondern mit einem fragmentierten Markt aus:
- 1 populären aber funktional unvollständigen Lösung (ai-zerolab)
- 1 funktional starken aber adoptionsfreien Lösung (AIWerk)
- 1 ambitioniertem aber overscoped + LGPL-Projekt (codefuturist)
- 1 nicht-distribuierten aber feature-reichen Projekt (nikolausm)
- 5+ unterskalierten Basic-Implementierungen

Mit einem fokussierten, npx-distributierten, vollständigen, MIT-lizenzierten, toggle-baren IMAP/SMTP-MCP bedienen wir das Segment, das aktuell *niemand* sauber bedient — und das durch die 235 Stars von ai-zerolab nachgewiesen vorhanden ist.

→ **Phase 1 kann starten.**
