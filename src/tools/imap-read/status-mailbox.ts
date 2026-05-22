// Counts (unread/total/recent) ohne SELECT (STATUS)
import { z } from "zod";
import { MailboxNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_status_mailbox",
  description: "Counts (unread/total/recent) ohne SELECT (STATUS)",
  category: "imap-read",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path (e.g. INBOX)"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    try {
      const status = await client.status(input.mailbox, {
        messages: true,
        unseen: true,
        recent: true,
        uidNext: true,
        uidValidity: true,
      });

      return {
        path: input.mailbox,
        messages: status.messages ?? 0,
        unseen: status.unseen ?? 0,
        recent: status.recent ?? 0,
        ...(status.uidNext !== undefined ? { uidNext: status.uidNext } : {}),
        ...(status.uidValidity !== undefined ? { uidValidity: status.uidValidity } : {}),
      };
    } catch (err) {
      throw new MailboxNotFoundError(input.mailbox);
    }
  },
});
