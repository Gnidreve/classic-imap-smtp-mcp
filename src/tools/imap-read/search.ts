// Vollstaendiger RFC-3501-SEARCH-Builder
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_search",
  description: "Vollstaendiger RFC-3501-SEARCH-Builder",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_search not implemented (Phase 3)");
  },
});
