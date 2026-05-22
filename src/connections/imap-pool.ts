// IMAP-Connection-Pool: persistente imapflow-Connection pro Account, Reconnect mit Exp-Backoff (1->60s, max 5), 5min Idle-Timeout.
// PHASE 3: Implementierung. Aktuell Stub mit Signaturen.
import type { ImapFlow } from "imapflow";
import type { ConfigStore } from "../config/loader.js";
import type { Logger } from "../server/logging.js";

export class ImapPool {
  constructor(
    private readonly config: ConfigStore,
    private readonly logger: Logger,
  ) {}

  // Liefert eine verbundene imapflow-Instanz fuer den Account (reconnect bei Bedarf).
  async acquire(_account: string): Promise<ImapFlow> {
    throw new Error("ImapPool.acquire not implemented (Phase 3)");
  }

  // Schliesst alle offenen Connections (Shutdown).
  async closeAll(): Promise<void> {
    /* Phase 3 */
  }
}
