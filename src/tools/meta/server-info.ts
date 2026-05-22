// Aktive Tools, aktiver Modus, Version
import { z } from "zod";
import { SERVER_NAME, SERVER_VERSION } from "../../server/server.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "meta_server_info",
  description: "Aktive Tools, aktiver Modus, Version",
  category: "meta",
  inputSchema: z.object({}),
  handler: async (_input, ctx) => {
    const flags: Record<string, unknown> = {
      safe: ctx.flags.safe,
      readonly: ctx.flags.readonly,
      noImap: ctx.flags.noImap,
      noSmtp: ctx.flags.noSmtp,
    };
    if (ctx.flags.allowTools?.length) flags.allowTools = ctx.flags.allowTools;
    if (ctx.flags.denyTools?.length) flags.denyTools = ctx.flags.denyTools;

    return {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      activeTools: ctx.activeTools,
      flags,
    };
  },
});
