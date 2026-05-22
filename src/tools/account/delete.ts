// Account aus Config entfernen
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "account_delete",
  description: "Account aus Config entfernen",
  category: "account",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("account_delete not implemented (Phase 3)");
  },
});
