// Config-Loader: liest entweder Env-Vars (Single-Account) oder TOML (Multi-Account), ergänzt Provider-Presets, validiert, prüft 0600.
import { readFileSync, statSync } from "node:fs";
import { parse as parseToml } from "smol-toml";
import { ConfigError, PermissionError } from "../lib/errors.js";
import { detectProvider } from "./providers.js";
import { type AccountConfig, type FileConfig, type LimitsConfig, accountSchema, fileConfigSchema } from "./schema.js";
import { defaultConfigPath } from "./xdg.js";

export interface ConfigStore {
  mode: "env" | "config-file";
  defaultAccount: string;
  accounts: Map<string, AccountConfig>;
  limits: LimitsConfig;
  configPath?: string;
}

// Env-Var-Auflösung mit Cascade:
//   1. CLASSIC_<NAME>          (neuer Prefix, für Kollisionsfälle)
//   2. CLASSIC_IMAP_SMTP_<OLD> (alter Prefix, Rückwärtskompatibilität)
//   3. <NAME>                  (Bare Name, Default)
//   4. <OLD>                   (alter Bare Name, Rückwärtskompatibilität)
const PREFIX = "CLASSIC_";
const LEGACY_PREFIX = "CLASSIC_IMAP_SMTP_";

function envVal(name: string, legacyName?: string): string | undefined {
  return (
    process.env[`${PREFIX}${name}`] ??
    (legacyName ? process.env[`${LEGACY_PREFIX}${legacyName}`] : undefined) ??
    process.env[name] ??
    (legacyName ? process.env[legacyName] : undefined)
  );
}

function numEnv(name: string, legacyName?: string): number | undefined {
  const v = envVal(name, legacyName);
  return v ? Number.parseInt(v, 10) : undefined;
}

// Liest die Single-Account-Konfiguration aus Env-Vars.
function loadFromEnv(): ConfigStore | null {
  const user = envVal("USERNAME", "USER");
  const pass = envVal("PASSWORD", "PASS");
  if (!user || !pass) return null;

  const preset = detectProvider(user);
  const raw = {
    name: "default",
    user,
    pass,
    from_name: envVal("FROM_NAME"),
    imap_host: envVal("IMAP_HOST") ?? preset?.imap_host,
    imap_port: numEnv("IMAP_PORT") ?? preset?.imap_port ?? 993,
    imap_tls: envVal("IMAP_TLS") ?? preset?.imap_tls ?? "implicit",
    smtp_host: envVal("SMTP_HOST") ?? preset?.smtp_host,
    smtp_port: numEnv("SMTP_PORT") ?? preset?.smtp_port ?? 465,
    smtp_tls: envVal("SMTP_TLS") ?? preset?.smtp_tls ?? "implicit",
    verify_tls: envVal("VERIFY_TLS") !== "false",
  };
  const account = accountSchema.parse(normalizeTls(raw));
  return {
    mode: "env",
    defaultAccount: "default",
    accounts: new Map([["default", account]]),
    limits: { smtp_per_minute: 10, imap_ops_per_second: 100 },
  };
}

// Lädt und validiert die TOML-Config-Datei, prüft Datei-Permissions (0600 empfohlen).
function loadFromFile(path: string): ConfigStore {
  let text: string;
  try {
    checkPermissions(path);
    text = readFileSync(path, "utf8");
  } catch (err) {
    if (err instanceof PermissionError) throw err;
    throw new ConfigError(`Cannot read config file: ${path}`, { cause: String(err) });
  }
  let parsed: FileConfig;
  try {
    parsed = fileConfigSchema.parse(parseToml(text));
  } catch (err) {
    throw new ConfigError("Invalid config file", { cause: String(err) });
  }

  const accounts = new Map<string, AccountConfig>();
  for (const acc of parsed.accounts) {
    const preset = detectProvider(acc.user);
    accounts.set(acc.name, {
      ...acc,
      imap_host: acc.imap_host ?? preset?.imap_host,
      smtp_host: acc.smtp_host ?? preset?.smtp_host,
    });
  }
  // biome-ignore lint/style/noNonNullAssertion: zod validates accounts min(1)
  const defaultAccount = parsed.default_account ?? parsed.accounts[0]!.name;
  return {
    mode: "config-file",
    defaultAccount,
    accounts,
    limits: parsed.limits ?? { smtp_per_minute: 10, imap_ops_per_second: 100 },
    configPath: path,
  };
}

// Haupteinstieg: Env hat Vorrang, sonst Config-File. Wirft, wenn keins vorhanden.
export function loadConfig(explicitPath?: string): ConfigStore {
  const fromEnv = loadFromEnv();
  if (fromEnv) return fromEnv;

  const path = explicitPath ?? defaultConfigPath();
  return loadFromFile(path);
}

function checkPermissions(path: string): void {
  if (process.platform === "win32") return; // POSIX-Permissions nicht anwendbar
  const mode = statSync(path).mode & 0o777;
  if (mode & 0o077) {
    throw new PermissionError(
      `Config file ${path} is too permissive (mode ${mode.toString(8)}); expected 0600`,
      { path, mode: mode.toString(8) },
    );
  }
}

// "true" -> implicit, "starttls" -> starttls, "false" -> none (Env akzeptiert true/false/starttls).
function normalizeTls(raw: Record<string, unknown>): Record<string, unknown> {
  const map = (v: unknown) =>
    v === "true" || v === true ? "implicit" : v === "false" || v === false ? "none" : v;
  return { ...raw, imap_tls: map(raw.imap_tls), smtp_tls: map(raw.smtp_tls) };
}
