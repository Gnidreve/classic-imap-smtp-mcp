// STORE \\Deleted + optional EXPUNGE
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_delete_message",
  description: "STORE \\Deleted + optional EXPUNGE",
  category: "imap-write",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_delete_message not implemented (Phase 3)");
  },
});
