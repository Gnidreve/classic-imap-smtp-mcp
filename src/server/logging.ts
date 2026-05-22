// Logger via pino, schreibt AUSSCHLIESSLICH auf stderr (stdout = MCP-Protokoll). Sanitizer maskiert Credentials immer.
import { pino } from "pino";

export type Logger = ReturnType<typeof pino>;

const REDACT_KEYS = ["pass", "password", "token", "secret", "apikey", "apiKey"];

export interface LoggerOptions {
  level?: string;
  format?: "json" | "pretty";
}

export function createLogger(opts: LoggerOptions = {}): Logger {
  const level = opts.level ?? "info";
  const format = opts.format ?? "json";

  if (format === "pretty") {
    return pino({
      level,
      redact: { paths: REDACT_KEYS.flatMap((k) => [k, `*.${k}`, `*.*.${k}`]), censor: "***" },
      transport: { target: "pino-pretty", options: { destination: 2 } },
    });
  }

  return pino({
    level,
    redact: { paths: REDACT_KEYS.flatMap((k) => [k, `*.${k}`, `*.*.${k}`]), censor: "***" },
  });
}
