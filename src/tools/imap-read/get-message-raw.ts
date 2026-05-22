// RFC-822 raw source einer Mail
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_get_message_raw",
  description: "RFC-822 raw source einer Mail",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_get_message_raw not implemented (Phase 3)");
  },
});
