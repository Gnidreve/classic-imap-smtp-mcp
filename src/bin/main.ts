// CLI-Entry (Command: classic-imap-smtp-mcp): parst Args, baut Context, startet stdio-Server. Fail-fast bei --no-imap+--no-smtp.
import { loadConfig } from "../config/loader.js";
import { ImapPool } from "../connections/imap-pool.js";
import { SmtpPool } from "../connections/smtp-pool.js";
import { AccountNotFoundError, McpMailError } from "../lib/errors.js";
import { createLogger } from "../server/logging.js";
import { parseArgs } from "../server/options.js";
import { buildServer, runStdio, SERVER_VERSION } from "../server/server.js";
import type { ToolContext } from "../tools/_types.js";

const HELP = `classic-imap-smtp-mcp — classic IMAP/SMTP MCP server (stdio)

Usage: classic-imap-smtp-mcp [options]

Options:
  --safe               Disable delete tools (delete/expunge/delete-mailbox)
  --readonly           Read-only: no writes, no SMTP send
  --no-imap            Disable all IMAP tools
  --no-smtp            Disable all SMTP tools
  --allow-tools=<csv>  Explicitly enable tools (overrides feature flags, prefix wildcards)
  --deny-tools=<csv>   Explicitly remove tools (wins over everything, prefix wildcards)
  --account=<name>     Default account override
  --config=<path>      Alternative config path
  --log-level=<level>  trace|debug|info|warn|error (default: info)
  --log-format=<fmt>   json|pretty (default: json)
  -h, --help           Show help
  -V, --version        Show version

Subcommands:
  init                 Write a template config to the XDG path
  test [account]       Test IMAP+SMTP connection
  list-tools           Dry-run: which tools would register with the current flags
`;

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    process.stdout.write(HELP);
    return;
  }
  if (parsed.version) {
    process.stdout.write(`${SERVER_VERSION}\n`);
    return;
  }

  const logger = createLogger({ level: parsed.options.logLevel, format: parsed.options.logFormat });

  // Fail-fast: leerer Server ist fast sicher ein Konfig-Versehen.
  if (parsed.options.noImap && parsed.options.noSmtp) {
    logger.error("Both --no-imap and --no-smtp set: server would expose no mail tools. Aborting.");
    process.exit(1);
  }

  // Subcommands (init/test/list-tools): PHASE 3 fuer echte Implementierung; hier nur Dispatch-Geruest.
  if (parsed.subcommand) {
    logger.info({ subcommand: parsed.subcommand }, "Subcommand requested (Phase 3)");
    process.exit(0);
  }

  const config = loadConfig(parsed.options.configPath);
  const imap = new ImapPool(config, logger);
  const smtp = new SmtpPool(config, logger);

  const ctx: ToolContext = {
    config,
    imap,
    smtp,
    logger,
    resolveAccount(name?: string): string {
      const target = name ?? parsed.options.account ?? config.defaultAccount;
      if (!config.accounts.has(target)) throw new AccountNotFoundError(target);
      return target;
    },
  };

  const server = buildServer(parsed.options, ctx, logger);

  const shutdown = async () => {
    await Promise.allSettled([imap.closeAll(), smtp.closeAll()]);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await runStdio(server);
  logger.info("classic-imap-smtp-mcp running on stdio");
}

main().catch((err) => {
  const msg = err instanceof McpMailError ? `${err.code}: ${err.message}` : String(err);
  process.stderr.write(`Fatal: ${msg}\n`);
  process.exit(1);
});
