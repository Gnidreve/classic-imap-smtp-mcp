// Folder-Abo entfernen (UNSUBSCRIBE)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_unsubscribe_mailbox",
  description: "Folder-Abo entfernen (UNSUBSCRIBE)",
  category: "imap-mailbox",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_unsubscribe_mailbox not implemented (Phase 3)");
  },
});
