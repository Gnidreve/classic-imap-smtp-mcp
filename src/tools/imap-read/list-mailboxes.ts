// Folder enumerieren mit Special-Use-Flags (RFC 6154)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_list_mailboxes",
  description: "Folder enumerieren mit Special-Use-Flags (RFC 6154)",
  category: "imap-read",
  inputSchema: z.object({}),
  handler: async (_input, ctx) => {
    const client = await ctx.imap.acquire();

    const mailboxes = await client.list();
    const result = mailboxes.map((mb) => {
      const flags = [...(mb.flags || [])];
      const specialUse = flags.find((f) =>
        [
          "\\Inbox",
          "\\Sent",
          "\\Drafts",
          "\\Trash",
          "\\Junk",
          "\\Archive",
          "\\All",
          "\\Flagged",
        ].includes(f),
      );

      return {
        path: mb.path,
        delimiter: mb.delimiter,
        flags,
        ...(specialUse ? { specialUse } : {}),
        subscribed: mb.subscribed,
      };
    });

    return { mailboxes: result };
  },
});
