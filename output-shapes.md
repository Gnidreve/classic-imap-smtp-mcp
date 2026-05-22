# Output-Shapes — verbindliche Tool-Ausgabe-Strukturen

**Zweck:** Während `README.md` und `llms.txt` die **Inputs** jedes Tools definieren, legt diese Datei die **Outputs** fest. Sie ist Teil des Vertrags. Ein Implementierer baut die Rückgabe exakt so; Abweichungen sind ein Bug.

**Konventionen:**
- Alle Outputs sind JSON-serialisierbar.
- Zeitstempel: ISO 8601 mit Offset (z. B. `2026-05-21T14:30:00+02:00`).
- Adressen: immer `{ name?: string, address: string }`.
- UIDs: `number` (IMAP UIDs sind 32-bit unsigned).
- Flags: Array von Strings, IMAP-Notation (`\\Seen`, `\\Flagged`, Custom-Keywords ohne Backslash).
- Fehler werden **nicht** hier modelliert — sie kommen als strukturierte Errors (`{ code, message, details? }`, siehe `AGENTS.md`).
- Optionale Felder sind mit `?` markiert. Fehlt der Wert, wird das Feld weggelassen (nicht `null`), außer explizit anders vermerkt.
- Binärdaten (Attachments) werden nie inline als Base64 in großen Listen zurückgegeben — nur auf explizite Anfrage über `imap_download_attachment`.

---

## Gemeinsame Sub-Typen

```ts
type Address = { name?: string; address: string };

type MessageEnvelope = {
  uid: number;
  seq?: number;                 // Sequence-Number, falls verfügbar
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
  contentId?: string;           // für inline/cid-Referenzen
  disposition?: "inline" | "attachment";
};

type MailboxInfo = {
  path: string;                 // server-nativer Name, z. B. "INBOX", "[Gmail]/Sent Mail"
  delimiter: string;            // Hierarchie-Trenner, z. B. "/" oder "."
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
  attachments: AttachmentMeta[];   // Metadaten, KEINE Binärdaten
}
```

### `imap_get_message_headers`
```ts
{
  uid: number;
  headers: Record<string, string | string[]>;  // alle Header, raw-dekodiert
}
```

### `imap_get_message_raw`
```ts
{
  uid: number;
  rfc822: string;           // vollständige RFC-822-Quelle
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
  notFound: number[];       // angefragte UIDs, die nicht existierten
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
  // genau eines der beiden:
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
  // Reihenfolge folgt der References/In-Reply-To-Kette, soweit auflösbar
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

Alle Schreib-Tools geben einen einheitlichen Mutations-Report zurück:

### `imap_mark_message`
```ts
{ uid: number; flags: string[] }   // resultierende Flags nach STORE
```

### `imap_bulk_mark`
```ts
{
  modified: number;          // Anzahl tatsächlich geänderter Messages
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
  uid?: number;              // UID der angelegten Message (UIDPLUS), falls verfügbar
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
- `savedToSent: boolean` — wurde eine Kopie im Sent-Folder abgelegt?
- `sentMailbox?: string` — in welchen Folder (falls abgelegt)
- `sentSaveError?: string` — falls Versand ok, aber Ablage scheiterte (Mail ist trotzdem raus)

### `smtp_send`
```ts
{
  messageId: string;         // Message-ID der gesendeten Mail
  accepted: string[];        // akzeptierte Empfänger-Adressen
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

## Account-Management

### `account_list`
```ts
{
  defaultAccount?: string;
  accounts: Array<{
    name: string;
    user: string;            // Mail-Adresse
    imapHost: string;
    smtpHost: string;
    // pass NIEMALS enthalten — gemäß Sanitizer
  }>;
  mode: "env" | "config-file";
}
```

### `account_add`
```ts
{ name: string; created: true; configPath: string }
```

### `account_update`
```ts
{ name: string; updated: true; changedFields: string[] }
```

### `account_delete`
```ts
{ name: string; deleted: true }
```

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

## Hinweis zur MCP-Serialisierung

Das MCP-Protokoll liefert Tool-Ergebnisse als `content`-Blöcke. Diese Shapes sind das **logische** Output-Modell. Der Server verpackt sie als JSON-Text-Content-Block (oder structured content, sobald das SDK das stabil unterstützt). Implementierer: prüfen, was die aktuelle SDK-Version als bevorzugten Rückgabeweg vorgibt, und das logische Modell darauf abbilden — die Feldnamen und -typen oben bleiben in jedem Fall verbindlich.
