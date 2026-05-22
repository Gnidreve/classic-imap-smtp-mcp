// Zentrale Typen: ToolDefinition-Interface (eine Datei = ein Tool exportiert das) + ToolContext (DI-Container) + Kategorien.
import type { ZodTypeAny } from "zod";
import type { ConfigStore } from "../config/loader.js";
import type { ImapPool } from "../connections/imap-pool.js";
import type { SmtpPool } from "../connections/smtp-pool.js";
import type { Logger } from "../server/logging.js";

export type ToolCategory =
  | "imap-read"
  | "imap-write"
  | "imap-mailbox"
  | "smtp"
  | "account"
  | "meta";

// Wird per Dependency Injection an jeden Handler gegeben — niemals Globals verwenden.
export interface ToolContext {
  config: ConfigStore;
  imap: ImapPool;
  smtp: SmtpPool;
  logger: Logger;
  resolveAccount(name?: string): string; // Account-Name oder Default; wirft AccountNotFoundError
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: ZodTypeAny;
  handler: (input: TInput, ctx: ToolContext) => Promise<TOutput>;
}

// Hilfsfunktion, um ein Tool typsicher zu definieren.
export function defineTool<TInput, TOutput>(
  def: ToolDefinition<TInput, TOutput>,
): ToolDefinition<TInput, TOutput> {
  return def;
}
