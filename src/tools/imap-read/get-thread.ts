// Konversation via In-Reply-To/References rekonstruieren
import { z } from "zod";
import { MailboxNotFoundError, UidNotFoundError } from "../../lib/errors.js";
import { type ThreadableMessage, reconstructThread } from "../../lib/threading.js";
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
  name: "imap_get_thread",
  description: "Konversation via In-Reply-To/References rekonstruieren",
  category: "imap-read",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    uid: z.number().int().positive().describe("Root message UID"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mb = await client.mailboxOpen(input.mailbox);
    if (!mb) throw new MailboxNotFoundError(input.mailbox);

    const allMessages: ThreadableMessage[] = [];
    const extras = new Map<number, Record<string, unknown>>();

    for await (const msg of client.fetch("1:*", {
      uid: true,
      envelope: true,
      flags: true,
      size: true,
      headers: ["message-id", "in-reply-to", "references"],
    })) {
      const enc = msg.envelope;
      if (!enc) continue;

      // Extract references from raw headers (not on MessageEnvelopeObject)
      const rawHeaders = msg.headers?.toString() ?? "";
      const refMatch = rawHeaders.match(/^references:\s*(.*)$/im);
      const refs = refMatch ? refMatch[1]?.trim().split(/\s+/).filter(Boolean) : undefined;

      allMessages.push({
        uid: msg.uid,
        messageId: enc.messageId ?? undefined,
        inReplyTo: enc.inReplyTo ?? undefined,
        references: refs,
        date: enc.date ?? new Date(),
      });

      extras.set(msg.uid, {
        subject: enc.subject ?? "",
        from: addressArray(enc.from),
        to: addressArray(enc.to),
        ...(enc.cc?.length ? { cc: addressArray(enc.cc) } : {}),
        ...(enc.bcc?.length ? { bcc: addressArray(enc.bcc) } : {}),
        ...(enc.replyTo?.length ? { replyTo: addressArray(enc.replyTo) } : {}),
        date: (enc.date ?? new Date()).toISOString(),
        ...(enc.messageId ? { messageId: enc.messageId } : {}),
        ...(enc.inReplyTo ? { inReplyTo: enc.inReplyTo } : {}),
        flags: [...(msg.flags ?? [])],
        size: msg.size ?? 0,
        hasAttachments: false,
      });
    }

    const thread = reconstructThread(allMessages, input.uid);
    const root = allMessages.find((m) => m.uid === input.uid);
    if (!root) throw new UidNotFoundError(input.uid, input.mailbox);

    const messages = thread.map((m) => ({
      ...(extras.get(m.uid) ?? {}),
    }));

    return {
      rootUid: input.uid,
      mailbox: input.mailbox,
      messages,
    };
  },
});
