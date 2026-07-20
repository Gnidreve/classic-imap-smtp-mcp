# Output Shapes — binding tool output structures

<a href="../README.md#-documentation-index">← Back to Index</a> · <a href="tools.md">← Previous: Tools</a>

**Purpose:** While `README.md` and `docs/llms.txt` define the **inputs** for each tool, this file defines their **outputs**. It is part of the contract. Implementations must match exactly; deviations are bugs.

**Conventions:**
- All outputs are JSON-serializable.
- Timestamps: ISO 8601 with offset (e.g. `2026-05-21T14:30:00+02:00`).
- Addresses: always `{ name?: string, address: string }`.
- UIDs: `number` (IMAP UIDs are 32-bit unsigned).
- Flags: array of strings, IMAP notation (`\Seen`, `\Flagged`, custom keywords without backslash).
- Errors are **not** modeled here — they arrive as structured errors (`{ code, message, details? }`, see `AGENTS.md`).
- Optional fields are marked with `?`. When absent, the field is omitted (not `null`), unless explicitly noted otherwise.
- Binary data (attachments) is never inlined as base64 in large lists — only on explicit request via `imap_download_attachment`.

---

## Common Sub-Types

```ts
type Address = { name?: string; address: string };

type MessageEnvelope = {
  uid: number;
  seq?: number;                 // Sequence number, if available
  subject: string;
  from: Address[];
  to: Address[];
  cc?: Address[];
  bcc?: Address[];
  replyTo?: Address[];
  date: string;                 // ISO 8601
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
  flags: string[];
  size: number;                 // Bytes
  hasAttachments: boolean;
};

type AttachmentMeta = {
  partId: string;               // IMAP body part (z. B. "2", "2.1")
  filename?: string;            // RFC-2231-dekodiert
  contentType: string;          // z. B. "application/pdf"
  size: number;                 // Bytes
  contentId?: string;           // for inline / cid references
  disposition?: "inline" | "attachment";
};

type MailboxInfo = {
  path: string;                 // server-nativer Name, z. B. "INBOX", "[Gmail]/Sent Mail"
  delimiter: string;            // Hierarchy separator, e.g. "/" or "."
  flags: string[];              // Mailbox-Flags
  specialUse?: string;          // \\Inbox \\Sent \\Drafts \\Trash \\Junk \\Archive \\All \\Flagged
  subscribed: boolean;
};
```

---

## IMAP — Lesen

### `imap_list_mailboxes`
```ts
{ mailboxes: MailboxInfo[] }
```

### `imap_status_mailbox`
```ts
{
  path: string;
  messages: number;     // total
  unseen: number;
  recent: number;
  uidNext?: number;
  uidValidity?: number;
}
```

### `imap_list_messages`
```ts
{
  mailbox: string;
  page: number;
  pageSize: number;
  total: number;            // Gesamtanzahl im Folder
  messages: MessageEnvelope[];
}
```

### `imap_get_message`
```ts
{
  envelope: MessageEnvelope;
  text?: string;            // text/plain Body, dekodiert
  html?: string;            // text/html Body, dekodiert
  attachments: AttachmentMeta[];   // Metadata, NO binary data
}
```

### `imap_get_message_headers`
```ts
{
  uid: number;
  headers: Record<string, string | string[]>;  // All headers, raw-decoded
}
```

### `imap_get_message_raw`
```ts
{
  uid: number;
  rfc822: string;           // Complete RFC-822 source
}
```

### `imap_get_messages_bulk`
```ts
{
  mailbox: string;
  messages: Array<{
    envelope: MessageEnvelope;
    text?: string;
    html?: string;
    attachments: AttachmentMeta[];
  }>;
  notFound: number[];       // Requested UIDs that did not exist
}
```

### `imap_search`
```ts
{
  mailbox: string;
  uids: number[];           // Treffer, aufsteigend sortiert
  count: number;
}
```

### `imap_download_attachment`
```ts
{
  partId: string;
  filename?: string;
  contentType: string;
  size: number;
  // Exactly one of:
  savedPath?: string;       // wenn save_path angegeben war
  base64?: string;          // wenn kein save_path — Inhalt inline
}
```

### `imap_get_thread`
```ts
{
  rootUid: number;
  mailbox: string;
  messages: MessageEnvelope[];   // chronologisch sortiert, inkl. des angefragten
  // Order follows the References / In-Reply-To chain, as far as resolvable
}
```

### `imap_get_quota`
```ts
{
  root: string;
  usage: number;            // KB belegt
  limit: number;            // KB Limit, -1 = unlimitiert
  // weitere QUOTA-Resources, falls Server mehrere meldet:
  resources?: Array<{ name: string; usage: number; limit: number }>;
}
```

### `imap_check_capabilities`
```ts
{ capabilities: string[] }   // z. B. ["IMAP4rev1", "IDLE", "MOVE", "CONDSTORE", ...]
```

---

## IMAP — Schreiben

All write tools return a uniform mutation report:

### `imap_mark_message`
```ts
{ uid: number; flags: string[] }   // resultierende Flags nach STORE
```

### `imap_bulk_mark`
```ts
{
  modified: number;          // Number of actually modified messages
  uids: number[];            // betroffene UIDs
  notFound: number[];
}
```

### `imap_move_message`
```ts
{
  fromMailbox: string;
  toMailbox: string;
  sourceUid: number;
  targetUid?: number;        // neue UID im Ziel, falls vom Server gemeldet (UIDPLUS)
}
```

### `imap_copy_message`
```ts
{
  fromMailbox: string;
  toMailbox: string;
  sourceUid: number;
  targetUid?: number;
}
```

### `imap_bulk_move`
```ts
{
  fromMailbox: string;
  toMailbox: string;
  moved: number;
  uids: number[];
  notFound: number[];
}
```

### `imap_append_message`
```ts
{
  mailbox: string;
  uid?: number;              // UID of the created message (UIDPLUS), if available
}
```

### `imap_expunge`
```ts
{ mailbox: string; expunged: number }   // Anzahl entfernter Messages
```

### `imap_delete_message`
```ts
{
  uid: number;
  mailbox: string;
  expunged: boolean;         // true wenn auch EXPUNGE lief, false wenn nur \\Deleted gesetzt
}
```

---

## IMAP — Folder-CRUD

Einheitlich:

### `imap_create_mailbox`
```ts
{ path: string; created: true }
```

### `imap_delete_mailbox`
```ts
{ path: string; deleted: true }
```

### `imap_rename_mailbox`
```ts
{ from: string; to: string; renamed: true }
```

### `imap_subscribe_mailbox`
```ts
{ path: string; subscribed: true }
```

### `imap_unsubscribe_mailbox`
```ts
{ path: string; subscribed: false }
```

---

## SMTP

Gemeinsame Sent-Ablage-Felder (bei `smtp_send`, `smtp_reply`, `smtp_forward`, `smtp_send_raw`):
- `savedToSent: boolean` — Was a copy saved to the Sent folder?
- `sentMailbox?: string` — in welchen Folder (falls abgelegt)
- `sentSaveError?: string` — Send succeeded, but save to Sent failed (email was still delivered)

### `smtp_send`
```ts
{
  messageId: string;         // Message-ID der gesendeten Mail
  accepted: string[];        // Accepted recipient addresses
  rejected: string[];        // abgelehnte
  response: string;          // SMTP-Server-Antwort (letzte Zeile)
  savedToSent: boolean;
  sentMailbox?: string;
  sentSaveError?: string;
}
```

### `smtp_reply`
```ts
{
  messageId: string;
  inReplyTo: string;         // Message-ID des Originals
  accepted: string[];
  rejected: string[];
  response: string;
  savedToSent: boolean;
  sentMailbox?: string;
  sentSaveError?: string;
}
```

### `smtp_forward`
```ts
{
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
  savedToSent: boolean;
  sentMailbox?: string;
  sentSaveError?: string;
}
```

### `smtp_verify_connection`
```ts
{
  ok: boolean;
  host: string;
  port: number;
  tls: "implicit" | "starttls" | "none";
  latencyMs: number;
}
```

### `smtp_send_raw`
```ts
{
  messageId?: string;        // falls in der raw-Message gesetzt
  accepted: string[];
  rejected: string[];
  response: string;
  savedToSent: boolean;
  sentMailbox?: string;
  sentSaveError?: string;
}
```

---

---

## Meta — Server-Introspektion

### `meta_health`
```ts
{
  account: string;
  imap: { ok: boolean; latencyMs?: number; capabilities?: string[]; error?: string };
  smtp: { ok: boolean; latencyMs?: number; error?: string };
}
```

### `meta_server_info`
```ts
{
  name: "classic-imap-smtp-mcp";
  version: string;           // SemVer
  activeTools: string[];     // Namen der registrierten Tools
  flags: {
    safe: boolean;
    readonly: boolean;
    noImap: boolean;
    noSmtp: boolean;
    allowTools?: string[];
    denyTools?: string[];
  };
}
```

---

## Note on MCP Serialization

The MCP protocol delivers tool results as `content` blocks. These shapes are the **logical** output model. The server wraps them as JSON text content blocks (or structured content once the SDK supports it stably). Implementers: check what the current SDK version prefers as return path, and map the logical model accordingly — the field names and types above remain binding in any case.

---

<a href="clients.md">Next: Client Setup →</a>
