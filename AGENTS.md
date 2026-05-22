# AGENTS.md

**Zielgruppe:** Coding-Agents (Claude Code, Cursor, Codex, etc.), die aktiv am `classic-imap-smtp-mcp`-Repo arbeiten.

Wenn du ein *konsumierender* LLM bist, der den Server bei einem End-Nutzer installieren oder benutzen soll, lies stattdessen [`llms.txt`](llms.txt).

Wenn du ein Mensch bist, der das Projekt verstehen will, lies [`README.md`](README.md).

---

## TL;DR — was du wissen musst, bevor du anfasst

1. Dieses Projekt folgt einem **Phasen-Modell**. Status in [`phases.md`](phases.md). **Springe nicht über Phasen.** Wenn du in Phase 2 bist, sind die Entscheidungen aus Phase 1 unverhandelbar.
2. **Top-down, declarativ.** Die [`README.md`](README.md) ist der Vertrag für Tool-Inputs, CLI-Flags und Config; [`output-shapes.md`](output-shapes.md) der Vertrag für Tool-Outputs; [`tools-checklist.md`](tools-checklist.md) die maßgebliche Liste, welche Tools existieren. Diese drei sind verbindlich.
3. **Scope-Disziplin.** Wenn ein Feature nicht in der README steht, gehört es nicht ins Projekt. Niemals Calendar, AI-Triage, Reminders, Scheduler einbauen — egal wie gut die Idee scheint. Begründung in [`phase-0-marktanalyse.md`](phase-0-marktanalyse.md).
4. **Keine Eigeninitiative bei offenen Phase-1-Fragen.** Wenn du in [`phase-1-fragerunde.md`](phase-1-fragerunde.md) ein `Entscheidung: _offen_` siehst, **frag den User**, treffe keine Annahme.
5. **Tests sind Pflicht.** Jeder Tool-PR braucht Unit-Test + (wo möglich) Integration-Test gegen lokalen Dovecot/Mailpit.

---

## Projekt-Identität (fix)

- **Name:** `classic-imap-smtp-mcp` (final, Phase 1 Cluster B1)
- **Sprache:** TypeScript (final, Phase 1 Cluster A1)
- **Runtime:** Node ≥ 20 (LTS)
- **Distribution:** npm-Package mit `bin`-Entry, ausführbar via `npx classic-imap-smtp-mcp`
- **Transport:** stdio only — kein HTTP/SSE, kein Webserver
- **Lizenz:** TBD (wird vor v1.0-Release final festgelegt; bis dahin im Repo als `LICENSE: TBD`, kein npm-Publish)

---

## Architektur-Vorgaben

### Schichten (top → bottom)

```
src/
├── bin/
│   └── main.ts             # CLI-Entry, Argv-Parsing, Boot (Command-Name: classic-imap-smtp-mcp)
├── server/
│   ├── server.ts           # MCP-Server-Aufbau, Tool-Registrierung (konditional!)
│   ├── registry.ts         # 3-Stufen-Kaskade: Feature-Flags → Allow → Deny
│   └── logging.ts          # stderr-Logger, niemals stdout (stdout = MCP-Protokoll)
├── config/
│   ├── schema.ts           # Zod-Schemas für Config-File und Env-Vars
│   ├── loader.ts           # TOML laden, Env-Vars mergen, validieren
│   ├── xdg.ts              # XDG-Pfade plattformübergreifend
│   └── providers.ts        # Provider-Auto-Detection (Gmail, Outlook, ...)
├── connections/
│   ├── imap-pool.ts        # Imapflow-Wrapper, Reconnect, Lifecycle
│   └── smtp-pool.ts        # Nodemailer-Transport, Pooling
├── tools/
│   ├── _types.ts           # Gemeinsame Typen, Tool-Definition-Interface
│   ├── imap-read/          # 12 Tools, je eine Datei
│   ├── imap-write/         # 8 Tools
│   ├── imap-mailbox/       # 5 Tools (Folder-CRUD)
│   ├── smtp/               # 5 Tools
│   ├── account/            # 4 Tools (Account-Management)
│   └── meta/               # 2 Tools (Server-Introspektion)
├── lib/
│   ├── mime.ts             # mailparser-Wrapper, Attachment-Dekodierung
│   ├── search-builder.ts   # IMAP-SEARCH-Kriterien → imapflow-Query
│   ├── threading.ts        # In-Reply-To/References-Walk
│   └── errors.ts           # Strukturierte Error-Typen
└── index.ts                # Library-Export (optional, für Tests)
```

### Regeln pro Schicht

- **`bin/` und `server/`** dürfen alles importieren.
- **`tools/`** dürfen `connections/`, `lib/`, `config/`, `_types.ts` importieren — niemals `server/`.
- **`connections/`** dürfen `lib/` und `config/` importieren.
- **`config/`** und **`lib/`** sind leaf-Module — keine Cross-Imports zwischen ihnen, außer Typen.
- Jedes Tool ist eine eigene Datei mit Default-Export einer `ToolDefinition`. Eine Datei = ein Tool. Keine Sammelmodule.

### Tool-Definition-Interface

Jedes Tool exportiert dieselbe Form:

```ts
// src/tools/_types.ts
export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;                          // z.B. "imap_list_mailboxes"
  description: string;                   // für MCP tools/list
  category: ToolCategory;                // imap-read | imap-write | imap-mailbox | smtp | account | meta
  inputSchema: ZodType<TInput>;
  outputShape?: ZodType<TOutput>;        // optional, für Inspektion
  handler: (input: TInput, ctx: ToolContext) => Promise<TOutput>;
}
```

`ToolContext` enthält den geladenen Config, den Account-Resolver und die Connection-Pools — niemals Globals.

### Konditionale Tool-Registrierung — 3-Stufen-Kaskade

`src/server/registry.ts` ist der einzige Ort, der entscheidet, welche Tools beim Start registriert werden. Die Kaskade läuft von grob nach fein; **je feiner die Stufe, desto höher die Priorität.**

1. **Feature-Flags (grob):** `--safe`, `--readonly`, `--no-imap`, `--no-smtp` bilden die Basis-Menge.
2. **`--allow-tools` (mittel):** überschreibt die Feature-Flags — holt Tools explizit zurück, die eine grobe Geste weggeschaltet hat. Ohne Feature-Flags wirkt es als Whitelist (grenzt ein).
3. **`--deny-tools` (fein):** gewinnt über alles, auch über Allow.

Allow und Deny unterstützen **Präfix-Wildcards** (`imap_*`, `account_*`, `imap_delete_*`, …).

```ts
function resolveActiveTools(all: ToolDefinition[], opts: ResolvedOptions): ToolDefinition[] {
  // Stufe 1: grobe Basis-Menge aus Feature-Flags
  let active = new Set(
    all.filter((t) => passesFeatureFlags(t, opts)).map((t) => t.name),
  );

  // Stufe 2: Allow überschreibt Feature-Flags (b-Logik — kann aufweiten)
  if (opts.allowTools?.length) {
    for (const tool of all) {
      if (matchesAny(tool.name, opts.allowTools)) active.add(tool.name);
    }
    // Bei gesetztem Allow zusätzlich auf die Allow-Menge eingrenzen,
    // sofern keine Feature-Flags die Basis schon definiert haben:
    // (Detail-Semantik in phase-1-fragerunde.md, Cluster D)
  }

  // Stufe 3: Deny gewinnt über alles
  if (opts.denyTools?.length) {
    for (const name of [...active]) {
      if (matchesAny(name, opts.denyTools)) active.delete(name);
    }
  }

  return all.filter((t) => active.has(t.name));
}

function passesFeatureFlags(t: ToolDefinition, opts: ResolvedOptions): boolean {
  if (opts.noImap && t.category.startsWith("imap")) return false;
  if (opts.noSmtp && t.category === "smtp") return false;
  if (opts.readonly && !READONLY_TOOLS.has(t.name)) return false; // nur Lese-Tools + meta + smtp_verify
  if (opts.safe && DELETE_TOOLS.has(t.name)) return false;        // delete/expunge/delete-mailbox weg
  return true;
}

// matchesAny unterstützt Präfix-Wildcards: "imap_*" matcht "imap_search" etc.
function matchesAny(name: string, patterns: string[]): boolean {
  return patterns.some((p) =>
    p.endsWith("*") ? name.startsWith(p.slice(0, -1)) : name === p,
  );
}
```

**Fail-fast:** Wenn `--no-imap` **und** `--no-smtp` gleichzeitig gesetzt sind, bricht der Server beim Start mit einer stderr-Meldung und Exit-Code ≠ 0 ab (siehe `bin/`-Schicht) — das ist fast sicher ein Konfig-Versehen, und die LLM bekäme den Zustand sonst nicht zuverlässig gemeldet.

Die `READONLY_TOOLS`- und `DELETE_TOOLS`-Konstanten sind hartkodiert und decken sich 1:1 mit `tools-checklist.md`.

---

## Code-Konventionen

- **TypeScript strict.** `tsconfig` mit `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- **Keine `any`.** `unknown` + Zod-Validierung.
- **Async/await, kein `.then`-Chaining** außer bei einer dokumentierten Performance-Begründung.
- **Errors:** strukturierte Klassen in `lib/errors.ts`. Niemals einen rohen `Error` werfen — immer ein konkreter Subtyp. Jede Error-Klasse trägt einen festen `code`-String (den der Client sieht). Verbindliches Mapping:

| Error-Klasse | `code` (Client-sichtbar) | Wann |
|---|---|---|
| `AuthError` | `AUTH_FAILED` | Login IMAP oder SMTP fehlgeschlagen |
| `MailboxNotFoundError` | `MAILBOX_NOT_FOUND` | Folder existiert nicht |
| `UidNotFoundError` | `UID_NOT_FOUND` | Message-UID existiert nicht im Folder |
| `AttachmentNotFoundError` | `ATTACHMENT_NOT_FOUND` | Part-ID/Filename nicht in der Message |
| `AccountNotFoundError` | `ACCOUNT_NOT_FOUND` | `account`-Parameter zeigt auf nicht-konfigurierten Account |
| `RateLimitError` | `RATE_LIMITED` | Token-Bucket erschöpft |
| `TlsError` | `TLS_ERROR` | Zertifikats-/TLS-Handshake-Problem |
| `ConfigError` | `CONFIG_ERROR` | Config fehlt/ungültig, oder Account-Mutation ohne Config-File |
| `PermissionError` | `PERMISSION_DENIED` | Config-File-Permissions zu offen, oder Tool im aktiven Modus nicht erlaubt |
| `ImapProtocolError` | `IMAP_PROTOCOL_ERROR` | Sonstiger IMAP-Server-Fehler (mit `imap_response`-Detail) |
| `SmtpRelayError` | `SMTP_RELAY_ERROR` | SMTP-Relay/Versand abgelehnt |

Diese Liste ist die Single Source of Truth für Error-Codes. README und llms.txt referenzieren sie, duplizieren sie nicht.
- **Logging:** ausschließlich über `server/logging.ts` → stderr. **Niemals `console.log`**, das würde das MCP-Protokoll auf stdout zerstören.
- **Keine globalen Variablen.** Alles via Dependency Injection durch `ToolContext`.

---

## Build & Run

```bash
pnpm install               # Erstinstallation
pnpm typecheck             # tsc --noEmit
pnpm lint                  # Biome oder ESLint
pnpm test                  # Vitest, unit-tests
pnpm test:integration      # Integration gegen lokales Dovecot + Mailpit (Docker)
pnpm build                 # tsup → dist/
pnpm start                 # Lokales Ausführen via tsx
node dist/bin/main.js      # Production-Build ausführen
```

CI führt `typecheck`, `lint`, `test`, `build` bei jedem PR aus. Integration-Tests laufen nightly + auf `main`.

---

## Tests

### Unit-Tests
- Jedes Tool hat eine `*.test.ts` direkt daneben.
- IMAP-/SMTP-Connections werden gemockt (siehe `test/mocks/`).
- Coverage-Ziel: ≥ 85 % für `tools/`, ≥ 70 % gesamt.

### Integration-Tests
- Verzeichnis `test/integration/`.
- `docker-compose.test.yml` startet:
  - **Dovecot** (IMAP) mit zwei Test-Accounts + initialer Mailbox-Struktur (INBOX, Sent, Drafts, Archive, Custom-Folder)
  - **Mailpit** (SMTP) als Sender + Inspektor
- Tests gegen echten IMAP-Server prüfen: SEARCH-Operatoren, FETCH-Parts, MOVE/COPY-Semantik, APPEND, Flag-STORE, Folder-CRUD. (Kein IDLE — nicht in v1, siehe Roadmap.)

### Provider-Smoke-Tests (manuell, Phase 4)
- Test-Matrix gegen Gmail, Outlook, iCloud, mailbox.org, Posteo, GMX, web.de, ProtonMail-Bridge.
- Ergebnisse in `docs/provider-matrix.md` dokumentieren.

---

## PR-Checkliste

Bevor du einen PR vorschlägst:

- [ ] Tool-Definition entspricht 1:1 dem in `README.md` definierten Schema
- [ ] Eigene Datei pro Tool, korrekte Schicht
- [ ] Zod-Schema für Input
- [ ] Strukturierter Error-Typ bei Fehlerpfaden
- [ ] Unit-Test vorhanden
- [ ] Integration-Test, wo das Tool gegen echtes IMAP/SMTP läuft
- [ ] `pnpm typecheck && pnpm lint && pnpm test` grün
- [ ] README aktualisiert, *falls* sich Tool-Verhalten ändert
- [ ] Kein Logging auf stdout
- [ ] Keine neuen Dependencies ohne Begründung im PR-Beschrieb

---

## Was du **niemals** tun darfst

1. **Stdout für irgendwas außer dem MCP-Protokoll benutzen.** Selbst ein `console.log("hello")` während des Tool-Loadings zerstört die Client-Verbindung.
2. **Globale Singletons einführen.** Connection-Pools, Config — alles via Context.
3. **Features in den Server einbauen, die nicht in der README stehen.** AI-Heuristiken, Auto-Categorization, Scheduling, Calendar, Notifications. Niemals. Siehe `phase-0-marktanalyse.md`.
4. **OAuth2 / XOAUTH2 implementieren.** Auch nicht "experimentell", auch nicht "vorbereitend". Dieser MCP ist klassisches IMAP/SMTP — User/Pass + App-Password + STARTTLS/SSL. Punkt. Permanent.
5. **Credentials irgendwo loggen, auch nicht im Debug-Level.** Sanitizer in `logging.ts` zwingt `pass`, `password`, `token` → `***`.
6. **`process.exit()` außerhalb der bin/-Schicht aufrufen.**
7. **Den MCP-SDK-Typen vertrauen, ohne mit Zod nachzuvalidieren.**
8. **Phasen-Sprünge.** Wenn `phase-1-fragerunde.md` noch offene Entscheidungen hat, kein Code schreiben.

---

## Wenn du unsicher bist

- Tool-Inputs/Verhalten unklar? → README ist der Vertrag.
- Tool-Output-Struktur unklar? → `output-shapes.md` ist der Vertrag.
- Welche Tools existieren? → `tools-checklist.md`.
- Architektur-Frage unklar? → Diese Datei.
- Phasen-Status unklar? → `phases.md`.
- Designentscheidung offen? → User fragen, niemals raten.

---

## Datei-Übersicht im Repo

Legende: ✅ existiert · 🔜 entsteht in genannter Phase

| Datei | Status | Was sie ist |
|---|---|---|
| `README.md` | ✅ | Human-Facing-Doku, Tool-Vertrag |
| `AGENTS.md` (diese Datei) | ✅ | Coding-Agent-Vorgaben |
| `llms.txt` | ✅ | LLM-Konsumenten-Doku (Install/Setup/Tools maschinen-optimiert) |
| `tools-checklist.md` | ✅ | Abhakbare Implementierungs-Liste aller 36 Tools |
| `output-shapes.md` | ✅ | Verbindliche Output-Struktur jedes Tools |
| `phases.md` | ✅ | Phasen-Tracker |
| `phase-0-marktanalyse.md` | ✅ | Existenzgrund-Beweis |
| `phase-1-fragerunde.md` | ✅ | Designentscheidungen Phase 1 |
| `phase-2..5-*.md` | 🔜 ab Phase 2 | Detail-Pläne der technischen Phasen |
| `LICENSE` | 🔜 vor Phase 5 | Lizenz (TBD, hartes Gate) |
| `CONTRIBUTING.md` | 🔜 Phase 2 | Workflow für Menschen |
| `SECURITY.md` | 🔜 Phase 2 | Vulnerability-Reporting |
| `CHANGELOG.md` | 🔜 Phase 2 | Releases (Keep-a-Changelog-Format) |
| `.env.example` | 🔜 Phase 2 | Vorlage für Single-Account-Env-Setup |
| `config.example.toml` | 🔜 Phase 2 | Vorlage für Multi-Account-Config |
| `docs/clients.md` | 🔜 Phase 2 | Client-Config-Snippets (Cursor, Windsurf, VS Code, …) |
| `docs/provider-matrix.md` | 🔜 Phase 4 | Ergebnisse der Provider-Smoke-Tests |
| `src/` | 🔜 Phase 3 | Sourcecode (siehe Architektur oben) |
| `test/` | 🔜 Phase 3 | Tests |
