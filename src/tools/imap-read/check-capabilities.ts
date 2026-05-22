// Server CAPABILITY-Liste
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_check_capabilities",
  description: "Server CAPABILITY-Liste",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_check_capabilities not implemented (Phase 3)");
  },
});
