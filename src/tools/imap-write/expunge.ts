// EXPUNGE eines Folders
import { z } from "zod";
import { ImapProtocolError, MailboxNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_expunge",
  description: "EXPUNGE eines Folders",
  category: "imap-write",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path to expunge"),
  }),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    const mb = await client.mailboxOpen(input.mailbox);
    if (!mb) throw new MailboxNotFoundError(input.mailbox);

    const beforeCount = mb.exists;

    try {
      // ImapFlow doesn't support direct EXPUNGE; use mailboxClose() to purge \Deleted messages
      await client.mailboxClose();
      // Reopen to get fresh counts
      const after = await client.mailboxOpen(input.mailbox);
      const afterCount = after?.exists ?? beforeCount;
      return {
        mailbox: input.mailbox,
        expunged: Math.max(0, beforeCount - afterCount),
      };
    } catch (err) {
      throw new ImapProtocolError(`Failed to expunge mailbox: ${err}`);
    }
  },
});
