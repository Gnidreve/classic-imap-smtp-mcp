// CLI-Entry (Command: classic-imap-smtp-mcp): parst Args, baut Context, startet stdio-Server. Fail-fast bei --no-imap+--no-smtp.
import { loadConfig } from "../config/loader.js";
import { ImapPool } from "../connections/imap-pool.js";
import { SmtpPool } from "../connections/smtp-pool.js";
import { McpMailError } from "../lib/errors.js";
import { runHttp } from "../server/http.js";
import { createLogger } from "../server/logging.js";
import { parseArgs } from "../server/options.js";
import { resolveActiveTools } from "../server/registry.js";
import { SERVER_VERSION, buildServer, runStdio } from "../server/server.js";
import type { ToolContext } from "../tools/_types.js";
import { ALL_TOOLS } from "../tools/index.js";

const HELP = `classic-imap-smtp-mcp — classic IMAP/SMTP MCP server

Usage: classic-imap-smtp-mcp [options]

Options:
  --safe               Disable delete tools (delete/expunge/delete-mailbox)
  --readonly           Read-only: no writes, no SMTP send
  --no-imap            Disable all IMAP tools
  --no-smtp            Disable all SMTP tools
  --transport=<mode>   stdio|http (default: stdio)
  --allow-tools=<csv>  Explicitly enable tools (overrides feature flags, prefix wildcards)
  --deny-tools=<csv>   Explicitly remove tools (wins over everything, prefix wildcards)
  --log-level=<level>  trace|debug|info|warn|error (default: info)
  --log-format=<fmt>   json|pretty (default: json)
  --http-host=<host>   HTTP bind host (default: 127.0.0.1)
  --http-port=<port>   HTTP bind port (default: 3000)
  --http-endpoint=<p>  Streamable HTTP endpoint (default: /mcp)
  --sse-endpoint=<p>   Legacy SSE GET endpoint (default: /sse)
  --messages-endpoint=<p>
                       Legacy SSE POST endpoint (default: /messages)
  -h, --help           Show help
  -V, --version        Show version

Subcommands:
  test                 Test IMAP+SMTP connection
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

  // Subcommands
  if (parsed.subcommand === "list-tools") {
    await handleListTools(parsed.options, logger);
    return;
  }
  if (parsed.subcommand === "test") {
    await handleTest(logger);
    return;
  }

  // Normal server mode
  const config = loadConfig();
  const imap = new ImapPool(config, logger);
  const smtp = new SmtpPool(config, logger);

  // Periodic idle-connection pruning (every 60s)
  const pruneTimer = setInterval(() => {
    imap.pruneIdle().catch((err) => logger.warn({ err }, "IMAP pruneIdle error"));
  }, 60_000);
  pruneTimer.unref();

  const activeTools = resolveActiveTools(ALL_TOOLS, parsed.options).map((t) => t.name);

  const ctx: ToolContext = {
    config,
    imap,
    smtp,
    logger,
    activeTools,
    flags: parsed.options,
  };

  const createServer = () => buildServer(parsed.options, ctx, logger);

  const shutdown = async () => {
    clearInterval(pruneTimer);
    await Promise.allSettled([runtime?.close(), imap.closeAll(), smtp.closeAll()]);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  let runtime: { close(): Promise<void> } | undefined;
  if (parsed.options.transport === "http") {
    runtime = await runHttp(parsed.options, logger, createServer);
  } else {
    await runStdio(createServer());
    logger.info("classic-imap-smtp-mcp running on stdio");
  }
}

async function handleListTools(
  options: Parameters<typeof resolveActiveTools>[1],
  _logger: ReturnType<typeof createLogger>,
): Promise<void> {
  const active = resolveActiveTools(ALL_TOOLS, options);
  const lines: string[] = [];
  lines.push(`Active tools: ${active.length}/${ALL_TOOLS.length}`);
  for (const t of active) {
    lines.push(`  ${t.name.padEnd(32)} ${t.category}`);
  }
  const denied = ALL_TOOLS.length - active.length;
  if (denied > 0) {
    lines.push(`\nBlocked by flags: ${denied} tool(s)`);
    const blocked = ALL_TOOLS.filter((t) => !active.find((a) => a.name === t.name));
    for (const t of blocked) {
      lines.push(`  ${t.name.padEnd(32)} ${t.category}`);
    }
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

async function handleTest(logger: ReturnType<typeof createLogger>): Promise<void> {
  const config = loadConfig();
  const imap = new ImapPool(config, logger);
  const smtp = new SmtpPool(config, logger);

  process.stdout.write(`Testing account: ${config.account.user}\n`);

  // IMAP
  process.stdout.write("  IMAP... ");
  try {
    const start = Date.now();
    const client = await imap.acquire();
    const caps = [...client.capabilities.keys()];
    const latency = Date.now() - start;
    process.stdout.write(`OK (${latency}ms, ${caps.length} capabilities)\n`);
  } catch (err) {
    process.stdout.write(`FAIL: ${err}\n`);
  }

  // SMTP
  process.stdout.write("  SMTP... ");
  try {
    const start = Date.now();
    const transport = await smtp.acquire();
    await transport.verify();
    const latency = Date.now() - start;
    process.stdout.write(`OK (${latency}ms)\n`);
  } catch (err) {
    process.stdout.write(`FAIL: ${err}\n`);
  }

  await imap.closeAll();
  await smtp.closeAll();
}

main().catch((err) => {
  const msg = err instanceof McpMailError ? `${err.code}: ${err.message}` : String(err);
  process.stderr.write(`Fatal: ${msg}\n`);
  process.exit(1);
});
