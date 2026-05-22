// Vollstaendige Mail inkl. geparstem Body + Attachment-Metadaten
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_get_message",
  description: "Vollstaendige Mail inkl. geparstem Body + Attachment-Metadaten",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_get_message not implemented (Phase 3)");
  },
});
