# Tool-Checkliste — Implementierungs-Referenz

**Zweck:** Eine einzige, abhakbare Liste aller 36 Tools, die in `classic-imap-smtp-mcp` v1.0 implementiert werden müssen.

**Status-Konvention:**
- ✅ noch nicht begonnen
- 🔨 in Arbeit
- ✅ implementiert + unit-tested + integration-tested (wo zutreffend) + dokumentiert

**Wer Tools hinzufügt:** niemand. Diese Liste ist abgeschlossen. Erweiterungen brauchen Phase-1-Reopen.

**Single Source of Truth:** Diese Datei ist die maßgebliche Liste, *welche* Tools existieren. `README.md` beschreibt sie für Menschen (Prosa), `llms.txt` für konsumierende LLMs (Key-Inputs), `output-shapes.md` definiert die Rückgabe-Strukturen. Bei Diskrepanz gilt: Existenz/Anzahl → diese Datei, Inputs → README, Outputs → output-shapes.md. Wer ein Tool ändert, zieht alle vier nach.

---

## IMAP — Lesen (12 Tools)

| # | Status | Tool | Kurzbeschreibung | RFC / Spec |
|---|---|---|---|---|
| 1 | ✅ | `imap_list_mailboxes` | Folder enumerieren mit Special-Use-Flags | RFC 3501 LIST, RFC 6154 |
| 2 | ✅ | `imap_status_mailbox` | Counts (unread/total/recent) ohne SELECT | RFC 3501 STATUS |
| 3 | ✅ | `imap_list_messages` | Paginierte Envelope-Liste in einem Folder | RFC 3501 FETCH ENVELOPE |
| 4 | ✅ | `imap_get_message` | Vollständige Mail inkl. geparstem Body + Attachment-Metadaten | RFC 3501 FETCH BODY |
| 5 | ✅ | `imap_get_message_headers` | Nur Header | RFC 3501 FETCH BODY[HEADER] |
| 6 | ✅ | `imap_get_message_raw` | RFC-822 raw source | RFC 3501 FETCH RFC822 |
| 7 | ✅ | `imap_get_messages_bulk` | Bis N UIDs in einem Call | RFC 3501 FETCH mit Range |
| 8 | ✅ | `imap_search` | Vollständiger SEARCH-Builder | RFC 3501 SEARCH (alle Kriterien) |
| 9 | ✅ | `imap_download_attachment` | Gezielt eine MIME-Part extrahieren | RFC 3501 FETCH BODY[part], MIME RFC 2045-2049 |
| 10 | ✅ | `imap_get_thread` | Konversation via In-Reply-To/References rekonstruieren | RFC 5322 §3.6.4 |
| 11 | ✅ | `imap_get_quota` | Quota-Info abfragen | RFC 2087 |
| 12 | ✅ | `imap_check_capabilities` | Server CAPABILITY-Liste | RFC 3501 CAPABILITY |

## IMAP — Schreiben (8 Tools)

| # | Status | Tool | Kurzbeschreibung | RFC / Spec |
|---|---|---|---|---|
| | 13 | ✅  | ✅ | `imap_mark_message` | Flags setzen/entfernen (\Seen, \Flagged, \Answered, \Deleted, Keywords) | RFC 3501 STORE |
| | 14 | ✅  | ✅ | `imap_bulk_mark` | Bulk-STORE | RFC 3501 STORE mit Range |
| | 15 | ✅  | ✅ | `imap_move_message` | Verschieben, Fallback COPY+EXPUNGE | RFC 6851 MOVE |
| | 16 | ✅  | ✅ | `imap_copy_message` | Kopieren | RFC 3501 COPY |
| | 17 | ✅  | ✅ | `imap_bulk_move` | Bulk-MOVE | RFC 6851 |
| | 18 | ✅  | ✅ | `imap_append_message` | Mail in Folder schreiben (Drafts speichern, Import) | RFC 3501 APPEND |
| | 19 | ✅  | ✅ | `imap_expunge` | EXPUNGE | RFC 3501 EXPUNGE |
| | 20 | ✅  | ✅ | `imap_delete_message` | STORE \Deleted + optional EXPUNGE | RFC 3501 STORE+EXPUNGE |

## IMAP — Folder-CRUD (5 Tools)

| # | Status | Tool | Kurzbeschreibung | RFC / Spec |
|---|---|---|---|---|
| | 21 | ✅  | ✅ | `imap_create_mailbox` | Neuen Folder anlegen | RFC 3501 CREATE |
| | 22 | ✅  | ✅ | `imap_delete_mailbox` | Folder löschen | RFC 3501 DELETE |
| | 23 | ✅  | ✅ | `imap_rename_mailbox` | Folder umbenennen | RFC 3501 RENAME |
| | 24 | ✅  | ✅ | `imap_subscribe_mailbox` | Folder abonnieren | RFC 3501 SUBSCRIBE |
| | 25 | ✅  | ✅ | `imap_unsubscribe_mailbox` | Folder-Abo entfernen | RFC 3501 UNSUBSCRIBE |

## SMTP (5 Tools)

| # | Status | Tool | Kurzbeschreibung | RFC / Spec |
|---|---|---|---|---|
| | 26 | ✅  | ✅ | `smtp_send` | Mail senden (to/cc/bcc, text+html, attachments, inline-images, custom headers) + optionale Sent-Ablage | RFC 5321, MIME RFC 2045-2049 |
| | 27 | ✅  | ✅ | `smtp_reply` | Antwort mit korrekter In-Reply-To/References-Kette + Sent-Ablage | RFC 5322 §3.6.4 |
| | 28 | ✅  | ✅ | `smtp_forward` | Weiterleiten (Original quoted oder als Attachment) + Sent-Ablage | RFC 5322 |
| | 29 | ✅  | ✅ | `smtp_verify_connection` | Connection-Health-Check (EHLO, AUTH) | RFC 5321 |
| | 30 | ✅  | ✅ | `smtp_send_raw` | Vor-formatierte RFC-822 senden + Sent-Ablage | RFC 5321 |

## Account-Management (4 Tools)

| # | Status | Tool | Kurzbeschreibung |
|---|---|---|---|
| | 31 | ✅  | ✅ | `account_list` | Konfigurierte Accounts auflisten (Credentials masked) |
| | 32 | ✅  | ✅ | `account_add` | Neuen Account zur Config hinzufügen |
| | 33 | ✅  | ✅ | `account_update` | Bestehenden Account modifizieren |
| | 34 | ✅  | ✅ | `account_delete` | Account aus Config entfernen |

## Meta — Server-Introspektion (2 Tools)

| # | Status | Tool | Kurzbeschreibung |
|---|---|---|---|
| | 35 | ✅  | ✅ | `meta_health` | IMAP + SMTP Erreichbarkeit, Latenz, Capabilities |
| | 36 | ✅  | ✅ | `meta_server_info` | Aktive Tools, aktiver Modus, Version |

---

## Definition of Done pro Tool

Ein Tool ist erst dann ✅, wenn **alle** Punkte erledigt sind:

1. Zod-Input-Schema in `src/tools/<category>/<tool>.ts` definiert
2. `ToolDefinition`-Export entspricht dem Interface aus `src/tools/_types.ts`
3. Handler implementiert, mit strukturierten Errors aus `lib/errors.ts`
4. Unit-Test in `src/tools/<category>/<tool>.test.ts` (Coverage ≥ 85 %)
5. Integration-Test (wo zutreffend) in `test/integration/<tool>.int.test.ts` läuft gegen Dovecot/Mailpit
6. README-Eintrag stimmt 1:1 mit Implementation überein (Name, Inputs, Verhalten)
7. llms.txt-Eintrag stimmt 1:1 mit Implementation überein
8. JSON-Schema im MCP-Inspector korrekt
9. Tool wird vom Registry-Layer korrekt registriert bzw. herausgefiltert (Feature-Flags + Allow/Deny)
10. Credentials werden im Sanitizer niemals geloggt

---

## Reihenfolge (Empfehlung Phase 3)

Bottom-up, damit jeder Schritt vom vorherigen profitiert:

1. **Infrastruktur zuerst** (kein Tool, aber Voraussetzung): Connection-Layer, Config-Layer, Error-Layer, Logger, Tool-Interface, Registry
2. **Meta + account_list zuerst** (#35, #36, #31: `meta_health`, `meta_server_info`, `account_list`) — diese testen die Infrastruktur ohne IMAP/SMTP-Schreib-Komplexität
3. **IMAP-Read** (#1–12) — read-only ist sicher, baut Vertrauen
4. **IMAP-Write** (#13–20) — riskanter, aber jetzt mit funktionierender Read-Seite verifizierbar
5. **IMAP-Folder-CRUD** (#21–25) — abhängig von Read+Write
6. **SMTP** (#26–30) — Sende-Pfad
7. **Account-Mutation** (#32–34: `account_add`, `account_update`, `account_delete`) — am Schluss, weil sie Config-Mutation machen und alle anderen Tools testweise verfügbar haben sollten

---

## Hinweise zur Account-Management-Logik

Die **mutierenden Account-Tools** (#32–34: `account_add`, `account_update`, `account_delete`) verändern die Config-Datei zur Laufzeit. Konsequenzen:

- Schreibzugriff auf die TOML-Config nötig — Datei-Lock während Modifikation
- Nach Schreibvorgang: Server muss Account-Daten im RAM aktualisieren, ohne Neustart
- Permission-Check 0600 nach Schreibvorgang erneut durchführen
- Im `--readonly`-Modus sind die mutierenden Tools **nicht** registriert; `account_list` schon
- Bei Single-Account-Setup (Env-Vars statt File) sind `account_add`/`account_update`/`account_delete` nicht sinnvoll — sie geben in diesem Modus `CONFIG_ERROR` zurück, weil ohne Config-File nichts zum Modifizieren da ist
- `account_list` funktioniert in beiden Modi

---

## Hinweise zur Sent-Ablage (smtp_send / reply / forward / send_raw)

Die Sende-Tools legen nach erfolgreichem Versand automatisch eine Kopie im Sent-Folder ab. Konsequenzen für die Implementierung:

- **SMTP legt nichts ab** — die Ablage ist ein separates IMAP-APPEND, das das Tool nach dem Send selbst ausführt. Erfordert also eine aktive IMAP-Connection desselben Accounts.
- Default `save_to_sent = true`. Per Tool-Call abschaltbar.
- **Sent-Folder finden:** primär über Special-Use-Flag `\Sent` (aus `imap_list_mailboxes`). Fallback-Reihenfolge bei fehlendem Special-Use: `Sent`, `Sent Items`, `[Gmail]/Sent Mail`, `INBOX.Sent`. Explizit überschreibbar via `sent_mailbox`-Parameter.
- **Getrennte Fehlerbehandlung:** Versand und Ablage sind zwei Schritte. Scheitert die Ablage *nach* erfolgreichem Versand, ist das **kein** Tool-Fehler — Rückgabe mit `savedToSent: false` + `sentSaveError`. Die Mail ist raus, das darf nicht als Gesamtfehler erscheinen.
- Im `--readonly`-Modus sind die Sende-Tools ohnehin nicht registriert — die Sent-Ablage-Frage stellt sich dort nicht.
- Bei `--no-imap` (SMTP aktiv, IMAP aus): Sent-Ablage ist nicht möglich (keine IMAP-Connection). In diesem Fall `savedToSent: false` + Hinweis, kein harter Fehler.
- **Kein Outbox/Queue/Retry.** Ein fehlgeschlagener Versand → synchron `SMTP_RELAY_ERROR`, kein Parken in einer Warteschlange.

---

## Was bewusst NICHT in der Liste ist

| Nicht-Tool | Begründung |
|---|---|
| `imap_idle_wait` | Long-running, Client-Support uneinheitlich. Roadmap v2.0. |
| OAuth-bezogene Tools | Out of scope. Permanent. Siehe Auth-Scope-Entscheidung in Phase 1. |
| Calendar/ICS-Tools | Out of scope. Permanent. |
| AI-Triage/Auto-Label | Out of scope. Permanent. |
| Scheduling/Future-Send | Out of scope. Permanent. |
| Notifications/Webhooks | Out of scope. Permanent. |
