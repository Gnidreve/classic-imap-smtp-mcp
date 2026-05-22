// SMTP-Transport-Pool: nodemailer-Transport pro Account, gepoolt (max 1 Connection, 100 Msg/Connection).
// PHASE 3: Implementierung. Aktuell Stub mit Signaturen.
import type { Transporter } from "nodemailer";
import type { ConfigStore } from "../config/loader.js";
import type { Logger } from "../server/logging.js";

export class SmtpPool {
  constructor(
    private readonly config: ConfigStore,
    private readonly logger: Logger,
  ) {}

  // Liefert einen nodemailer-Transporter fuer den Account.
  async acquire(_account: string): Promise<Transporter> {
    throw new Error("SmtpPool.acquire not implemented (Phase 3)");
  }

  async closeAll(): Promise<void> {
    /* Phase 3 */
  }
}
