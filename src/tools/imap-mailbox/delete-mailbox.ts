// Folder löschen (DELETE)
import { z } from "zod";
import { ImapProtocolError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_delete_mailbox",
  description: "Folder löschen (DELETE)",
  category: "imap-mailbox",
  inputSchema: z.object({
    path: z.string().min(1).describe("Mailbox path to delete"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    try {
      await client.mailboxDelete(input.path);
    } catch (err) {
      throw new ImapProtocolError(`Failed to delete mailbox: ${err}`);
    }

    return { path: input.path, deleted: true };
  },
});
