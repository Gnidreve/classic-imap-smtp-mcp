// Mail kopieren (COPY)
import { z } from "zod";
import { ImapProtocolError, MailboxNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_copy_message",
  description: "Mail kopieren (COPY)",
  category: "imap-write",
  inputSchema: z.object({
    fromMailbox: z.string().min(1).describe("Source mailbox path"),
    toMailbox: z.string().min(1).describe("Target mailbox path"),
    uid: z.number().int().positive().describe("Message UID"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mb = await client.mailboxOpen(input.fromMailbox);
    if (!mb) throw new MailboxNotFoundError(input.fromMailbox);

    let targetUid: number | undefined;

    try {
      const result = await client.messageCopy(input.uid, input.toMailbox);
      if (result && result.uidMap) {
        targetUid = result.uidMap.get(input.uid);
      }
    } catch (err) {
      throw new ImapProtocolError(`Failed to copy message: ${err}`);
    }

    return {
      fromMailbox: input.fromMailbox,
      toMailbox: input.toMailbox,
      sourceUid: input.uid,
      ...(targetUid !== undefined ? { targetUid } : {}),
    };
  },
});
