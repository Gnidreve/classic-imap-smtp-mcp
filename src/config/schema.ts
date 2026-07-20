// Zod-Schemas für Account und Limits. Validiert beim Laden aus Env-Vars.
import { z } from "zod";

export const tlsModeSchema = z.union([
  z.literal("implicit"),
  z.literal("starttls"),
  z.literal("none"),
]);
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
export type LimitsConfig = z.infer<typeof limitsSchema>;
