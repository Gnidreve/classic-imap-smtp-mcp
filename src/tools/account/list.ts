// Konfigurierte Accounts auflisten (Credentials masked)
import { z } from "zod";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "account_list",
  description: "Konfigurierte Accounts auflisten (Credentials masked)",
  category: "account",
  inputSchema: z.object({}),
  handler: async (_input, ctx) => {
    const accounts = [...ctx.config.accounts.entries()].map(([name, acc]) => ({
      name,
      user: acc.user,
      imapHost: acc.imap_host ?? "auto-detect",
      smtpHost: acc.smtp_host ?? "auto-detect",
    }));

    return {
      defaultAccount: ctx.config.defaultAccount,
      accounts,
      mode: ctx.config.mode,
    };
  },
});
