// SMTP-Transport-Pool: nodemailer-Transport, gepoolt (max 1 Connection, 100 Msg/Connection).
// Rate-Limiting: 10 Messages/Minute (Token-Bucket).
import nodemailer, { type Transporter } from "nodemailer";
import type { ConfigStore } from "../config/loader.js";
import { AuthError, RateLimitError, SmtpRelayError } from "../lib/errors.js";
import type { Logger } from "../server/logging.js";

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 Minute

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

export class SmtpPool {
  private transport: Transporter | null = null;
  private rateBucket: RateLimitBucket = { tokens: 10, lastRefill: Date.now() };
  private rateLimitPerMinute: number;

  constructor(
    private readonly config: ConfigStore,
    private readonly logger: Logger,
  ) {
    this.rateLimitPerMinute = config.limits?.smtp_per_minute ?? 10;
  }

  // Liefert einen nodemailer-Transporter.
  async acquire(): Promise<Transporter> {
    // Rate-Limit prüfen
    this.checkRateLimit();

    if (this.transport) return this.transport;

    this.transport = await this.createTransport();
    return this.transport;
  }

  private checkRateLimit(): void {
    const limit = this.rateLimitPerMinute;
    const now = Date.now();
    const elapsed = now - this.rateBucket.lastRefill;

    if (elapsed >= RATE_LIMIT_WINDOW_MS) {
      this.rateBucket.tokens = limit;
      this.rateBucket.lastRefill = now;
    }

    if (this.rateBucket.tokens <= 0) {
      throw new RateLimitError(`SMTP rate limit (${limit}/minute) reached`);
    }

    this.rateBucket.tokens--;
  }

  private async createTransport(): Promise<Transporter> {
    const acc = this.config.account;
    try {
      const tlsOpts: Record<string, unknown> = {};
      if (!acc.verify_tls) {
        tlsOpts.rejectUnauthorized = false;
      }

      const transporter = nodemailer.createTransport({
        // biome-ignore lint/style/noNonNullAssertion: validated at load
        host: acc.smtp_host!,
        port: acc.smtp_port,
        secure: acc.smtp_tls === "implicit",
        auth: {
          user: acc.user,
          pass: acc.pass,
        },
        tls: tlsOpts,
        pool: true,
        maxConnections: 1,
        maxMessages: 100,
        logger: false,
      });

      this.logger.info("SMTP transport created");
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
    if (this.transport) {
      try {
        this.transport.close();
      } catch (err) {
        this.logger.warn({ err }, "Error closing SMTP transport");
      }
      this.transport = null;
    }
    this.rateBucket = { tokens: 10, lastRefill: Date.now() };
  }
}
