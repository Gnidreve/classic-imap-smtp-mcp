import { readFileSync, writeFileSync } from "node:fs";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
// Account aus Config entfernen
import { z } from "zod";
import { AccountNotFoundError, ConfigError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "account_delete",
  description: "Account aus Config entfernen",
  category: "account",
  inputSchema: z.object({
    name: z.string().min(1).describe("Account name to delete"),
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
    const idx = accounts.findIndex((a) => a.name === input.name);

    if (idx === -1) {
      throw new AccountNotFoundError(input.name);
    }

    accounts.splice(idx, 1);
    parsed.accounts = accounts;

    // If this was the default account, reset default
    if (parsed.default_account === input.name) {
      if (accounts.length > 0) {
        parsed.default_account = accounts[0]?.name;
      } else {
        parsed.default_account = undefined;
      }
    }

    const tomlStr = stringifyToml(parsed as Record<string, unknown>);
    writeFileSync(configPath, tomlStr, "utf8");

    ctx.logger.info({ account: input.name }, "Account deleted");

    return { name: input.name, deleted: true };
  },
});
