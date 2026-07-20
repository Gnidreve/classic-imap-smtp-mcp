// Quota-Info abfragen (RFC 2087)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_get_quota",
  description: "Quota-Info abfragen (RFC 2087)",
  category: "imap-read",
  inputSchema: z.object({}),
  handler: async (input, ctx) => {
    const client = await ctx.imap.acquire();

    // Check if server supports QUOTA via capabilities
    const caps = [...client.capabilities.keys()];
    if (!caps.some((c) => c.toUpperCase() === "QUOTA")) {
      return { root: "INBOX", usage: 0, limit: -1 };
    }

    try {
      const result = await client.getQuota();
      if (!result) {
        return { root: "INBOX", usage: 0, limit: -1 };
      }

      const usage = result.storage?.used ?? result.messages?.used ?? 0;
      const limit = result.storage?.limit ?? result.messages?.limit ?? -1;
      const resources: Array<{ name: string; usage: number; limit: number }> = [];
      if (result.storage) {
        resources.push({
          name: "STORAGE",
          usage: result.storage.used,
          limit: result.storage.limit,
        });
      }
      if (result.messages) {
        resources.push({
          name: "MESSAGES",
          usage: result.messages.used,
          limit: result.messages.limit,
        });
      }

      return {
        root: result.path,
        usage,
        limit,
        ...(resources.length > 1 ? { resources } : {}),
      };
    } catch {
      // Server doesn't support QUOTA or no quota
      return { root: "INBOX", usage: 0, limit: -1 };
    }
  },
});
