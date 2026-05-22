// Folder loeschen (DELETE)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_delete_mailbox",
  description: "Folder loeschen (DELETE)",
  category: "imap-mailbox",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_delete_mailbox not implemented (Phase 3)");
  },
});
