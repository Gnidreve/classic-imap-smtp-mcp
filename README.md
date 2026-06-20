# classic-imap-smtp-mcp

> A complete IMAP/SMTP MCP server for AI assistants. Everything a good email client does — and nothing beyond.

[![npm version](https://img.shields.io/npm/v/@gnidreve/classic-imap-smtp-mcp.svg?style=flat-square)](https://www.npmjs.com/package/@gnidreve/classic-imap-smtp-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@gnidreve/classic-imap-smtp-mcp.svg?style=flat-square)](https://www.npmjs.com/package/@gnidreve/classic-imap-smtp-mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/Gnidreve/classic-imap-smtp-mcp/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/Gnidreve/classic-imap-smtp-mcp/actions)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-181717?style=flat-square&logo=github)](https://github.com/Gnidreve/classic-imap-smtp-mcp)
[![Codeberg](https://img.shields.io/badge/Codeberg-Mirror-2185D0?style=flat-square&logo=codeberg)](https://codeberg.org/Gnidreve/classic-imap-smtp-mcp)
[![GitLab](https://img.shields.io/badge/GitLab-Mirror-FC6D26?style=flat-square&logo=gitlab)](https://gitlab.com/Gnidreve/classic-imap-smtp-mcp)

---

**classic-imap-smtp-mcp** connects any IMAP/SMTP mailbox to an AI assistant via the [Model Context Protocol](https://modelcontextprotocol.io). It runs locally, supports multiple accounts, and provides 36 tools for reading, writing, and managing email — nothing more, nothing less.

It can run either over classic `stdio` for local MCP clients or over HTTP with Streamable MCP plus a legacy SSE compatibility endpoint for container deployments.

## Quick Start

```bash
npx @gnidreve/classic-imap-smtp-mcp
```

For container or remote MCP setups:

```bash
npx @gnidreve/classic-imap-smtp-mcp --transport=http --http-host=0.0.0.0 --http-port=3000
```

Set environment variables `USERNAME` and `PASSWORD` to connect your mailbox:

```bash
export USERNAME=you@example.com
export PASSWORD=your-app-password
```

> [!TIP]
> For most providers (Gmail, Outlook, iCloud, etc.) that's all you need — IMAP/SMTP hosts are auto-detected. If you need custom hosts or want to avoid collisions, see [`docs/config.md`](docs/config.md).

Full installation instructions: [`docs/install.md`](docs/install.md)

> [!NOTE]
> With multiple accounts, each tool accepts an optional `account` parameter. Defaults to the account named in `default_account`.

> [!NOTE]
> `--safe` and `--readonly` are combinable (`--readonly` is stricter and wins).
> `--no-imap` and `--no-smtp` together produce an empty server — this aborts at startup (almost certainly a config mistake).

> [!TIP]
> Wildcards match by prefix: `imap_*`, `smtp_*`, `account_*`, `meta_*`, or finer `imap_delete_*`, `imap_bulk_*`, `imap_get_*`.

---

## 📚 Documentation Index

### 🚀 Getting Started

- **[Installation](docs/install.md)** — Set up the server in 60 seconds with `npx` and your mailbox credentials
- **[Configuration](docs/config.md)** — Environment variables, multi-account via TOML, CLI flags & tool filters

### 📖 Reference

- **[All 36 Tools](docs/tools.md)** — Complete tool reference with parameters
- **[Output Structures](docs/output-shapes.md)** — What every tool returns (types, fields, examples)
- **[Provider Matrix](docs/provider-matrix.md)** — IMAP/SMTP host presets for 10+ mail providers

### 🛠️ Guides

- **[Client Setup](docs/clients.md)** — Config snippets for Cursor, Windsurf, VS Code, Claude Code
- **[Comparison](docs/comparison.md)** — How this MCP compares to other mail servers

### 📄 Project

- **[Roadmap](docs/ROADMAP.md)** — Development phases from 0.3 to 1.0
- **[Contributing](docs/CONTRIBUTING.md)** — Architecture, code style, how to contribute
- **[Security](docs/SECURITY.md)** — Report vulnerabilities responsibly
- **[Changelog](CHANGELOG.md)** — Full release history

### 🤖 For LLM Agents

- **[`llms.txt`](docs/llms.txt)** — Machine-readable guide for AI assistants to consume this server
- **[`AGENTS.md`](AGENTS.md)** — Technical architecture documentation for AI agents

---

## Why this exists

Existing MCP mail servers are either incomplete, do too much (calendar, AI triage, scheduling), or lack features like multi-account, folder management, and fine-grained tool control. This project does one thing well: **classic IMAP/SMTP** — and makes every tool available through conditional registration so you control exactly what your AI assistant can do.

---

## License

MIT — see [`LICENSE`](LICENSE).
