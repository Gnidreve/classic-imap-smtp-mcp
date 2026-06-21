// STORE \\Deleted + optional EXPUNGE
import { z } from "zod";
import { ImapProtocolError, MailboxNotFoundError, UidNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_delete_message",
  description: "STORE \\Deleted + optional EXPUNGE",
  category: "imap-write",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    uid: z.number().int().positive().describe("Message UID"),
    expunge: z.boolean().default(false).describe("Also EXPUNGE after marking (default: false)"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mb = await client.mailboxOpen(input.mailbox);
    if (!mb) throw new MailboxNotFoundError(input.mailbox);

    try {
      await client.messageDelete(input.uid);
    } catch (_err) {
      throw new UidNotFoundError(input.uid, input.mailbox);
    }

    let expunged = false;

    if (input.expunge) {
      try {
        await client.mailboxClose();
        expunged = true;
      } catch (_err) {
        throw new ImapProtocolError(`Failed to expunge after delete: ${_err}`);
      }
    }

    return {
      uid: input.uid,
      mailbox: input.mailbox,
      expunged,
    };
  },
});
