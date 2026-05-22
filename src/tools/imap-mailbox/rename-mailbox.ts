// Folder umbenennen (RENAME)
import { z } from "zod";
import { ImapProtocolError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_rename_mailbox",
  description: "Folder umbenennen (RENAME)",
  category: "imap-mailbox",
  inputSchema: z.object({
    from: z.string().min(1).describe("Current mailbox path"),
    to: z.string().min(1).describe("New mailbox path"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    try {
      await client.mailboxRename(input.from, input.to);
    } catch (err) {
      throw new ImapProtocolError(`Failed to rename mailbox: ${err}`);
    }

    return { from: input.from, to: input.to, renamed: true };
  },
});
