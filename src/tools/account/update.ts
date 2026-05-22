// Bestehenden Account modifizieren
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "account_update",
  description: "Bestehenden Account modifizieren",
  category: "account",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("account_update not implemented (Phase 3)");
  },
});
