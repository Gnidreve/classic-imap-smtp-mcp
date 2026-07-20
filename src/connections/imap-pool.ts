// IMAP-Connection-Pool: persistente imapflow-Connection, Reconnect mit Exp-Backoff
// (1s → 2s → 4s → 8s → 16s → 60s, max 5 Retries), 5min Idle-Timeout.
import { ImapFlow, type ImapFlowOptions } from "imapflow";
import type { ConfigStore } from "../config/loader.js";
import { AuthError, ImapProtocolError, TlsError } from "../lib/errors.js";
import type { Logger } from "../server/logging.js";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60000;
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export class ImapPool {
  private client: ImapFlow | null = null;
  private lastUsed = 0;

  constructor(
    private readonly config: ConfigStore,
    private readonly logger: Logger,
  ) {}

  async acquire(): Promise<ImapFlow> {
    if (this.client?.usable) {
      this.lastUsed = Date.now();
      return this.client;
    }

    if (this.client) {
      try {
        await this.client.logout();
      } catch {
        /* ignore */
      }
      this.client = null;
    }

    this.client = await this.connectWithRetry();
    this.lastUsed = Date.now();
    return this.client;
  }

  private async connectWithRetry(attempt = 0): Promise<ImapFlow> {
    const acc = this.config.account;
    try {
      const opts: ImapFlowOptions = {
        // biome-ignore lint/style/noNonNullAssertion: validated at load
        host: acc.imap_host!,
        port: acc.imap_port,
        auth: {
          user: acc.user,
          pass: acc.pass,
        },
        logger: false,
        secure: acc.imap_tls !== "starttls" && acc.imap_tls !== "none",
      };

      if (acc.imap_tls === "none") {
        (opts as unknown as Record<string, unknown>).disableAutoIdle = true;
      }

      if (!acc.verify_tls) {
        (opts as unknown as Record<string, unknown>).tls = { rejectUnauthorized: false };
      }

      const client = new ImapFlow(opts);
      await client.connect();
      this.logger.info("IMAP connected");
      return client;
    } catch (err) {
      const error = err as Error;
      if (error.message?.includes("TLS") || error.message?.includes("certificate")) {
        throw new TlsError(`IMAP TLS error: ${error.message}`);
      }
      if (
        error.message?.includes("authentication") ||
        error.message?.includes("login") ||
        error.message?.includes("Auth")
      ) {
        throw new AuthError(`IMAP authentication failed: ${error.message}`);
      }

      if (attempt < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
        this.logger.warn({ attempt: attempt + 1, delay }, "IMAP reconnect");
        await sleep(delay);
        return this.connectWithRetry(attempt + 1);
      }

      throw new ImapProtocolError(`Failed to connect to IMAP: ${error.message}`);
    }
  }

  async pruneIdle(): Promise<void> {
    if (!this.client) return;
    if (Date.now() - this.lastUsed > IDLE_TIMEOUT_MS) {
      this.logger.info("Closing idle IMAP connection");
      try {
        await this.client.logout();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
  }

  async closeAll(): Promise<void> {
    if (!this.client) return;
    try {
      if (this.client.usable) await this.client.logout();
    } catch (err) {
      this.logger.warn({ err }, "Error closing IMAP connection");
    }
    this.client = null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
