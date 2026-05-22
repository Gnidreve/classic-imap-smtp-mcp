// Server CAPABILITY-Liste
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_check_capabilities",
  description: "Server CAPABILITY-Liste",
  category: "imap-read",
  inputSchema: z.object({
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const caps = [...client.capabilities.keys()];

    return { capabilities: caps };
  },
});
