// Konfigurierte Accounts auflisten (Credentials masked)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "account_list",
  description: "Konfigurierte Accounts auflisten (Credentials masked)",
  category: "account",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("account_list not implemented (Phase 3)");
  },
});
