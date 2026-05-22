// RFC-822 raw source einer Mail
import { z } from "zod";
import { MailboxNotFoundError, UidNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_get_message_raw",
  description: "RFC-822 raw source einer Mail",
  category: "imap-read",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    uid: z.number().int().positive().describe("Message UID"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mailbox = await client.mailboxOpen(input.mailbox);
    if (!mailbox) throw new MailboxNotFoundError(input.mailbox);

    const msg = await client.fetchOne(input.uid, {
      uid: true,
      source: true,
    });

    if (!msg) throw new UidNotFoundError(input.uid, input.mailbox);

    return {
      uid: msg.uid,
      rfc822: msg.source?.toString() ?? "",
    };
  },
});
