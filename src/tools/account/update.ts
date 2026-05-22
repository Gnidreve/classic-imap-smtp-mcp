import { readFileSync, writeFileSync } from "node:fs";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
// Bestehenden Account modifizieren
import { z } from "zod";
import { AccountNotFoundError, ConfigError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "account_update",
  description: "Bestehenden Account modifizieren",
  category: "account",
  inputSchema: z.object({
    name: z.string().min(1).describe("Account name to modify"),
    user: z.string().optional().describe("New email address / IMAP login"),
    pass: z.string().optional().describe("New password or app password"),
    imap_host: z.string().optional().describe("New IMAP host"),
    imap_port: z.number().int().positive().optional().describe("New IMAP port"),
    imap_tls: z.enum(["implicit", "starttls", "none"]).optional().describe("New IMAP TLS mode"),
    smtp_host: z.string().optional().describe("New SMTP host"),
    smtp_port: z.number().int().positive().optional().describe("New SMTP port"),
    smtp_tls: z.enum(["implicit", "starttls", "none"]).optional().describe("New SMTP TLS mode"),
    from_name: z.string().optional().describe("New display name"),
    verify_tls: z.boolean().optional().describe("New TLS verification setting"),
  }),
  handler: async (input, ctx) => {
    if (ctx.config.mode !== "config-file" || !ctx.config.configPath) {
      throw new ConfigError("Account mutations require a config file (multi-account mode).");
    }

    const configPath = ctx.config.configPath;

    let raw: string;
    try {
      raw = readFileSync(configPath, "utf8");
    } catch {
      throw new ConfigError(`Cannot read config file: ${configPath}`);
    }

    const parsed = parseToml(raw) as Record<string, unknown>;
    const accounts = (parsed.accounts as Array<Record<string, unknown>>) ?? [];

    const account = accounts.find((a) => a.name === input.name);
    if (!account) {
      throw new AccountNotFoundError(input.name);
    }

    const changedFields: string[] = [];

    const updatable: Array<[string, unknown]> = [
      ["user", input.user],
      ["pass", input.pass],
      ["imap_host", input.imap_host],
      ["imap_port", input.imap_port],
      ["imap_tls", input.imap_tls],
      ["smtp_host", input.smtp_host],
      ["smtp_port", input.smtp_port],
      ["smtp_tls", input.smtp_tls],
      ["from_name", input.from_name],
    ];

    for (const [key, value] of updatable) {
      if (value !== undefined) {
        account[key] = value;
        changedFields.push(key);
      }
    }

    if (input.verify_tls !== undefined) {
      account.verify_tls = input.verify_tls;
      changedFields.push("verify_tls");
    }

    if (changedFields.length === 0) {
      throw new ConfigError("No fields to update");
    }

    parsed.accounts = accounts;
    const tomlStr = stringifyToml(parsed as Record<string, unknown>);
    writeFileSync(configPath, tomlStr, "utf8");

    ctx.logger.info({ account: input.name, changedFields }, "Account updated");

    return { name: input.name, updated: true, changedFields };
  },
});
