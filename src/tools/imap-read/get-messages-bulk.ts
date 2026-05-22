// Bis N UIDs in einem Call holen
import { z } from "zod";
import { MailboxNotFoundError } from "../../lib/errors.js";
import { type ParsedMessage, parseMime } from "../../lib/mime.js";
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
  name: "imap_get_messages_bulk",
  description: "Bis N UIDs in einem Call holen",
  category: "imap-read",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    uids: z.array(z.number().int().positive()).min(1).max(500).describe("Message UIDs"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mb = await client.mailboxOpen(input.mailbox);
    if (!mb) throw new MailboxNotFoundError(input.mailbox);

    const messages: Array<Record<string, unknown>> = [];
    const notFound: number[] = [];
    const uidSet = new Set(input.uids);

    for await (const msg of client.fetch(input.uids, {
      uid: true,
      envelope: true,
      flags: true,
      size: true,
      source: true,
    })) {
      uidSet.delete(msg.uid);
      const raw = msg.source?.toString() ?? "";
      let parsed: ParsedMessage;
      try {
        parsed = await parseMime(raw);
      } catch {
        parsed = { body: {}, attachments: [] };
      }

      const enc = msg.envelope;
      messages.push({
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
      });
    }

    for (const uid of uidSet) notFound.push(uid);

    return {
      mailbox: input.mailbox,
      messages,
      notFound,
    };
  },
});
