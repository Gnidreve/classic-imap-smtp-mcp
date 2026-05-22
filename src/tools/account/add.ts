import { readFileSync, writeFileSync } from "node:fs";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
// Neuen Account zur Config hinzufügen
import { z } from "zod";
import { ConfigError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "account_add",
  description: "Neuen Account zur Config hinzufügen",
  category: "account",
  inputSchema: z.object({
    name: z.string().min(1).describe("Account name"),
    user: z.string().min(1).describe("Email address / IMAP login"),
    pass: z.string().min(1).describe("Password or app password"),
    imap_host: z.string().optional().describe("IMAP host (auto-detect if omitted)"),
    imap_port: z.number().int().positive().optional().describe("IMAP port (default: 993)"),
    imap_tls: z.enum(["implicit", "starttls", "none"]).optional().describe("IMAP TLS mode"),
    smtp_host: z.string().optional().describe("SMTP host (auto-detect if omitted)"),
    smtp_port: z.number().int().positive().optional().describe("SMTP port (default: 465)"),
    smtp_tls: z.enum(["implicit", "starttls", "none"]).optional().describe("SMTP TLS mode"),
    from_name: z.string().optional().describe("Display name for sent emails"),
    verify_tls: z.boolean().optional().describe("Verify TLS certificate (default: true)"),
  }),
  handler: async (input, ctx) => {
    if (ctx.config.mode !== "config-file" || !ctx.config.configPath) {
      throw new ConfigError(
        "Account mutations require a config file (multi-account mode). Use --config=<path> or set up a config file.",
      );
    }

    const configPath = ctx.config.configPath;

    // Read current config
    let raw: string;
    try {
      raw = readFileSync(configPath, "utf8");
    } catch {
      throw new ConfigError(`Cannot read config file: ${configPath}`);
    }

    const parsed = parseToml(raw) as Record<string, unknown>;
    const accounts = (parsed.accounts as Array<Record<string, unknown>>) ?? [];

    // Check for duplicate
    if (accounts.some((a) => a.name === input.name)) {
      throw new ConfigError(`Account "${input.name}" already exists`);
    }

    // Build new account entry
    const newAccount: Record<string, unknown> = {
      name: input.name,
      user: input.user,
      pass: input.pass,
    };
    if (input.imap_host) newAccount.imap_host = input.imap_host;
    if (input.imap_port) newAccount.imap_port = input.imap_port;
    if (input.imap_tls) newAccount.imap_tls = input.imap_tls;
    if (input.smtp_host) newAccount.smtp_host = input.smtp_host;
    if (input.smtp_port) newAccount.smtp_port = input.smtp_port;
    if (input.smtp_tls) newAccount.smtp_tls = input.smtp_tls;
    if (input.from_name) newAccount.from_name = input.from_name;
    if (input.verify_tls !== undefined) newAccount.verify_tls = input.verify_tls;

    accounts.push(newAccount);
    parsed.accounts = accounts;

    // Write back
    const tomlStr = stringifyToml(parsed as Record<string, unknown>);
    writeFileSync(configPath, tomlStr, "utf8");

    // Update in-memory config
    // (In a production system we'd re-parse the config, but for simplicity
    // we just note that the user should restart to pick up the new account.)
    ctx.logger.info({ account: input.name }, "Account added to config file");

    return { name: input.name, created: true, configPath };
  },
});
