# Configuration

## Method 1: Environment Variables (Single Account)

Simplest approach. Covers 90 % of users.

| Variable | Required | Default | Description |
|---|---|---|---|
| `CLASSIC_IMAP_SMTP_USER` | ✅ | — | Email address / IMAP login |
| `CLASSIC_IMAP_SMTP_PASS` | ✅ | — | Password or app password |
| `CLASSIC_IMAP_SMTP_IMAP_HOST` | ✅ | — | IMAP hostname |
| `CLASSIC_IMAP_SMTP_IMAP_PORT` | | `993` | IMAP port |
| `CLASSIC_IMAP_SMTP_IMAP_TLS` | | `true` | TLS (`true` = implicit, `starttls`, `false` = plain) |
| `CLASSIC_IMAP_SMTP_SMTP_HOST` | ✅ | — | SMTP hostname |
| `CLASSIC_IMAP_SMTP_SMTP_PORT` | | `465` | SMTP port |
| `CLASSIC_IMAP_SMTP_SMTP_TLS` | | `true` | TLS mode (same as IMAP) |
| `CLASSIC_IMAP_SMTP_FROM_NAME` | | — | Display name when sending |
| `CLASSIC_IMAP_SMTP_VERIFY_TLS` | | `true` | Verify certificate |

For Gmail, Outlook, iCloud, Fastmail, Posteo, mailbox.org, GMX, web.de, Yahoo, ProtonMail Bridge, setting `CLASSIC_IMAP_SMTP_USER` + `CLASSIC_IMAP_SMTP_PASS` is enough — host and port are auto-detected.

## Method 2: Config File (Multi-Account)

Path (XDG-compliant):
- Linux/macOS: `~/.config/classic-imap-smtp-mcp/config.toml`
- Windows: `%APPDATA%\classic-imap-smtp-mcp\config.toml`

```toml
default_account = "personal"

[[accounts]]
name = "personal"
user = "you@gmail.com"
pass = "your-app-password"
from_name = "Your Name"
# Host/port via provider auto-detect

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
verify_tls = false  # self-signed certificates
```

With multiple accounts, each tool accepts an optional `account` parameter. Defaults to the account named in `default_account`.

## Method 3: Hybrid Mode

Environment variables override config file values. Useful for CI/container environments with base config from file and sensitive values from env.

---

## Feature Flags & Tool Selection

classic-imap-smtp-mcp registers tools **conditionally at server start**. Unregistered tools are invisible to the client — clean capability boundaries. All switches are **CLI args** (not env vars).

### The Four Feature Flags (coarse)

| Flag | Effect |
|---|---|
| `--safe` | Disable delete operations: `imap_delete_message`, `imap_expunge`, `imap_delete_mailbox` removed. Sending, moving, marking, drafts remain. |
| `--readonly` | Read-only: all writing IMAP ops (STORE, MOVE, COPY, APPEND, folder CRUD) **and** SMTP send removed. `smtp_verify_connection` and `account_list` remain. |
| `--no-imap` | All IMAP tools removed. |
| `--no-smtp` | All SMTP tools removed. |

`--safe` and `--readonly` are combinable (`--readonly` is stricter and wins). `--no-imap` **and** `--no-smtp` together produce an empty server — this aborts at startup (almost certainly a config mistake).

### Fine-Grained Selection (Expert Mode)

Two flags with **prefix wildcards** for surgical control:

| Flag | Effect |
|---|---|
| `--allow-tools=<csv>` | Explicit tool allowlist — **overrides feature flags**. Recovers specific tools disabled by coarse flags. |
| `--deny-tools=<csv>` | Explicit deny list — **wins over everything**, including `--allow-tools`. |

Wildcards match by prefix: `imap_*`, `smtp_*`, `account_*`, `meta_*`, or finer `imap_delete_*`, `imap_bulk_*`, `imap_get_*`.

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

# Everything except account management
npx @gnidreve/classic-imap-smtp-mcp --deny-tools=account_*

# All IMAP tools except delete variants
npx @gnidreve/classic-imap-smtp-mcp --allow-tools=imap_* --deny-tools=imap_delete_*
```

---

## CLI Reference

```
classic-imap-smtp-mcp [options]

Run as MCP server over stdio (default subcommand).

Options:
  --safe               Disable delete tools
  --readonly           Read-only mode
  --no-imap            Disable all IMAP tools
  --no-smtp            Disable all SMTP tools
  --allow-tools=<list> Explicit tool allowlist (CSV, prefix wildcards)
  --deny-tools=<list>  Explicit deny list (CSV, prefix wildcards)
  --account=<name>     Default account override
  --config=<path>      Alternative config path
  --log-level=<level>  trace|debug|info|warn|error (default: info)
  --log-format=<fmt>   json|pretty (default: json)
  -h, --help           Show help
  -V, --version        Show version

Subcommands:
  init                 Write template config to XDG path
  test [account]       Test IMAP+SMTP connection
  list-tools           Dry-run: which tools would be registered?
```

---

## Security

- All connections use TLS (implicit or STARTTLS, per config)
- Passwords are never logged
- Recommendation: **app passwords** instead of account passwords (Gmail, Outlook, iCloud support this)
- Config file should have `0600` permissions (classic-imap-smtp-mcp warns about overly open permissions)
- Attachment downloads are capped at a configurable maximum size
- `CLASSIC_IMAP_SMTP_VERIFY_TLS=false` is intended for self-signed internal servers only — logged as a warning
