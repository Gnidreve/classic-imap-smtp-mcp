// Vollständige Mail inkl. geparstem Body + Attachment-Metadaten
import { z } from "zod";
import { MailboxNotFoundError, UidNotFoundError } from "../../lib/errors.js";
import { parseMime } from "../../lib/mime.js";
import { defineTool } from "../_types.js";

function addressArray(addr: unknown): Array<{ name?: string; address: string }> {
  if (!addr) return [];
  const list = Array.isArray(addr) ? addr : [addr];
  const result: Array<{ name?: string; address: string }> = [];
  for (const entry of list) {
    if (entry && typeof entry === "object") {
      const e = entry as { name?: string; address?: string };
      const addrStr = e.address ?? "";
      if (addrStr) {
        result.push({ ...(e.name ? { name: e.name } : {}), address: addrStr });
      }
    }
  }
  return result;
}

export default defineTool({
  name: "imap_get_message",
  description: "Vollständige Mail inkl. geparstem Body + Attachment-Metadaten",
  category: "imap-read",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    uid: z.number().int().positive().describe("Message UID"),
  }),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    const mailbox = await client.mailboxOpen(input.mailbox);
    if (!mailbox) throw new MailboxNotFoundError(input.mailbox);

    const msg = await client.fetchOne(
      input.uid,
      {
        uid: true,
        envelope: true,
        flags: true,
        size: true,
        source: true,
      },
      { uid: true },
    );

    if (!msg) throw new UidNotFoundError(input.uid, input.mailbox);

    const raw = msg.source?.toString() ?? "";
    let parsed: import("../../lib/mime.js").ParsedMessage;
    try {
      parsed = await parseMime(raw);
    } catch {
      parsed = { body: {}, attachments: [] };
    }

    const enc = msg.envelope;
    return {
      envelope: {
        uid: msg.uid,
        subject: enc?.subject ?? "",
        from: addressArray(enc?.from),
        to: addressArray(enc?.to),
        ...(enc?.cc?.length ? { cc: addressArray(enc.cc) } : {}),
        ...(enc?.bcc?.length ? { bcc: addressArray(enc.bcc) } : {}),
        ...(enc?.replyTo?.length ? { replyTo: addressArray(enc.replyTo) } : {}),
        date: (enc?.date ?? new Date()).toISOString(),
        ...(enc?.messageId ? { messageId: enc.messageId } : {}),
        ...(enc?.inReplyTo ? { inReplyTo: enc.inReplyTo } : {}),
        flags: [...(msg.flags ?? [])],
        size: msg.size ?? 0,
        hasAttachments: parsed.attachments.length > 0,
      },
      ...(parsed.body.text ? { text: parsed.body.text } : {}),
      ...(parsed.body.html ? { html: parsed.body.html } : {}),
      attachments: parsed.attachments,
    };
  },
});
