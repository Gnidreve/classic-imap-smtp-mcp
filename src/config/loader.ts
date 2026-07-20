// Config-Loader: liest Single-Account-Konfiguration aus Env-Vars, ergänzt Provider-Presets, validiert.
import { detectProvider } from "./providers.js";
import { type AccountConfig, type LimitsConfig, accountSchema } from "./schema.js";

export interface ConfigStore {
  account: AccountConfig;
  limits: LimitsConfig;
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

// "true" -> implicit, "starttls" -> starttls, "false" -> none (Env akzeptiert true/false/starttls).
function normalizeTls(raw: Record<string, unknown>): Record<string, unknown> {
  const map = (v: unknown) =>
    v === "true" || v === true ? "implicit" : v === "false" || v === false ? "none" : v;
  return { ...raw, imap_tls: map(raw.imap_tls), smtp_tls: map(raw.smtp_tls) };
}

// Liest die Single-Account-Konfiguration aus Env-Vars.
// Wirft einen Fehler, wenn USERNAME oder PASSWORD nicht gesetzt sind.
export function loadConfig(): ConfigStore {
  const user = envVal("USERNAME", "USER");
  const pass = envVal("PASSWORD", "PASS");
  if (!user || !pass) {
    throw new Error(
      `Missing IMAP credentials. Set USERNAME and PASSWORD environment variables.\n  ${PREFIX}USERNAME=you@example.com\n  ${PREFIX}PASSWORD=your-app-password\nSee docs/config.md for full reference.`,
    );
  }

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
    account,
    limits: { smtp_per_minute: 10, imap_ops_per_second: 100 },
  };
}
