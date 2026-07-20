// Neuen Folder anlegen (CREATE)
import { z } from "zod";
import { ImapProtocolError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_create_mailbox",
  description: "Neuen Folder anlegen (CREATE)",
  category: "imap-mailbox",
  inputSchema: z.object({
    path: z.string().min(1).describe("Mailbox path to create"),
  }),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    try {
      await client.mailboxCreate(input.path);
    } catch (err) {
      throw new ImapProtocolError(`Failed to create mailbox: ${err}`);
    }

    return { path: input.path, created: true };
  },
});
