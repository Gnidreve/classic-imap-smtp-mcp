// Server CAPABILITY-Liste
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_check_capabilities",
  description: "Server CAPABILITY-Liste",
  category: "imap-read",
  inputSchema: z.object({}),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    const caps = [...client.capabilities.keys()];

    return { capabilities: caps };
  },
});
