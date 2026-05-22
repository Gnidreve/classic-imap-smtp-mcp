// Bis N UIDs in einem Call holen
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_get_messages_bulk",
  description: "Bis N UIDs in einem Call holen",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_get_messages_bulk not implemented (Phase 3)");
  },
});
