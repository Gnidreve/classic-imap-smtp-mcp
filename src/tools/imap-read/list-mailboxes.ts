// Folder enumerieren mit Special-Use-Flags (RFC 6154)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_list_mailboxes",
  description: "Folder enumerieren mit Special-Use-Flags (RFC 6154)",
  category: "imap-read",
  inputSchema: z.object({}), // PHASE 3: echtes Schema
  handler: async (_input, _ctx) => {
    throw new Error("imap_list_mailboxes not implemented (Phase 3)");
  },
});
