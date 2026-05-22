// Konversation via In-Reply-To/References rekonstruieren
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_get_thread",
  description: "Konversation via In-Reply-To/References rekonstruieren",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_get_thread not implemented (Phase 3)");
  },
});
