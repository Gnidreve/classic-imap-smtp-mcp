# Configuration

<a href="../README.md#-documentation-index">← Back to Index</a> · <a href="install.md">← Previous: Installation</a>

## Environment Variables (Single Account)

classic-imap-smtp-mcp is configured **exclusively** through environment variables.

> [!NOTE]
> This is the **new simplified** naming. The old `CLASSIC_IMAP_SMTP_*` names still work as a fallback. See [Legacy Names](#legacy-names) below.

| Variable | Required | Default | Description |
|---|---|---|---|
| `USERNAME` | ✅ | — | Email address / IMAP login |
| `PASSWORD` | ✅ | — | Password or app password |
| `FROM_NAME` | | — | Display name when sending |
| `IMAP_HOST` | | auto | IMAP hostname |
| `IMAP_PORT` | | `993` | IMAP port |
| `IMAP_TLS` | | `true` | TLS (`true` = implicit, `starttls`, `false` = plain) |
| `SMTP_HOST` | | auto | SMTP hostname |
| `SMTP_PORT` | | `465` | SMTP port |
| `SMTP_TLS` | | `true` | TLS mode (same as IMAP) |
| `VERIFY_TLS` | | `true` | Verify certificate |

> [!TIP]
> For Gmail, Outlook, iCloud, Fastmail, Posteo, mailbox.org, GMX, web.de, Yahoo, ProtonMail Bridge, setting only `USERNAME` + `PASSWORD` is enough — host and port are auto-detected.

> [!TIP]
> To send from a verified alias/send-as address (e.g. Gmail "Send mail as"), pass the optional `from` parameter on `smtp_send`/`smtp_reply`/`smtp_forward` instead of a static env var — whether it is accepted depends on the provider verifying the alias.

### Collision Handling

If `USERNAME`, `PASSWORD`, or other bare names collide with existing environment variables, prefix all of them with `CLASSIC_`:

```bash
export CLASSIC_USERNAME=you@gmail.com
export CLASSIC_PASSWORD=your-app-password
```

### Legacy Names

The old `CLASSIC_IMAP_SMTP_*` env vars continue to work as a fallback:

| New Name | New Prefixed | Old Prefixed (Fallback) |
|----------|-------------|------------------------|
| `USERNAME` | `CLASSIC_USERNAME` | `CLASSIC_IMAP_SMTP_USER` |
| `PASSWORD` | `CLASSIC_PASSWORD` | `CLASSIC_IMAP_SMTP_PASS` |
| `FROM_NAME` | `CLASSIC_FROM_NAME` | `CLASSIC_IMAP_SMTP_FROM_NAME` |
| `IMAP_HOST` | `CLASSIC_IMAP_HOST` | `CLASSIC_IMAP_SMTP_IMAP_HOST` |
| `IMAP_PORT` | `CLASSIC_IMAP_PORT` | `CLASSIC_IMAP_SMTP_IMAP_PORT` |
| `IMAP_TLS` | `CLASSIC_IMAP_TLS` | `CLASSIC_IMAP_SMTP_IMAP_TLS` |
| `SMTP_HOST` | `CLASSIC_SMTP_HOST` | `CLASSIC_IMAP_SMTP_SMTP_HOST` |
| `SMTP_PORT` | `CLASSIC_SMTP_PORT` | `CLASSIC_IMAP_SMTP_SMTP_PORT` |
| `SMTP_TLS` | `CLASSIC_SMTP_TLS` | `CLASSIC_IMAP_SMTP_SMTP_TLS` |
| `VERIFY_TLS` | `CLASSIC_VERIFY_TLS` | `CLASSIC_IMAP_SMTP_VERIFY_TLS` |

**Resolution order for each variable:** `CLASSIC_<NAME>` → `CLASSIC_IMAP_SMTP_<OLD>` → `<NAME>` → `<OLD>`.

---

## Feature Flags & Tool Selection

classic-imap-smtp-mcp registers tools **conditionally at server start**. Unregistered tools are invisible to the client — clean capability boundaries. All switches are **CLI args** (not env vars).

### The Four Feature Flags (coarse)

| Flag | Effect |
|---|---|
| `--safe` | Disable delete operations: `imap_delete_message`, `imap_expunge`, `imap_delete_mailbox` removed. Sending, moving, marking, drafts remain. |
| `--readonly` | Read-only: all writing IMAP ops (STORE, MOVE, COPY, APPEND, folder CRUD) **and** SMTP send removed. `smtp_verify_connection` remains. |
| `--no-imap` | All IMAP tools removed. |
| `--no-smtp` | All SMTP tools removed. |

`--safe` and `--readonly` are combinable (`--readonly` is stricter and wins). `--no-imap` **and** `--no-smtp` together produce an empty server — this aborts at startup (almost certainly a config mistake).

### Fine-Grained Selection (Expert Mode)

Two flags with **prefix wildcards** for surgical control:

| Flag | Effect |
|---|---|
| `--allow-tools=<csv>` | Explicit tool allowlist — **overrides feature flags**. Recovers specific tools disabled by coarse flags. |
| `--deny-tools=<csv>` | Explicit deny list — **wins over everything**, including `--allow-tools`. |

Wildcards match by prefix: `imap_*`, `smtp_*`, `meta_*`, or finer `imap_delete_*`, `imap_bulk_*`, `imap_get_*`.

**Cascade (coarse → fine, fine wins):**

```
1. Feature flags define the base set
2. --allow-tools overrides (can recover tools)
3. --deny-tools has the last word
```

Examples:

```bash
# Read-only, but allow sending
npx @gnidreve/classic-imap-smtp-mcp --readonly --allow-tools=smtp_send

# No SMTP, but allow just smtp_send
npx @gnidreve/classic-imap-smtp-mcp --no-smtp --allow-tools=smtp_send

# All IMAP tools except delete variants
npx @gnidreve/classic-imap-smtp-mcp --allow-tools=imap_* --deny-tools=imap_delete_*
```

---

## CLI Reference

```
classic-imap-smtp-mcp [options]

Run as MCP server over stdio (default).

Options:
  --safe               Disable delete tools
  --readonly           Read-only mode
  --no-imap            Disable all IMAP tools
  --no-smtp            Disable all SMTP tools
  --allow-tools=<list> Explicit tool allowlist (CSV, prefix wildcards)
  --deny-tools=<list>  Explicit deny list (CSV, prefix wildcards)
  --log-level=<level>  trace|debug|info|warn|error (default: info)
  --log-format=<fmt>   json|pretty (default: json)
  -h, --help           Show help
  -V, --version        Show version

Subcommands:
  test                 Test IMAP+SMTP connection
  list-tools           Dry-run: which tools would be registered?
```

---

## Security

- All connections use TLS (implicit or STARTTLS, per config)
- Passwords are never logged
- Recommendation: **app passwords** instead of account passwords (Gmail, Outlook, iCloud support this)
- Attachment downloads are capped at a configurable maximum size
- `VERIFY_TLS=false` is intended for self-signed internal servers only — logged as a warning

---

<a href="tools.md">Next: Tools →</a>
