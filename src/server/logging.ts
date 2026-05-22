// Logger via pino, schreibt AUSSCHLIESSLICH auf stderr (stdout = MCP-Protokoll). Sanitizer maskiert Credentials immer.
import { pino } from "pino";

export type Logger = ReturnType<typeof pino>;

const REDACT_KEYS = ["pass", "password", "token", "secret", "apikey", "apiKey"];

export interface LoggerOptions {
  level?: string; // trace|debug|info|warn|error
  format?: "json" | "pretty";
}

export function createLogger(opts: LoggerOptions = {}): Logger {
  const level = opts.level ?? "info";
  const transport =
    opts.format === "pretty"
      ? { target: "pino-pretty", options: { destination: 2 } } // 2 = stderr
      : undefined;

  return pino(
    {
      level,
      redact: { paths: REDACT_KEYS.flatMap((k) => [k, `*.${k}`, `*.*.${k}`]), censor: "***" },
    },
    // Ohne pretty-transport: direkt auf fd 2 (stderr) schreiben.
    transport ? pino.transport(transport) : pino.destination(2),
  );
}
