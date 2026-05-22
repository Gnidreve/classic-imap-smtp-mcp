// Folder-Abo entfernen (UNSUBSCRIBE)
import { z } from "zod";
import { ImapProtocolError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_unsubscribe_mailbox",
  description: "Folder-Abo entfernen (UNSUBSCRIBE)",
  category: "imap-mailbox",
  inputSchema: z.object({
    path: z.string().min(1).describe("Mailbox path to unsubscribe"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    try {
      await client.mailboxUnsubscribe(input.path);
    } catch (err) {
      throw new ImapProtocolError(`Failed to unsubscribe from mailbox: ${err}`);
    }

    return { path: input.path, subscribed: false };
  },
});
