# Installation & Setup

<a href="../README.md#-documentation-index">← Back to Index</a>

## Quick Start (Single Account)

```json
{
  "mcpServers": {
    "mail": {
      "command": "npx",
      "args": ["-y", "@gnidreve/classic-imap-smtp-mcp"],
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

Place this in your MCP client config:
- **Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) / `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **VS Code / Cursor / Windsurf:** analogous MCP config file

### Claude Code

```bash
claude mcp add mail \
  -e CLASSIC_IMAP_SMTP_IMAP_HOST=imap.example.com \
  -e CLASSIC_IMAP_SMTP_SMTP_HOST=smtp.example.com \
  -e CLASSIC_IMAP_SMTP_USER=you@example.com \
  -e CLASSIC_IMAP_SMTP_PASS=your-app-password \
  -- npx -y @gnidreve/classic-imap-smtp-mcp
```

## Client-Specific Snippets

See [`docs/clients.md`](clients.md) for Cursor, Windsurf, VS Code, and other client configurations.

## Multi-Account Setup

See [`docs/config.md`](config.md) for config file and multi-account setup.

## Verify It Works

After starting the server, ask your AI assistant:

> "List my email folders"

This triggers `imap_list_mailboxes`. If you see your mailbox folders, everything is connected.

---

<a href="config.md">Next: Configuration →</a>
