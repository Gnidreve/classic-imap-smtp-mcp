// Bulk-MOVE ueber mehrere UIDs
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_bulk_move",
  description: "Bulk-MOVE ueber mehrere UIDs",
  category: "imap-write",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_bulk_move not implemented (Phase 3)");
  },
});
