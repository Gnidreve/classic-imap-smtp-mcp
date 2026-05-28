# Installation & Setup

<a href="../README.md#-documentation-index">← Back to Index</a>

## Quick Start (Single Account)

> [!TIP]
> For Gmail, Outlook, iCloud, Fastmail, Posteo, mailbox.org, GMX, web.de, Yahoo, and ProtonMail Bridge, `USERNAME` + `PASSWORD` is all you need — hosts are auto-detected.

```json
{
  "mcpServers": {
    "mail": {
      "command": "npx",
      "args": ["-y", "@gnidreve/classic-imap-smtp-mcp"],
      "env": {
        "USERNAME": "you@example.com",
        "PASSWORD": "your-app-password",
        "IMAP_HOST": "imap.example.com",
        "IMAP_PORT": "993",
        "SMTP_HOST": "smtp.example.com",
        "SMTP_PORT": "465"
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
  -e IMAP_HOST=imap.example.com \
  -e SMTP_HOST=smtp.example.com \
  -e USERNAME=you@example.com \
  -e PASSWORD=your-app-password \
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
