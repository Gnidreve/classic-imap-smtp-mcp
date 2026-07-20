// Mail in Folder schreiben (APPEND, Drafts/Import)
import { z } from "zod";
import { ImapProtocolError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_append_message",
  description: "Mail in Folder schreiben (APPEND, Drafts/Import)",
  category: "imap-write",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Target mailbox path"),
    raw: z.string().min(1).describe("RFC-822 raw message content"),
    flags: z
      .array(z.string())
      .optional()
      .describe("Optional flags to set (e.g. ['\\Seen', '\\Drafts'])"),
    date: z.string().optional().describe("Optional internal date (ISO 8601 or imap date-time)"),
  }),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    const normalizedFlags = input.flags?.map((f) => (f.startsWith("\\") ? f : `\\${f}`));
    const internalDate = input.date ? new Date(input.date) : undefined;

    try {
      const result = await client.append(input.mailbox, input.raw, normalizedFlags, internalDate);

      const uid = result && result.uid !== undefined ? Number(result.uid) : undefined;
      return {
        mailbox: input.mailbox,
        ...(uid !== undefined ? { uid } : {}),
      };
    } catch (err) {
      throw new ImapProtocolError(`Failed to append message: ${err}`);
    }
  },
});
