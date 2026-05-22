// Quota-Info abfragen (RFC 2087)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_get_quota",
  description: "Quota-Info abfragen (RFC 2087)",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_get_quota not implemented (Phase 3)");
  },
});
