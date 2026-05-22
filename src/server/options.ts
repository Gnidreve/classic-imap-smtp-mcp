// CLI-Argument-Parser: liest die vier Feature-Flags (--safe/--readonly/--no-imap/--no-smtp) + --allow-tools/--deny-tools + Betriebs-Args.
export interface ResolvedOptions {
  safe: boolean;
  readonly: boolean;
  noImap: boolean;
  noSmtp: boolean;
  allowTools?: string[];
  denyTools?: string[];
  account?: string;
  configPath?: string;
  logLevel: string;
  logFormat: "json" | "pretty";
}

export interface ParsedArgs {
  subcommand?: "init" | "test" | "list-tools";
  subcommandArg?: string;
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
    logLevel: "info",
    logFormat: "json",
  };
  let subcommand: ParsedArgs["subcommand"];
  let subcommandArg: string | undefined;
  let help = false;
  let version = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "init" || arg === "test" || arg === "list-tools") {
      subcommand = arg;
      if (arg === "test" && argv[i + 1] && !argv[i + 1]!.startsWith("-")) {
        subcommandArg = argv[++i];
      }
    } else if (arg === "--safe") opts.safe = true;
    else if (arg === "--readonly") opts.readonly = true;
    else if (arg === "--no-imap") opts.noImap = true;
    else if (arg === "--no-smtp") opts.noSmtp = true;
    else if (arg === "-h" || arg === "--help") help = true;
    else if (arg === "-V" || arg === "--version") version = true;
    else if (arg.startsWith("--allow-tools=")) opts.allowTools = csv(arg);
    else if (arg.startsWith("--deny-tools=")) opts.denyTools = csv(arg);
    else if (arg.startsWith("--account=")) opts.account = val(arg);
    else if (arg.startsWith("--config=")) opts.configPath = val(arg);
    else if (arg.startsWith("--log-level=")) opts.logLevel = val(arg);
    else if (arg.startsWith("--log-format=")) opts.logFormat = val(arg) === "pretty" ? "pretty" : "json";
  }

  return { subcommand, subcommandArg, options: opts, help, version };
}

const val = (arg: string) => arg.slice(arg.indexOf("=") + 1);
const csv = (arg: string) => val(arg).split(",").map((s) => s.trim()).filter(Boolean);
