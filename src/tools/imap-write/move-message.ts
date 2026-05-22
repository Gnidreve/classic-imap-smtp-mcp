// Mail verschieben (MOVE, Fallback COPY+EXPUNGE)
import { z } from "zod";
import { ImapProtocolError, MailboxNotFoundError, UidNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_move_message",
  description: "Mail verschieben (MOVE, Fallback COPY+EXPUNGE)",
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

    // Try MOVE first (RFC 6851)
    let targetUid: number | undefined;

    try {
      const result = await client.messageMove(input.uid, input.toMailbox);
      // biome-ignore lint/complexity/useOptionalChain: false|CopyResponseObject union
      if (result && result.uidMap) {
        targetUid = result.uidMap.get(input.uid);
      }
    } catch (err) {
      // Fallback: COPY + EXPUNGE via mailboxClose
      try {
        const copyResult = await client.messageCopy(input.uid, input.toMailbox);
        // biome-ignore lint/complexity/useOptionalChain: false|CopyResponseObject union
        if (copyResult && copyResult.uidMap) {
          targetUid = copyResult.uidMap.get(input.uid);
        }
        await client.messageDelete(input.uid);
      } catch (fallbackErr) {
        throw new ImapProtocolError(`Failed to move message: ${fallbackErr}`);
      }
    }

    return {
      fromMailbox: input.fromMailbox,
      toMailbox: input.toMailbox,
      sourceUid: input.uid,
      ...(targetUid !== undefined ? { targetUid } : {}),
    };
  },
});
