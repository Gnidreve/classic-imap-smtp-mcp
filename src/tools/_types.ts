// Zentrale Typen: ToolDefinition-Interface (eine Datei = ein Tool exportiert das) + ToolContext (DI-Container) + Kategorien.
import type { ZodTypeAny, z } from "zod";
import type { ConfigStore } from "../config/loader.js";
import type { ImapPool } from "../connections/imap-pool.js";
import type { SmtpPool } from "../connections/smtp-pool.js";
import type { Logger } from "../server/logging.js";

export type ToolCategory = "imap-read" | "imap-write" | "imap-mailbox" | "smtp" | "meta";

export interface ServerFlags {
  safe: boolean;
  readonly: boolean;
  noImap: boolean;
  noSmtp: boolean;
  allowTools?: string[];
  denyTools?: string[];
}

// Wird per Dependency Injection an jeden Handler gegeben — niemals Globals verwenden.
export interface ToolContext {
  config: ConfigStore;
  imap: ImapPool;
  smtp: SmtpPool;
  logger: Logger;
  flags: ServerFlags;
  activeTools: string[];
}

// Infer the input type from a Zod schema
type InferInput<T extends ZodTypeAny> = z.input<T>;

export interface ToolDefinition<TInputSchema extends ZodTypeAny = ZodTypeAny, TOutput = unknown> {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: TInputSchema;
  handler: (input: InferInput<TInputSchema>, ctx: ToolContext) => Promise<TOutput>;
}

// Hilfsfunktion, um ein Tool typsicher zu definieren.
export function defineTool<TSchema extends ZodTypeAny, TOutput>(
  def: ToolDefinition<TSchema, TOutput>,
): ToolDefinition<TSchema, TOutput> {
  return def;
}

// Convenience type aliases for handler patterns
export type HandlerFn<TInput, TOutput> = (input: TInput, ctx: ToolContext) => Promise<TOutput>;
