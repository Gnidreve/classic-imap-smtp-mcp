// Flags setzen/entfernen (STORE)
import { z } from "zod";
import { ImapProtocolError, MailboxNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_mark_message",
  description: "Flags setzen/entfernen (STORE)",
  category: "imap-write",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    uid: z.number().int().positive().describe("Message UID"),
    flags: z
      .array(z.string())
      .min(1)
      .describe("Flags to set/add/remove (e.g. ['\\Seen', '\\Flagged'])"),
    mode: z
      .enum(["set", "add", "remove"])
      .default("set")
      .describe("STORE mode: set (replace), add (+FLAGS), remove (-FLAGS)"),
  }),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    const mb = await client.mailboxOpen(input.mailbox);
    if (!mb) throw new MailboxNotFoundError(input.mailbox);

    const normalizedFlags = input.flags.map((f) =>
      f.startsWith("\\") ? (f as `\\${string}`) : (`\\${f}` as const),
    );

    try {
      switch (input.mode) {
        case "set":
          await client.messageFlagsSet(input.uid, normalizedFlags);
          break;
        case "add":
          await client.messageFlagsAdd(input.uid, normalizedFlags);
          break;
        case "remove":
          await client.messageFlagsRemove(input.uid, normalizedFlags);
          break;
      }
    } catch (err) {
      throw new ImapProtocolError(`Failed to set flags: ${err}`);
    }

    return {
      uid: input.uid,
      flags: input.flags,
    };
  },
});
