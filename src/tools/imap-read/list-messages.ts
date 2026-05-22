// Paginierte Envelope-Liste in einem Folder
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_list_messages",
  description: "Paginierte Envelope-Liste in einem Folder",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_list_messages not implemented (Phase 3)");
  },
});
