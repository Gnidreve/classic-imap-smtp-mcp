// EXPUNGE eines Folders
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_expunge",
  description: "EXPUNGE eines Folders",
  category: "imap-write",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_expunge not implemented (Phase 3)");
  },
});
