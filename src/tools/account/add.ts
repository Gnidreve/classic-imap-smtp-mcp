// Neuen Account zur Config hinzufuegen
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "account_add",
  description: "Neuen Account zur Config hinzufuegen",
  category: "account",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("account_add not implemented (Phase 3)");
  },
});
