// SMTP-Transport-Pool: nodemailer-Transport pro Account, gepoolt (max 1 Connection, 100 Msg/Connection).
// Rate-Limiting: 10 Messages/Minute (Token-Bucket).
import nodemailer, { type Transporter } from "nodemailer";
import type { ConfigStore } from "../config/loader.js";
import type { AccountConfig } from "../config/schema.js";
import { AuthError, RateLimitError, SmtpRelayError } from "../lib/errors.js";
import type { Logger } from "../server/logging.js";

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 Minute
const DEFAULT_RATE_LIMIT = 10; // Max Messages pro Minute

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

export class SmtpPool {
  private transports = new Map<string, Transporter>();
  private rateBuckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly config: ConfigStore,
    private readonly logger: Logger,
  ) {}

  // Liefert einen nodemailer-Transporter für den Account.
  async acquire(account: string): Promise<Transporter> {
    // Rate-Limit prüfen
    this.checkRateLimit(account);

    const existing = this.transports.get(account);
    if (existing) return existing;

    const accConfig = this.config.accounts.get(account);
    if (!accConfig) {
      throw new SmtpRelayError(`Account ${account} not configured`);
    }

    const transport = await this.createTransport(accConfig);
    this.transports.set(account, transport);
    return transport;
  }

  private checkRateLimit(account: string): void {
    const limit = DEFAULT_RATE_LIMIT;
    const bucket = this.rateBuckets.get(account) ?? { tokens: limit, lastRefill: Date.now() };

    // Refill tokens
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    if (elapsed >= RATE_LIMIT_WINDOW_MS) {
      bucket.tokens = limit;
      bucket.lastRefill = now;
    }

    if (bucket.tokens <= 0) {
      throw new RateLimitError(`SMTP rate limit (${limit}/minute) reached for account ${account}`);
    }

    bucket.tokens--;
    this.rateBuckets.set(account, bucket);
  }

  private async createTransport(acc: AccountConfig): Promise<Transporter> {
    try {
      const tlsOpts: Record<string, unknown> = {};
      if (!acc.verify_tls) {
        tlsOpts.rejectUnauthorized = false;
      }

      const transporter = nodemailer.createTransport({
        host: acc.smtp_host!,
        port: acc.smtp_port,
        secure: acc.smtp_tls === "implicit",
        auth: {
          user: acc.user,
          pass: acc.pass,
        },
        tls: tlsOpts,
        // STARTTLS: wird von nodemailer automatisch bei secure=false und Port 587/25 verwendet
        pool: true,
        maxConnections: 1,
        maxMessages: 100,
        logger: false,
      });

      this.logger.info({ account: acc.name }, "SMTP transport created");
      return transporter;
    } catch (err) {
      const error = err as Error;
      if (error.message?.includes("auth") || error.message?.includes("login")) {
        throw new AuthError(`SMTP authentication failed: ${error.message}`);
      }
      throw new SmtpRelayError(`Failed to create SMTP transport: ${error.message}`);
    }
  }

  async closeAll(): Promise<void> {
    for (const [account, transport] of this.transports) {
      try {
        transport.close();
      } catch (err) {
        this.logger.warn({ account, err }, "Error closing SMTP transport");
      }
    }
    this.transports.clear();
    this.rateBuckets.clear();
  }
}
