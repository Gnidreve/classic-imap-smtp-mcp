// Mail verschieben (MOVE, Fallback COPY+EXPUNGE)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_move_message",
  description: "Mail verschieben (MOVE, Fallback COPY+EXPUNGE)",
  category: "imap-write",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_move_message not implemented (Phase 3)");
  },
});
