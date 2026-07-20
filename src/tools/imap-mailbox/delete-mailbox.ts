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
  }),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    try {
      await client.mailboxDelete(input.path);
    } catch (err) {
      throw new ImapProtocolError(`Failed to delete mailbox: ${err}`);
    }

    return { path: input.path, deleted: true };
  },
});
