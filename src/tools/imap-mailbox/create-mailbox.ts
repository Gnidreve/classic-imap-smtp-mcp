// Neuen Folder anlegen (CREATE)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_create_mailbox",
  description: "Neuen Folder anlegen (CREATE)",
  category: "imap-mailbox",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_create_mailbox not implemented (Phase 3)");
  },
});
