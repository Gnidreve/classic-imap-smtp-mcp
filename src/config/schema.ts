// Zod-Schemas für Account, Config-File und Env-Vars (Präfix CLASSIC_IMAP_SMTP_). Validiert beim Laden.
import { z } from "zod";

export const tlsModeSchema = z.union([z.literal("implicit"), z.literal("starttls"), z.literal("none")]);
export type TlsMode = z.infer<typeof tlsModeSchema>;

export const accountSchema = z.object({
  name: z.string().min(1),
  user: z.string().min(1),
  pass: z.string().min(1),
  from_name: z.string().optional(),
  imap_host: z.string().optional(), // optional bei Auto-Detect-Providern
  imap_port: z.number().int().positive().default(993),
  imap_tls: tlsModeSchema.default("implicit"),
  smtp_host: z.string().optional(),
  smtp_port: z.number().int().positive().default(465),
  smtp_tls: tlsModeSchema.default("implicit"),
  verify_tls: z.boolean().default(true),
});
export type AccountConfig = z.infer<typeof accountSchema>;

export const limitsSchema = z.object({
  smtp_per_minute: z.number().int().positive().default(10),
  imap_ops_per_second: z.number().int().positive().default(100),
});

export const fileConfigSchema = z.object({
  default_account: z.string().optional(),
  limits: limitsSchema.default({ smtp_per_minute: 10, imap_ops_per_second: 100 }),
  accounts: z.array(accountSchema).min(1),
});
export type FileConfig = z.infer<typeof fileConfigSchema>;
