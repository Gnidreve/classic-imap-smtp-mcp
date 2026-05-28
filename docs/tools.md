# Tool Reference

<a href="../README.md#-documentation-index">← Back to Index</a> · <a href="config.md">← Previous: Configuration</a>

classic-imap-smtp-mcp registers between 16 (`--readonly`) and 36 (default) tools depending on mode and flags.

## IMAP — Read (12 tools)

| Tool | What it does |
|---|---|
| `imap_list_mailboxes` | Enumerate folders with special-use flags (RFC 6154) |
| `imap_status_mailbox` | Counts (unread, total, recent) without SELECT |
| `imap_list_messages` | Paginated list in a folder (UID, envelope, flags, size) |
| `imap_get_message` | Full message with parsed body + attachment metadata |
| `imap_get_message_headers` | Headers only |
| `imap_get_message_raw` | RFC-822 raw source |
| `imap_get_messages_bulk` | Up to N UIDs in one call |
| `imap_search` | Full SEARCH builder (all RFC 3501 criteria) |
| `imap_download_attachment` | Extract a specific MIME part |
| `imap_get_thread` | Reconstruct conversation via In-Reply-To/References |
| `imap_get_quota` | RFC 2087 QUOTA |
| `imap_check_capabilities` | Server CAPABILITY list |

## IMAP — Write (8 tools)

| Tool | What it does |
|---|---|
| `imap_mark_message` | STORE flags (\Seen, \Flagged, \Answered, \Deleted, keywords) |
| `imap_bulk_mark` | Bulk STORE over multiple UIDs |
| `imap_move_message` | MOVE (RFC 6851), fallback COPY+EXPUNGE |
| `imap_copy_message` | COPY |
| `imap_bulk_move` | Bulk MOVE over multiple UIDs |
| `imap_append_message` | APPEND (save drafts, import messages) |
| `imap_expunge` | EXPUNGE |
| `imap_delete_message` | STORE \Deleted + optional EXPUNGE |

## IMAP — Folder Management (5 tools)

| Tool | What it does |
|---|---|
| `imap_create_mailbox` | Create new folder |
| `imap_delete_mailbox` | Delete folder |
| `imap_rename_mailbox` | Rename folder |
| `imap_subscribe_mailbox` | SUBSCRIBE |
| `imap_unsubscribe_mailbox` | UNSUBSCRIBE |

## SMTP (5 tools)

| Tool | What it does |
|---|---|
| `smtp_send` | Send with all options (to/cc/bcc, text+html, attachments, inline images, custom headers). Auto-saves copy to Sent folder (`save_to_sent`, default `true`). |
| `smtp_reply` | Reply with correct In-Reply-To/References chain (takes original UID + folder). Sent save like `smtp_send`. |
| `smtp_forward` | Forward with original quoted or as attachment. Sent save like `smtp_send`. |
| `smtp_verify_connection` | Connection health check |
| `smtp_send_raw` | Send pre-formatted RFC-822. Sent save like `smtp_send`. |

### Sent Save Behavior

SMTP only delivers — it does not place a copy in your "Sent" folder. Email clients handle this by writing a copy via IMAP after sending. The send tools do this automatically (`save_to_sent`, default `true`). The Sent folder is found via the `\Sent` special-use flag (falls back to common names, or explicit via `sent_mailbox`).

**Important:** Send and save are separate. If sending succeeds but the save fails (e.g. Sent folder missing), the email was still delivered. The tool reports success with `saved_to_sent: false` + details. There is **no outbox or retry queue** — a failed send is reported immediately, not queued.

## Account Management (4 tools)

| Tool | What it does |
|---|---|
| `account_list` | List configured accounts (credentials masked) |
| `account_add` | Add account to config |
| `account_update` | Modify existing account (e.g. new app password) |
| `account_delete` | Remove account from config |

## Meta — Server Introspection (2 tools)

| Tool | What it does |
|---|---|
| `meta_health` | IMAP + SMTP reachability, latency, capabilities |
| `meta_server_info` | Active tools, active mode, version |

**Full parameter documentation** is available via `classic-imap-smtp-mcp --help` and the JSON schemas exposed in the MCP inspector. Binding output structures for every tool are documented in [`docs/output-shapes.md`](output-shapes.md).

---

<a href="output-shapes.md">Next: Output Structures →</a>
