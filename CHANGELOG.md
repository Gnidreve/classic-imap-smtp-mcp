# Changelog

<a href="README.md#-documentation-index">← Back to Index</a>

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] — 2026-05-27

### Fixed

- **fetchOne sends UID FETCH instead of FETCH.** All tools using `fetchOne()` or `fetch()`
  (imap_get_message, imap_get_message_raw, imap_get_message_headers, imap_get_messages_bulk,
  imap_download_attachment, smtp_reply, smtp_forward) were sending sequence-number-based
  `FETCH` commands, causing `UID_NOT_FOUND` whenever the real UID differed from the
  message's sequence position. Now correctly sends `UID FETCH`.
- **status_mailbox BigInt serialization.** `uidValidity` and `uidNext` values returned
  by imapflow are `BigInt`, which `JSON.stringify` cannot serialize. Explicit `Number()`
  conversion added.

## [0.3.0] — 2026-05-22

### Added

- All 36 MCP tools implemented (IMAP: read, write, folder CRUD; SMTP: send, reply,
  forward; Account CRUD; Meta).
- Multi-account support via TOML config file (`~/.config/classic-imap-smtp-mcp/config.toml`).
- Single-account env-var mode (`CLASSIC_IMAP_SMTP_*` prefix).
- Provider presets for common mail hosts (IONOS, etc.).
- Configurable tool filtering (`--readonly`, `--allow-tools`, `--deny-tools`).
- `imap_messages_bulk` for fetching multiple messages in a single IMAP call.
- `imap_get_thread` for reconstructing conversation trees via In-Reply-To/References.
- Auto-detect provider from email domain, defaults for IMAP/SMTP host and TLS.
- Connection pool with exponential-backoff reconnect and idle timeout.

[0.3.1]: https://github.com/Gnidreve/classic-imap-smtp-mcp/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Gnidreve/classic-imap-smtp-mcp/releases/tag/v0.3.0
