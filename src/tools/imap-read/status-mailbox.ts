// Counts (unread/total/recent) ohne SELECT (STATUS)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_status_mailbox",
  description: "Counts (unread/total/recent) ohne SELECT (STATUS)",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_status_mailbox not implemented (Phase 3)");
  },
});
