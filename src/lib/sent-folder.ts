// Sent-Folder-Auflösung für save_to_sent: primär über \Sent Special-Use,
// Fallback auf gängige Namen.
import type { ImapFlow } from "imapflow";

const SENT_FALLBACKS = [
  "Sent",
  "Sent Items",
  "[Gmail]/Sent Mail",
  "[Gmail]/Gesendet",
  "INBOX.Sent",
  "Gesendet",
  "Gesendete Elemente",
];

export async function resolveSentFolder(client: ImapFlow): Promise<string | undefined> {
  // Schritt 1: Special-Use-Flag \Sent suchen
  const mailboxes = await client.list();
  for (const mb of mailboxes) {
    if (mb.specialUse === "\\Sent" || mb.specialUse === "Sent") {
      return mb.path;
    }
    if (mb.flags.has("\\Sent")) {
      return mb.path;
    }
  }

  // Schritt 2: Fallback-Namen prüfen
  for (const name of SENT_FALLBACKS) {
    try {
      const status = await client.status(name, { messages: true });
      if (status) return name;
    } catch {
      // Mailbox existiert nicht
    }
  }

  return undefined;
}
