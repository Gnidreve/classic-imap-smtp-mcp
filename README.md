# classic-imap-smtp-mcp

> A complete IMAP/SMTP MCP server for AI assistants. Everything a good email client does — and nothing beyond.

[![npm version](https://img.shields.io/npm/v/@gnidreve/classic-imap-smtp-mcp.svg?style=flat-square)](https://www.npmjs.com/package/@gnidreve/classic-imap-smtp-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@gnidreve/classic-imap-smtp-mcp.svg?style=flat-square)](https://www.npmjs.com/package/@gnidreve/classic-imap-smtp-mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/Gnidreve/classic-imap-smtp-mcp/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/Gnidreve/classic-imap-smtp-mcp/actions)

---

**classic-imap-smtp-mcp** connects any IMAP/SMTP mailbox to an AI assistant via the [Model Context Protocol](https://modelcontextprotocol.io). It runs locally, supports multiple accounts, and provides 36 tools for reading, writing, and managing email — nothing more, nothing less.

## Quick Start

```bash
npx @gnidreve/classic-imap-smtp-mcp
```

Set environment variables `CLASSIC_IMAP_SMTP_USER`, `CLASSIC_IMAP_SMTP_PASS`, `CLASSIC_IMAP_SMTP_IMAP_HOST`, and `CLASSIC_IMAP_SMTP_SMTP_HOST` to connect your mailbox.

Full installation instructions: [`docs/install.md`](docs/install.md)

---

## Documentation

| If you want to… | Read |
|-----------------|------|
| Install and set up | [`docs/install.md`](docs/install.md) |
| See all 36 tools and what they do | [`docs/tools.md`](docs/tools.md) |
| Configure env vars, multi-account, CLI flags | [`docs/config.md`](docs/config.md) |
| Understand tool output structures | [`docs/output-shapes.md`](docs/output-shapes.md) |
| Get client config snippets (Cursor, Windsurf, VS Code) | [`docs/clients.md`](docs/clients.md) |
| See provider compatibility matrix | [`docs/provider-matrix.md`](docs/provider-matrix.md) |
| Set up an LLM to consume this server | [`docs/llms.txt`](docs/llms.txt) |
| Contribute code or understand architecture | [`AGENTS.md`](AGENTS.md) |
| Report a vulnerability | [`docs/SECURITY.md`](docs/SECURITY.md) |
| Read release notes | [`CHANGELOG.md`](CHANGELOG.md) |

---

## Quick Comparison

| Feature | classic-imap-smtp-mcp | Others |
|---------|----------------------|--------|
| Full mail client toolset | ✅ 36 tools | ⚠️ Partial |
| Multi-account | ✅ | ✅ Some |
| CLI feature toggles | ✅ `--readonly`, `--safe`, `--allow-tools`, `--deny-tools` | ❌ |
| Sent save via IMAP APPEND | ✅ Automatic | ❌ Most |
| Folder CRUD | ✅ | ❌ Most |
| Dedicated reply/forward | ✅ | ⚠️ |
| Scope | **Classic IMAP/SMTP only** | Varies |
| License | MIT | Varies |

---

## Why this exists

Existing MCP mail servers are either incomplete, do too much (calendar, AI triage, scheduling), or lack features like multi-account, folder management, and fine-grained tool control. This project does one thing well: **classic IMAP/SMTP** — and makes every tool available through conditional registration so you control exactly what your AI assistant can do.

---

## License

MIT — see [`LICENSE`](LICENSE).
