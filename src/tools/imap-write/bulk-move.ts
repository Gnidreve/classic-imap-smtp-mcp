// Bulk-MOVE über mehrere UIDs
import { z } from "zod";
import { MailboxNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_bulk_move",
  description: "Bulk-MOVE über mehrere UIDs",
  category: "imap-write",
  inputSchema: z.object({
    fromMailbox: z.string().min(1).describe("Source mailbox path"),
    toMailbox: z.string().min(1).describe("Target mailbox path"),
    uids: z.array(z.number().int().positive()).min(1).max(500).describe("Message UIDs to move"),
  }),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    const mb = await client.mailboxOpen(input.fromMailbox);
    if (!mb) throw new MailboxNotFoundError(input.fromMailbox);

    const moved: number[] = [];
    const notFound: number[] = [];

    // Use MOVE command for batch if available
    try {
      // Try a single MOVE command for all UIDs
      await client.messageMove(input.uids, input.toMailbox);
      moved.push(...input.uids);
    } catch {
      // Fallback: try each individually
      for (const uid of input.uids) {
        try {
          await client.messageMove(uid, input.toMailbox);
          moved.push(uid);
        } catch {
          // Fallback: COPY + DELETE (no direct expunge)
          try {
            await client.messageCopy(uid, input.toMailbox);
            await client.messageDelete(uid);
            moved.push(uid);
          } catch {
            notFound.push(uid);
          }
        }
      }
    }

    return {
      fromMailbox: input.fromMailbox,
      toMailbox: input.toMailbox,
      moved: moved.length,
      uids: moved,
      notFound,
    };
  },
});
