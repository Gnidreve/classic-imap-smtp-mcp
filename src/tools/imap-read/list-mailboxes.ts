// Folder enumerieren mit Special-Use-Flags (RFC 6154)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_list_mailboxes",
  description: "Folder enumerieren mit Special-Use-Flags (RFC 6154)",
  category: "imap-read",
  inputSchema: z.object({
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

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
