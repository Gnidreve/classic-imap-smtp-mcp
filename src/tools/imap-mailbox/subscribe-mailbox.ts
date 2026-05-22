// Folder abonnieren (SUBSCRIBE)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_subscribe_mailbox",
  description: "Folder abonnieren (SUBSCRIBE)",
  category: "imap-mailbox",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_subscribe_mailbox not implemented (Phase 3)");
  },
});
