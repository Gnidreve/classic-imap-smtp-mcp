// Vor-formatierte RFC-822 senden + Sent-Ablage
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "smtp_send_raw",
  description: "Vor-formatierte RFC-822 senden + Sent-Ablage",
  category: "smtp",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("smtp_send_raw not implemented (Phase 3)");
  },
});
