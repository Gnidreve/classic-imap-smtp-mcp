# Tool Checklist — Implementation Reference

**Purpose:** A single checkboxable list of all 36 tools that must be implemented in `classic-imap-smtp-mcp` v1.0.

**Status convention:**
- 🔲 not started
- 🔨 in progress
- ✅ implemented + unit-tested + integration-tested (where applicable) + documented

**Who adds tools:** nobody. This list is complete. Extensions require reopening the design phase.

**Single source of truth:** This file is the authoritative list of *which* tools exist. `README.md` describes them for humans (prose), `llms.txt` for consuming LLMs (key inputs), `output-shapes.md` defines the return structures. In case of discrepancy: existence/count → this file, inputs → README, outputs → output-shapes.md. Anyone changing a tool updates all four.

---

## IMAP — Read (12 tools)

| # | Status | Tool | Description | RFC / Spec |
|---|---|---|---|---|
| 1 | ✅ | `imap_list_mailboxes` | Enumerate folders with special-use flags | RFC 3501 LIST, RFC 6154 |
| 2 | ✅ | `imap_status_mailbox` | Counts (unread/total/recent) without SELECT | RFC 3501 STATUS |
| 3 | ✅ | `imap_list_messages` | Paginated envelope list in a folder | RFC 3501 FETCH ENVELOPE |
| 4 | ✅ | `imap_get_message` | Full message including parsed body + attachment metadata | RFC 3501 FETCH BODY |
| 5 | ✅ | `imap_get_message_headers` | Headers only | RFC 3501 FETCH BODY[HEADER] |
| 6 | ✅ | `imap_get_message_raw` | RFC-822 raw source | RFC 3501 FETCH RFC822 |
| 7 | ✅ | `imap_get_messages_bulk` | Up to N UIDs in one call | RFC 3501 FETCH with range |
| 8 | ✅ | `imap_search` | Full SEARCH builder | RFC 3501 SEARCH (all criteria) |
| 9 | ✅ | `imap_download_attachment` | Extract a specific MIME part | RFC 3501 FETCH BODY[part], MIME RFC 2045-2049 |
| 10 | ✅ | `imap_get_thread` | Reconstruct conversation via In-Reply-To/References | RFC 5322 §3.6.4 |
| 11 | ✅ | `imap_get_quota` | Query quota info | RFC 2087 |
| 12 | ✅ | `imap_check_capabilities` | Server CAPABILITY list | RFC 3501 CAPABILITY |

## IMAP — Write (8 tools)

| # | Status | Tool | Description | RFC / Spec |
|---|---|---|---|---|
| 13 | ✅ | `imap_mark_message` | Set/remove flags (\Seen, \Flagged, \Answered, \Deleted, keywords) | RFC 3501 STORE |
| 14 | ✅ | `imap_bulk_mark` | Bulk STORE over multiple UIDs | RFC 3501 STORE with range |
| 15 | ✅ | `imap_move_message` | Move with fallback COPY+EXPUNGE | RFC 6851 MOVE |
| 16 | ✅ | `imap_copy_message` | Copy | RFC 3501 COPY |
| 17 | ✅ | `imap_bulk_move` | Bulk MOVE over multiple UIDs | RFC 6851 |
| 18 | ✅ | `imap_append_message` | Write message to folder (save drafts, import) | RFC 3501 APPEND |
| 19 | ✅ | `imap_expunge` | EXPUNGE | RFC 3501 EXPUNGE |
| 20 | ✅ | `imap_delete_message` | STORE \Deleted + optional EXPUNGE | RFC 3501 STORE+EXPUNGE |

## IMAP — Folder CRUD (5 tools)

| # | Status | Tool | Description | RFC / Spec |
|---|---|---|---|---|
| 21 | ✅ | `imap_create_mailbox` | Create new folder | RFC 3501 CREATE |
| 22 | ✅ | `imap_delete_mailbox` | Delete folder | RFC 3501 DELETE |
| 23 | ✅ | `imap_rename_mailbox` | Rename folder | RFC 3501 RENAME |
| 24 | ✅ | `imap_subscribe_mailbox` | Subscribe to folder | RFC 3501 SUBSCRIBE |
| 25 | ✅ | `imap_unsubscribe_mailbox` | Unsubscribe from folder | RFC 3501 UNSUBSCRIBE |

## SMTP (5 tools)

| # | Status | Tool | Description | RFC / Spec |
|---|---|---|---|---|
| 26 | ✅ | `smtp_send` | Send email (to/cc/bcc, text+html, attachments, inline images, custom headers) + optional sent save | RFC 5321, MIME RFC 2045-2049 |
| 27 | ✅ | `smtp_reply` | Reply with correct In-Reply-To/References chain + sent save | RFC 5322 §3.6.4 |
| 28 | ✅ | `smtp_forward` | Forward (original quoted or as attachment) + sent save | RFC 5322 |
| 29 | ✅ | `smtp_verify_connection` | Connection health check (EHLO, AUTH) | RFC 5321 |
| 30 | ✅ | `smtp_send_raw` | Send pre-formatted RFC-822 + sent save | RFC 5321 |

## Account Management (4 tools)

| # | Status | Tool | Description |
|---|---|---|---|
| 31 | ✅ | `account_list` | List configured accounts (credentials masked) |
| 32 | ✅ | `account_add` | Add account to config |
| 33 | ✅ | `account_update` | Modify existing account |
| 34 | ✅ | `account_delete` | Remove account from config |

## Meta — Server Introspection (2 tools)

| # | Status | Tool | Description |
|---|---|---|---|
| 35 | ✅ | `meta_health` | IMAP + SMTP reachability, latency, capabilities |
| 36 | ✅ | `meta_server_info` | Active tools, active mode, version |

---

## Definition of Done per Tool

A tool is ✅ only when **all** points are complete:

1. Zod input schema defined in `src/tools/<category>/<tool>.ts`
2. `ToolDefinition` export matches the interface from `src/tools/_types.ts`
3. Handler implemented, with structured errors from `lib/errors.ts`
4. Unit test in `src/tools/<category>/<tool>.test.ts` (coverage ≥ 85 %)
5. Integration test (where applicable) in `test/integration/<tool>.int.test.ts` runs against Dovecot/Mailpit
6. README entry matches implementation 1:1 (name, inputs, behavior)
7. llms.txt entry matches implementation 1:1
8. JSON schema in MCP inspector correct
9. Tool is correctly registered or filtered by the registry layer (feature flags + allow/deny)
10. Credentials are never logged due to the sanitizer

---

## Implementation Order (recommended)

Bottom-up, so each step builds on the previous one:

1. **Infrastructure first** (not a tool, but prerequisite): connection layer, config layer, error layer, logger, tool interface, registry
2. **Meta + account_list first** (#35, #36, #31: `meta_health`, `meta_server_info`, `account_list`) — these test the infrastructure without IMAP/SMTP write complexity
3. **IMAP-Read** (#1–12) — read-only is safe, builds confidence
4. **IMAP-Write** (#13–20) — riskier, but verifiable with working read side
5. **IMAP-Folder-CRUD** (#21–25) — depends on read+write
6. **SMTP** (#26–30) — send path
7. **Account mutation** (#32–34: `account_add`, `account_update`, `account_delete`) — last, because they mutate config and should have all other tools available for testing

---

## Notes on Account Management Logic

The **mutating account tools** (#32–34) change the config file at runtime. Consequences:

- Write access to the TOML config required — file lock during modification
- After write: server must update account data in RAM without restart
- Permission check 0600 re-executed after write
- In `--readonly` mode, mutating tools are **not** registered; `account_list` is
- In single-account setup (env vars instead of file), `account_add`/`account_update`/`account_delete` are meaningless — they return `CONFIG_ERROR` because there's no file to modify
- `account_list` works in both modes

---

## Notes on Sent Save (smtp_send / reply / forward / send_raw)

Send tools automatically save a copy to the Sent folder after successful delivery. Implementation consequences:

- **SMTP does not save** — the save is a separate IMAP APPEND that the tool executes itself after sending. Requires an active IMAP connection for the same account.
- Default `save_to_sent = true`. Disabled per tool call.
- **Finding the Sent folder:** primarily via special-use flag `\Sent` (from `imap_list_mailboxes`). Fallback order when special-use is missing: `Sent`, `Sent Items`, `[Gmail]/Sent Mail`, `INBOX.Sent`. Explicitly overridable via `sent_mailbox` parameter.
- **Separate error handling:** sending and saving are two steps. If saving fails *after* successful send, it is **not** a tool error — return with `savedToSent: false` + `sentSaveError`. The email was sent; that must not appear as a total failure.
- In `--readonly` mode, send tools are not registered — sent save is not relevant.
- With `--no-imap` (SMTP active, IMAP off): sent save is unavailable (no IMAP connection). Return `savedToSent: false` + notice, no hard error.
- **No outbox/queue/retry.** A failed send → synchronous `SMTP_RELAY_ERROR`, no parking in a queue.

---

## What is intentionally NOT in the list

| Non-tool | Reason |
|---|---|
| `imap_idle_wait` | Long-running, uneven client support. Roadmap v2.0. |
| OAuth-related tools | Out of scope. Permanent. |
| Calendar / ICS tools | Out of scope. Permanent. |
| AI triage / auto-label | Out of scope. Permanent. |
| Scheduling / future send | Out of scope. Permanent. |
| Notifications / webhooks | Out of scope. Permanent. |
