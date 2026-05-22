// Gezielt eine MIME-Part extrahieren (Pfad oder Base64)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_download_attachment",
  description: "Gezielt eine MIME-Part extrahieren (Pfad oder Base64)",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_download_attachment not implemented (Phase 3)");
  },
});
