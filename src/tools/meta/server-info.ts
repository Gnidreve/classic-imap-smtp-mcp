// Aktive Tools, aktiver Modus, Version
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "meta_server_info",
  description: "Aktive Tools, aktiver Modus, Version",
  category: "meta",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("meta_server_info not implemented (Phase 3)");
  },
});
