// SMTP-Connection-Health-Check (EHLO, AUTH)
import { z } from "zod";
import { AuthError, SmtpRelayError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "smtp_verify_connection",
  description: "SMTP-Connection-Health-Check (EHLO, AUTH)",
  category: "smtp",
  inputSchema: z.object({}),
  handler: async (input, ctx) => {
    const transport = await ctx.smtp.acquire();
    const accConfig = ctx.config.account;

    const start = Date.now();

    try {
      const ok = await transport.verify();
      const latencyMs = Date.now() - start;

      return {
        ok,
        host: accConfig.smtp_host ?? "unknown",
        port: accConfig.smtp_port,
        tls:
          accConfig.smtp_tls === "implicit"
            ? ("implicit" as const)
            : accConfig.smtp_tls === "starttls"
              ? ("starttls" as const)
              : ("none" as const),
        latencyMs,
      };
    } catch (err) {
      const error = err as Error;
      if (error.message?.includes("auth") || error.message?.includes("login")) {
        throw new AuthError(`SMTP authentication failed: ${error.message}`);
      }
      throw new SmtpRelayError(`SMTP connection failed: ${error.message}`);
    }
  },
});
