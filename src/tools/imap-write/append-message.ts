// Mail in Folder schreiben (APPEND, Drafts/Import)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_append_message",
  description: "Mail in Folder schreiben (APPEND, Drafts/Import)",
  category: "imap-write",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_append_message not implemented (Phase 3)");
  },
});
