// Flags setzen/entfernen (STORE)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_mark_message",
  description: "Flags setzen/entfernen (STORE)",
  category: "imap-write",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_mark_message not implemented (Phase 3)");
  },
});
