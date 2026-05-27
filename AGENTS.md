# AGENTS.md

**Audience:** Coding agents (Claude Code, Cursor, Codex, etc.) actively working on the `classic-imap-smtp-mcp` repository.

If you are a *consuming* LLM tasked with installing or using this server for an end user, read [`llms.txt`](llms.txt) instead.

If you are a human trying to understand the project, read [`README.md`](README.md).

---

## TL;DR — what you must know before touching anything

1. **Top-down, declarative.** [`README.md`](README.md) is the contract for tool inputs, CLI flags, and config; [`output-shapes.md`](output-shapes.md) is the contract for tool outputs; [`tools-checklist.md`](tools-checklist.md) is the authoritative list of which tools exist. These three are binding.
2. **Scope discipline.** If a feature isn't in the README, it doesn't belong in the project. Never add Calendar, AI triage, reminders, or schedulers — no matter how good the idea seems.
3. **Tests are mandatory.** Every tool PR needs a unit test + (where feasible) integration test against a local Dovecot/Mailpit.

---

## Project Identity (fixed)

- **Name:** `classic-imap-smtp-mcp` (final)
- **Language:** TypeScript (final)
- **Runtime:** Node ≥ 20 (LTS)
- **Distribution:** npm package with `bin` entry, executable via `npx @gnidreve/classic-imap-smtp-mcp`
- **Transport:** stdio only — no HTTP/SSE, no web server
- **License:** MIT

---

## Architecture

### Layers (top → bottom)

```
src/
├── bin/
│   └── main.ts             # CLI entry, arg parsing, boot (command name: classic-imap-smtp-mcp)
├── server/
│   ├── server.ts           # MCP server setup, conditional tool registration
│   ├── registry.ts         # 3-stage cascade: feature flags → allow → deny
│   └── logging.ts          # stderr logger, never stdout (stdout = MCP protocol)
├── config/
│   ├── schema.ts           # Zod schemas for config file and env vars
│   ├── loader.ts           # TOML loading, env var merge, validation
│   ├── xdg.ts              # Cross-platform XDG paths
│   └── providers.ts        # Provider auto-detection (Gmail, Outlook, IONOS, …)
├── connections/
│   ├── imap-pool.ts        # Imapflow wrapper, reconnect, lifecycle
│   └── smtp-pool.ts        # Nodemailer transport, pooling
├── tools/
│   ├── _types.ts           # Shared types, tool definition interface
│   ├── imap-read/          # 12 tools, one file each
│   ├── imap-write/         # 8 tools
│   ├── imap-mailbox/       # 5 tools (folder CRUD)
│   ├── smtp/               # 5 tools
│   ├── account/            # 4 tools (account management)
│   └── meta/               # 2 tools (server introspection)
├── lib/
│   ├── mime.ts             # mailparser wrapper, attachment decoding
│   ├── search-builder.ts   # IMAP SEARCH criteria → imapflow query
│   ├── threading.ts        # In-Reply-To / References walk
│   └── errors.ts           # Structured error types
└── index.ts                # Library export (optional, for tests)
```

### Layer rules

- **`bin/` and `server/`** may import anything.
- **`tools/`** may import `connections/`, `lib/`, `config/`, `_types.ts` — never `server/`.
- **`connections/`** may import `lib/` and `config/`.
- **`config/`** and **`lib/`** are leaf modules — no cross-imports between them except types.
- Each tool is its own file with a default export of a `ToolDefinition`. One file = one tool. No barrel modules.

### Tool Definition Interface

```ts
// src/tools/_types.ts
export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;                          // e.g. "imap_list_mailboxes"
  description: string;                   // for MCP tools/list
  category: ToolCategory;                // imap-read | imap-write | imap-mailbox | smtp | account | meta
  inputSchema: ZodType<TInput>;
  outputShape?: ZodType<TOutput>;        // optional, for inspection
  handler: (input: TInput, ctx: ToolContext) => Promise<TOutput>;
}
```

`ToolContext` holds the loaded config, account resolver, and connection pools — never globals.

### Conditional Tool Registration — 3-Stage Cascade

`src/server/registry.ts` is the single place that decides which tools are registered at startup. The cascade runs coarse-to-fine; **the finer the stage, the higher the priority.**

1. **Feature flags (coarse):** `--safe`, `--readonly`, `--no-imap`, `--no-smtp` define the base set.
2. **`--allow-tools` (medium):** overrides feature flags — explicitly brings tools back that a coarse gesture disabled. Without feature flags it acts as a whitelist.
3. **`--deny-tools` (fine):** wins over everything, including allow.

Allow and deny support **prefix wildcards** (`imap_*`, `account_*`, `imap_delete_*`, …).

```ts
function resolveActiveTools(all: ToolDefinition[], opts: ResolvedOptions): ToolDefinition[] {
  // Stage 1: coarse base set from feature flags
  let active = new Set(
    all.filter((t) => passesFeatureFlags(t, opts)).map((t) => t.name),
  );

  // Stage 2: Allow overrides feature flags (can widen)
  if (opts.allowTools?.length) {
    for (const tool of all) {
      if (matchesAny(tool.name, opts.allowTools)) active.add(tool.name);
    }
  }

  // Stage 3: Deny wins over everything
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
  if (opts.readonly && !READONLY_TOOLS.has(t.name)) return false;
  if (opts.safe && DELETE_TOOLS.has(t.name)) return false;
  return true;
}

function matchesAny(name: string, patterns: string[]): boolean {
  return patterns.some((p) =>
    p.endsWith("*") ? name.startsWith(p.slice(0, -1)) : name === p,
  );
}
```

**Fail-fast:** If `--no-imap` **and** `--no-smtp` are both set, the server aborts at startup with a stderr message and exit code ≠ 0 — this is almost certainly a config mistake.

The `READONLY_TOOLS` and `DELETE_TOOLS` constants are hardcoded and match `tools-checklist.md` 1:1.

---

## Code Conventions

- **TypeScript strict.** `tsconfig` with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- **No `any`.** Use `unknown` + Zod validation.
- **Async/await, no `.then` chaining** unless there's a documented performance reason.
- **Errors:** structured classes in `lib/errors.ts`. Never throw a raw `Error` — always a concrete subtype. Each error class carries a fixed `code` string (visible to the client). Binding mapping:

| Error Class | `code` (client-visible) | When |
|---|---|---|
| `AuthError` | `AUTH_FAILED` | IMAP or SMTP login failed |
| `MailboxNotFoundError` | `MAILBOX_NOT_FOUND` | Folder does not exist |
| `UidNotFoundError` | `UID_NOT_FOUND` | Message UID does not exist in folder |
| `AttachmentNotFoundError` | `ATTACHMENT_NOT_FOUND` | Part ID / filename not found in message |
| `AccountNotFoundError` | `ACCOUNT_NOT_FOUND` | `account` parameter refers to unconfigured account |
| `RateLimitError` | `RATE_LIMITED` | Token bucket exhausted |
| `TlsError` | `TLS_ERROR` | Certificate / TLS handshake problem |
| `ConfigError` | `CONFIG_ERROR` | Config missing / invalid, or account mutation without config file |
| `PermissionError` | `PERMISSION_DENIED` | Config file permissions too open, or tool not allowed in active mode |
| `ImapProtocolError` | `IMAP_PROTOCOL_ERROR` | Other IMAP server error (with `imap_response` detail) |
| `SmtpRelayError` | `SMTP_RELAY_ERROR` | SMTP relay / delivery rejected |

This list is the single source of truth for error codes. README and llms.txt reference it but do not duplicate it.
- **Logging:** exclusively via `server/logging.ts` → stderr. **Never `console.log`**, as that would corrupt the MCP protocol on stdout.
- **No global variables.** Everything via dependency injection through `ToolContext`.

---

## Build & Run

```bash
pnpm install               # First-time setup
pnpm typecheck             # tsc --noEmit
pnpm lint                  # Biome
pnpm test                  # Vitest, unit tests
pnpm test:integration      # Integration against local Dovecot + Mailpit (Docker)
pnpm build                 # tsup → dist/
pnpm start                 # Local run via tsx
node dist/bin/main.js      # Run production build
```

CI runs `typecheck`, `lint`, `test`, `build` on every PR. Integration tests run nightly + on `main`.

---

## Tests

### Unit Tests
- Each tool has a `*.test.ts` file right next to it.
- IMAP/SMTP connections are mocked (see `test/mocks/`).
- Coverage target: ≥ 85 % for `tools/`, ≥ 70 % overall.

### Integration Tests
- Directory `test/integration/`.
- `docker-compose.test.yml` starts:
  - **Dovecot** (IMAP) with two test accounts + initial mailbox structure (INBOX, Sent, Drafts, Archive, custom folder)
  - **Mailpit** (SMTP) as sender + inspector
- Tests against a real IMAP server verify: SEARCH operators, FETCH parts, MOVE/COPY semantics, APPEND, flag STORE, folder CRUD.

### Provider Smoke Tests (manual)
- Test matrix against Gmail, Outlook, iCloud, mailbox.org, Posteo, GMX, web.de, ProtonMail Bridge.
- Results documented in `docs/provider-matrix.md`.

---

## PR Checklist

Before proposing a PR:

- [ ] Tool definition matches the schema defined in `README.md` 1:1
- [ ] Own file per tool, correct layer
- [ ] Zod schema for input
- [ ] Structured error type for error paths
- [ ] Unit test present
- [ ] Integration test where the tool runs against real IMAP/SMTP
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green
- [ ] README updated *if* tool behavior changed
- [ ] No logging to stdout
- [ ] No new dependencies without justification in PR description

---

## What you must **never** do

1. **Use stdout for anything except the MCP protocol.** Even a single `console.log("hello")` during tool loading breaks the client connection.
2. **Introduce global singletons.** Connection pools, config — everything via context.
3. **Add features not listed in the README.** AI heuristics, auto-categorization, scheduling, calendar, notifications. Never.
4. **Implement OAuth2 / XOAUTH2.** Not even "experimentally." This MCP is classic IMAP/SMTP — user/pass + app password + STARTTLS/SSL. Period. Permanent.
5. **Log credentials anywhere, even at debug level.** Sanitizer in `logging.ts` forces `pass`, `password`, `token` → `***`.
6. **Call `process.exit()` outside the `bin/` layer.**
7. **Trust MCP SDK types without re-validating with Zod.**
8. **Write code while design decisions are still open** — ask the user first.

---

## When in doubt

- Tool inputs/behavior unclear? → README is the contract.
- Tool output structure unclear? → `output-shapes.md` is the contract.
- Which tools exist? → `tools-checklist.md`.
- Architecture question unclear? → This file.
- Design decision open? → Ask the user, never guess.

---

## File Overview in Repo

| File | Status | What it is |
|---|---|---|
| `README.md` | ✅ | Human-facing docs, tool contract |
| `AGENTS.md` (this file) | ✅ | Coding agent guidelines |
| `llms.txt` | ✅ | LLM consumer docs (install/setup/tools, machine-optimized) |
| `tools-checklist.md` | ✅ | Checkbox implementation list for all 36 tools |
| `output-shapes.md` | ✅ | Binding output structure for every tool |
| `CONTRIBUTING.md` | ✅ | Human contributor workflow |
| `SECURITY.md` | ✅ | Vulnerability reporting |
| `CHANGELOG.md` | ✅ | Release notes (Keep a Changelog format) |
| `docs/clients.md` | ✅ | Client config snippets (Cursor, Windsurf, VS Code, …) |
| `docs/provider-matrix.md` | 🔜 | Provider smoke test results |
| `LICENSE` | ✅ | MIT |
| `src/` | ✅ | Source code (see architecture above) |
| `test/` | ✅ | Tests |
