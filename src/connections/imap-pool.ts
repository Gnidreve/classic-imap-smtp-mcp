// IMAP-Connection-Pool: persistente imapflow-Connection pro Account, Reconnect mit Exp-Backoff
// (1s → 2s → 4s → 8s → 16s → 60s, max 5 Retries), 5min Idle-Timeout.
import { ImapFlow } from "imapflow";
import type { ImapFlowOptions } from "imapflow";
import type { ConfigStore } from "../config/loader.js";
import type { AccountConfig } from "../config/schema.js";
import { AuthError, ImapProtocolError, TlsError } from "../lib/errors.js";
import type { Logger } from "../server/logging.js";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60000;
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export class ImapPool {
  private connections = new Map<string, { client: ImapFlow; lastUsed: number }>();

  constructor(
    private readonly config: ConfigStore,
    private readonly logger: Logger,
  ) {}

  async acquire(account: string): Promise<ImapFlow> {
    const existing = this.connections.get(account);
    if (existing?.client.usable) {
      existing.lastUsed = Date.now();
      return existing.client;
    }

    if (existing) {
      try {
        await existing.client.logout();
      } catch {
        /* ignore */
      }
      this.connections.delete(account);
    }

    const accConfig = this.config.accounts.get(account);
    if (!accConfig) {
      throw new ImapProtocolError(`Account ${account} not configured`);
    }

    const client = await this.connectWithRetry(accConfig);
    this.connections.set(account, { client, lastUsed: Date.now() });
    return client;
  }

  private async connectWithRetry(acc: AccountConfig, attempt = 0): Promise<ImapFlow> {
    try {
      const opts: ImapFlowOptions = {
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
      this.logger.info({ account: acc.name }, "IMAP connected");
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
        this.logger.warn({ account: acc.name, attempt: attempt + 1, delay }, "IMAP reconnect");
        await sleep(delay);
        return this.connectWithRetry(acc, attempt + 1);
      }

      throw new ImapProtocolError(`Failed to connect to IMAP: ${error.message}`);
    }
  }

  async pruneIdle(): Promise<void> {
    const now = Date.now();
    for (const [account, entry] of this.connections) {
      if (now - entry.lastUsed > IDLE_TIMEOUT_MS) {
        this.logger.info({ account }, "Closing idle IMAP connection");
        try {
          await entry.client.logout();
        } catch {
          /* ignore */
        }
        this.connections.delete(account);
      }
    }
  }

  async closeAll(): Promise<void> {
    for (const [account, entry] of this.connections) {
      try {
        if (entry.client.usable) await entry.client.logout();
      } catch (err) {
        this.logger.warn({ account, err }, "Error closing IMAP connection");
      }
    }
    this.connections.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
