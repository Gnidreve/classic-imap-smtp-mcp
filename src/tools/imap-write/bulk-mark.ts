// Bulk-STORE über mehrere UIDs
import { z } from "zod";
import { ImapProtocolError, MailboxNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_bulk_mark",
  description: "Bulk-STORE über mehrere UIDs",
  category: "imap-write",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    uids: z.array(z.number().int().positive()).min(1).max(500).describe("Message UIDs"),
    flags: z.array(z.string()).min(1).describe("Flags to set/add/remove"),
    mode: z.enum(["set", "add", "remove"]).default("set").describe("STORE mode"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mb = await client.mailboxOpen(input.mailbox);
    if (!mb) throw new MailboxNotFoundError(input.mailbox);

    const normalizedFlags = input.flags.map((f) =>
      f.startsWith("\\") ? (f as `\\${string}`) : (`\\${f}` as const),
    );
    const notFound: number[] = [];
    let modified = 0;

    for (const uid of input.uids) {
      try {
        switch (input.mode) {
          case "set":
            await client.messageFlagsSet(uid, normalizedFlags);
            break;
          case "add":
            await client.messageFlagsAdd(uid, normalizedFlags);
            break;
          case "remove":
            await client.messageFlagsRemove(uid, normalizedFlags);
            break;
        }
        modified++;
      } catch {
        notFound.push(uid);
      }
    }

    return {
      modified,
      uids: input.uids.filter((u) => !notFound.includes(u)),
      notFound,
    };
  },
});
