// Vollständiger RFC-3501-SEARCH-Builder
import { z } from "zod";
import { MailboxNotFoundError } from "../../lib/errors.js";
import { buildSearchQuery } from "../../lib/search-builder.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_search",
  description: "Vollständiger RFC-3501-SEARCH-Builder",
  category: "imap-read",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    from: z.string().optional().describe("Sender address"),
    to: z.string().optional().describe("Recipient address"),
    cc: z.string().optional().describe("CC recipient address"),
    bcc: z.string().optional().describe("BCC recipient address"),
    subject: z.string().optional().describe("Subject line"),
    body: z.string().optional().describe("Body text"),
    text: z.string().optional().describe("Full text (headers + body)"),
    since: z
      .string()
      .optional()
      .describe("Messages on or after this date (DD-Mon-YYYY or YYYY-MM-DD)"),
    before: z.string().optional().describe("Messages before this date"),
    on: z.string().optional().describe("Messages on this exact date"),
    sentSince: z.string().optional().describe("Sent on or after this date"),
    sentBefore: z.string().optional().describe("Sent before this date"),
    sentOn: z.string().optional().describe("Sent on this exact date"),
    larger: z.number().int().positive().optional().describe("Larger than N bytes"),
    smaller: z.number().int().positive().optional().describe("Smaller than N bytes"),
    unseen: z.boolean().optional().describe("Not read"),
    seen: z.boolean().optional().describe("Read"),
    flagged: z.boolean().optional().describe("Flagged"),
    unflagged: z.boolean().optional().describe("Not flagged"),
    answered: z.boolean().optional().describe("Answered"),
    unanswered: z.boolean().optional().describe("Not answered"),
    deleted: z.boolean().optional().describe("Deleted"),
    undeleted: z.boolean().optional().describe("Not deleted"),
    keyword: z.string().optional().describe("Has this keyword"),
    unkeyword: z.string().optional().describe("Does not have this keyword"),
    new: z.boolean().optional().describe("New (unseen + recent)"),
    old: z.boolean().optional().describe("Old (not recent)"),
    recent: z.boolean().optional().describe("Recent"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mb = await client.mailboxOpen(input.mailbox);
    if (!mb) throw new MailboxNotFoundError(input.mailbox);

    const { mailbox: _mb, account: _acct, ...searchCriteria } = input;
    const query = buildSearchQuery(
      searchCriteria as import("../../lib/search-builder.js").SearchCriteria,
    );
    const result = await client.search(query);
    const uids: number[] = result ? [...result] : [];

    return {
      mailbox: input.mailbox,
      uids,
      count: uids.length,
    };
  },
});
