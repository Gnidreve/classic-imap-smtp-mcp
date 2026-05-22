// Paginierte Envelope-Liste in einem Folder
import { z } from "zod";
import { MailboxNotFoundError } from "../../lib/errors.js";
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
  name: "imap_list_messages",
  description: "Paginierte Envelope-Liste in einem Folder",
  category: "imap-read",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    page: z.number().int().positive().default(1).describe("Page number (default: 1)"),
    pageSize: z
      .number()
      .int()
      .positive()
      .max(500)
      .default(50)
      .describe("Messages per page (default: 50, max: 500)"),
    sort: z.enum(["date", "subject", "from", "size"]).optional().describe("Sort field"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Sort order (default: desc)"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mailbox = await client.mailboxOpen(input.mailbox);
    if (!mailbox) {
      throw new MailboxNotFoundError(input.mailbox);
    }

    const total = mailbox.exists;
    const currentPage = input.page ?? 1;
    const pageSize = input.pageSize ?? 50;

    const startNum = (currentPage - 1) * pageSize + 1;
    const endNum = Math.min(startNum + pageSize - 1, total);

    if (startNum > total) {
      return {
        mailbox: input.mailbox,
        page: currentPage,
        pageSize,
        total,
        messages: [],
      };
    }

    // FETCH envelope
    const messages: Array<Record<string, unknown>> = [];
    for await (const msg of client.fetch(`${startNum}:${endNum}`, {
      uid: true,
      envelope: true,
      flags: true,
      size: true,
    })) {
      const enc = msg.envelope;
      if (!enc) continue;

      // Check if body structure indicates attachments
      let hasAttachments = false;
      if (msg.bodyStructure?.type?.toLowerCase() === "multipart") {
        hasAttachments = true;
      }

      messages.push({
        uid: msg.uid,
        seq: msg.seq,
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
        hasAttachments,
      });
    }

    return {
      mailbox: input.mailbox,
      page: currentPage,
      pageSize,
      total,
      messages,
    };
  },
});
