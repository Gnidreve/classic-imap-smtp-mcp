// CLI-Argument-Parser: liest die vier Feature-Flags (--safe/--readonly/--no-imap/--no-smtp) + --allow-tools/--deny-tools + Betriebs-Args.
export interface ResolvedOptions {
  safe: boolean;
  readonly: boolean;
  noImap: boolean;
  noSmtp: boolean;
  transport: "stdio" | "http";
  allowTools?: string[];
  denyTools?: string[];
  account?: string;
  configPath?: string;
  logLevel: string;
  logFormat: "json" | "pretty";
  httpHost: string;
  httpPort: number;
  httpEndpoint: string;
  sseEndpoint: string;
  messagesEndpoint: string;
  healthEndpoint: string;
  httpTimeoutMs: number;
}

export interface ParsedArgs {
  subcommand: "init" | "test" | "list-tools" | undefined;
  subcommandArg: string | undefined;
  options: ResolvedOptions;
  help: boolean;
  version: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const opts: ResolvedOptions = {
    safe: false,
    readonly: false,
    noImap: false,
    noSmtp: false,
    transport: envTransport(process.env.MCP_TRANSPORT),
    logLevel: process.env.MCP_LOG_LEVEL || "info",
    logFormat: process.env.MCP_LOG_FORMAT === "pretty" ? "pretty" : "json",
    httpHost: process.env.MCP_HOST || "127.0.0.1",
    httpPort: envPort(process.env.MCP_PORT),
    httpEndpoint: envPath(process.env.MCP_ENDPOINT, "/mcp"),
    sseEndpoint: envPath(process.env.MCP_SSE_PATH, "/sse"),
    messagesEndpoint: envPath(process.env.MCP_MESSAGES_PATH, "/messages"),
    healthEndpoint: envPath(process.env.MCP_HEALTH_PATH, "/healthz"),
    httpTimeoutMs: 30_000,
  };
  let subcommand: ParsedArgs["subcommand"];
  let subcommandArg: string | undefined;
  let help = false;
  let version = false;

  for (let i = 0; i < argv.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: loop bound ensures i < argv.length
    const arg = argv[i]!;
    if (arg === "init" || arg === "test" || arg === "list-tools") {
      subcommand = arg;
      if (arg === "test" && argv[i + 1] && !argv[i + 1]?.startsWith("-")) {
        subcommandArg = argv[++i];
      }
    } else if (arg === "--safe") opts.safe = true;
    else if (arg === "--readonly") opts.readonly = true;
    else if (arg === "--no-imap") opts.noImap = true;
    else if (arg === "--no-smtp") opts.noSmtp = true;
    else if (arg.startsWith("--transport=")) opts.transport = envTransport(val(arg));
    else if (arg === "-h" || arg === "--help") help = true;
    else if (arg === "-V" || arg === "--version") version = true;
    else if (arg.startsWith("--allow-tools=")) opts.allowTools = csv(arg);
    else if (arg.startsWith("--deny-tools=")) opts.denyTools = csv(arg);
    else if (arg.startsWith("--account=")) opts.account = val(arg);
    else if (arg.startsWith("--config=")) opts.configPath = val(arg);
    else if (arg.startsWith("--log-level=")) opts.logLevel = val(arg);
    else if (arg.startsWith("--log-format="))
      opts.logFormat = val(arg) === "pretty" ? "pretty" : "json";
    else if (arg.startsWith("--http-host=")) opts.httpHost = val(arg);
    else if (arg.startsWith("--http-port=")) opts.httpPort = envPort(val(arg));
    else if (arg.startsWith("--http-endpoint=")) opts.httpEndpoint = envPath(val(arg), "/mcp");
    else if (arg.startsWith("--sse-endpoint=")) opts.sseEndpoint = envPath(val(arg), "/sse");
    else if (arg.startsWith("--messages-endpoint="))
      opts.messagesEndpoint = envPath(val(arg), "/messages");
    else if (arg.startsWith("--health-endpoint="))
      opts.healthEndpoint = envPath(val(arg), "/healthz");
  }

  return { subcommand, subcommandArg, options: opts, help, version };
}

const val = (arg: string) => arg.slice(arg.indexOf("=") + 1);
const csv = (arg: string) =>
  val(arg)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const envTransport = (value: string | undefined): "stdio" | "http" =>
  value === "http" ? "http" : "stdio";
const envPort = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : 3000;
};
const envPath = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback;
  return value.startsWith("/") ? value : `/${value}`;
};
