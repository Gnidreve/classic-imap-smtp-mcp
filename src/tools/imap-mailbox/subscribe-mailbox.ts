// Folder abonnieren (SUBSCRIBE)
import { z } from "zod";
import { ImapProtocolError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_subscribe_mailbox",
  description: "Folder abonnieren (SUBSCRIBE)",
  category: "imap-mailbox",
  inputSchema: z.object({
    path: z.string().min(1).describe("Mailbox path to subscribe"),
  }),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    try {
      await client.mailboxSubscribe(input.path);
    } catch (err) {
      throw new ImapProtocolError(`Failed to subscribe to mailbox: ${err}`);
    }

    return { path: input.path, subscribed: true };
  },
});
