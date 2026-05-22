// Mail weiterleiten + Sent-Ablage
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "smtp_forward",
  description: "Mail weiterleiten + Sent-Ablage",
  category: "smtp",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("smtp_forward not implemented (Phase 3)");
  },
});
