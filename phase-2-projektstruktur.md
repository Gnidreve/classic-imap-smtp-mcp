# Phase 2 — Projektstruktur

**Status:** ✅ Skelett angelegt (SDK v1.x verdrahtet, bootet konzeptionell, kompiliert lokal noch nicht verifiziert — siehe unten)

## Was in dieser Phase entstanden ist

Das vollständige Repo-Skelett unter `repo/`. Jede Datei trägt oben einen Einzeiler, was hineingehört. Stand:

- **Lauffähiges SDK-Fundament (v1.x):** `bin/main.ts` → `server/server.ts` (McpServer + StdioServerTransport) → `server/registry.ts` (3-Stufen-Kaskade) → `tools/index.ts` (alle 36) → Tool-Stubs.
- **Vollständig implementiert (kein Stub):** Options-Parser, Registry-Kaskade (inkl. Wildcards, b-Logik, Deny-gewinnt), Error-Klassen, Logger (stderr + Sanitizer), Config-Schema, XDG-Pfade, Provider-Presets, Config-Loader (Env + TOML + Permission-Check), Server-Bootstrap, Fail-fast.
- **Stubs (Phase 3):** alle 36 Tool-Handler (werfen "not implemented"), beide Connection-Pools, die lib-Helper (mime, search-builder, threading, sent-folder).
- **Ein Beispiel-Unit-Test** (`server/registry.test.ts`) zeigt das Test-Pattern und deckt die Kaskaden-Logik ab.

## SDK-Entscheidung

`@modelcontextprotocol/sdk` **v1.x** (`^1.29.0`), nicht v2. v2 ist zum Zeitpunkt der Anlage pre-alpha; das offizielle Repo empfiehlt v1.x für Production. Import-Pfade: `@modelcontextprotocol/sdk/server/mcp.js` und `/server/stdio.js`. Tool-Registrierung via `server.registerTool(name, { description, inputSchema }, handler)`.

## Wichtiger Hinweis zur Verifikation

Das Skelett wurde **strukturell** geprüft (Klammern-Balance, ESM-Import-Pfade mit `.js`, Tool-Count 36, Index-Vollständigkeit), aber **nicht kompiliert** — die Build-Umgebung hatte kein Netzwerk, also kein `npm install`. **Erster Schritt in Phase 3 / Claude Code:**

```bash
cd repo
pnpm install
pnpm typecheck   # erwartete Stolpersteine unten
pnpm test        # registry.test.ts sollte grün sein
pnpm dev         # bootet den Server (Tools werfen "not implemented")
```

### Erwartbare Stolpersteine beim ersten `pnpm install` / `typecheck`

1. **Dependency-Versionen** sind als `^`-Ranges gesetzt, teils geschätzt (z. B. `imapflow`, `smol-toml`). Beim Install ggf. auf die real neuesten Versionen anheben.
2. **SDK-API-Drift:** `registerTool`-Signatur und der genaue Typ des Rückgabe-`content` gegen die installierte v1.x-Version prüfen (Doku: ts.sdk.modelcontextprotocol.io). Falls das SDK ein `inputSchema` als Zod-Shape statt Zod-Objekt erwartet, im `server.ts` und in den Tool-Defs angleichen.
3. **`exactOptionalPropertyTypes: true`** ist streng — die optionalen Felder in `config/schema.ts` und `loader.ts` können kleine Anpassungen brauchen (z. B. `?? undefined` vermeiden, Felder ganz weglassen statt `undefined` setzen).
4. **pino-Transport auf stderr:** Die `createLogger`-Konstruktion (destination fd 2 vs. transport) gegen die installierte pino-Version verifizieren — die Transport-API hat sich zwischen pino-Versionen bewegt.
5. **`verbatimModuleSyntax`** verlangt `import type` für reine Typ-Importe — beim Build zeigt der Compiler, wo nachzuziehen ist.

Keiner dieser Punkte ist strukturell — es sind die normalen Reibungspunkte zwischen geschätzten Versionen und echter Installation. Die Architektur steht.

## Repo-Inventar

```
repo/
├── package.json            # Deps (SDK v1.x, imapflow, nodemailer, mailparser, pino, smol-toml, zod), scripts, bin
├── tsconfig.json           # strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes + verbatimModuleSyntax
├── tsup.config.ts          # Build → dist/, ESM, node20, Shebang
├── biome.json              # Lint/Format, noConsoleLog=error
├── vitest.config.ts        # Unit-Tests
├── vitest.integration.config.ts
├── lefthook.yml            # pre-commit: lint + typecheck
├── Dockerfile              # Phase 5/v2.x Gerüst
├── docker-compose.test.yml # Dovecot + Mailpit für Integration
├── .gitignore .editorconfig .npmrc
├── .github/
│   ├── workflows/ci.yml        # typecheck/lint/test/build
│   ├── workflows/nightly.yml   # Integration nightly + main
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── src/
│   ├── bin/main.ts             # CLI-Entry, Boot, Fail-fast, Subcommand-Dispatch
│   ├── server/
│   │   ├── server.ts           # McpServer-Aufbau, Tool-Registrierung (SDK v1.x)
│   │   ├── registry.ts         # 3-Stufen-Kaskade ✅ implementiert
│   │   ├── registry.test.ts    # Beispiel-Unit-Test ✅
│   │   ├── options.ts          # CLI-Arg-Parser ✅
│   │   └── logging.ts          # pino → stderr + Sanitizer ✅
│   ├── config/
│   │   ├── schema.ts           # Zod-Schemas ✅
│   │   ├── loader.ts           # Env + TOML + Permission-Check ✅
│   │   ├── xdg.ts              # XDG-Pfade ✅
│   │   └── providers.ts        # 10 Provider-Presets ✅
│   ├── connections/
│   │   ├── imap-pool.ts        # Stub (Phase 3)
│   │   └── smtp-pool.ts        # Stub (Phase 3)
│   ├── lib/
│   │   ├── errors.ts           # Error-Klassen + Codes ✅
│   │   ├── mime.ts             # Stub (Phase 3)
│   │   ├── search-builder.ts   # Stub (Phase 3)
│   │   ├── threading.ts        # Stub (Phase 3)
│   │   └── sent-folder.ts      # Stub (Phase 3)
│   └── tools/
│       ├── _types.ts           # ToolDefinition + ToolContext ✅
│       ├── index.ts            # sammelt alle 36 ✅
│       ├── imap-read/          # 12 Stubs
│       ├── imap-write/         # 8 Stubs
│       ├── imap-mailbox/       # 5 Stubs
│       ├── smtp/               # 5 Stubs
│       ├── account/            # 4 Stubs
│       └── meta/               # 2 Stubs
├── test/
│   ├── integration/            # Phase 3/4
│   └── mocks/                  # Phase 3
└── docs/
    ├── clients.md
    └── provider-matrix.md      # Phase 4 ausfüllen
```

(Die Planungs-Markdowns README/AGENTS/llms.txt/phases/phase-0/1/tools-checklist/output-shapes liegen ebenfalls im Repo-Root.)

## Nächster Schritt: Phase 3

`pnpm install` + die fünf Stolpersteine abräumen, dann Tool-Implementierung in der Reihenfolge aus `tools-checklist.md`: Connection-Layer zuerst, dann Meta + account_list, dann IMAP-Read, Write, Folder-CRUD, SMTP, zuletzt Account-Mutation. Jedes Tool: Zod-Schema (gemäß README-Inputs) → Handler → Output gemäß `output-shapes.md` → Unit-Test → Integration-Test.
