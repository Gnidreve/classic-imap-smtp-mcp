// Folder umbenennen (RENAME)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_rename_mailbox",
  description: "Folder umbenennen (RENAME)",
  category: "imap-mailbox",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_rename_mailbox not implemented (Phase 3)");
  },
});
