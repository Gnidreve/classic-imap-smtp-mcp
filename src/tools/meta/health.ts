// IMAP + SMTP Erreichbarkeit, Latenz, Capabilities
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "meta_health",
  description: "IMAP + SMTP Erreichbarkeit, Latenz, Capabilities",
  category: "meta",
  inputSchema: z.object({}),
  handler: async (_input, ctx) => {
    // IMAP health
    let imapOk = false;
    let imapLatencyMs: number | undefined;
    let imapCaps: string[] | undefined;
    let imapError: string | undefined;

    try {
      const imapStart = Date.now();
      const client = await ctx.imap.acquire();
      const caps = [...client.capabilities.keys()];
      imapLatencyMs = Date.now() - imapStart;
      imapOk = true;
      imapCaps = caps;
    } catch (err) {
      imapError = String(err);
    }

    // SMTP health
    let smtpOk = false;
    let smtpLatencyMs: number | undefined;
    let smtpError: string | undefined;

    try {
      const smtpStart = Date.now();
      const transport = await ctx.smtp.acquire();
      const verify = await transport.verify();
      smtpLatencyMs = Date.now() - smtpStart;
      smtpOk = verify;
    } catch (err) {
      smtpError = String(err);
    }

    return {
      imap: {
        ok: imapOk,
        ...(imapLatencyMs !== undefined ? { latencyMs: imapLatencyMs } : {}),
        ...(imapCaps ? { capabilities: imapCaps } : {}),
        ...(imapError ? { error: imapError } : {}),
      },
      smtp: {
        ok: smtpOk,
        ...(smtpLatencyMs !== undefined ? { latencyMs: smtpLatencyMs } : {}),
        ...(smtpError ? { error: smtpError } : {}),
      },
    };
  },
});
