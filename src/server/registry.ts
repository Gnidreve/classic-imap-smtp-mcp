// Registry: 3-Stufen-Kaskade (Feature-Flags -> Allow -> Deny, fein gewinnt). Entscheidet, welche Tools beim Start registriert werden.
import type { ToolDefinition } from "../tools/_types.js";
import type { ResolvedOptions } from "./options.js";

// Tools, die im --readonly-Modus erlaubt bleiben (lesend + introspektiv).
const READONLY_TOOLS = new Set<string>([
  "imap_list_mailboxes", "imap_status_mailbox", "imap_list_messages", "imap_get_message",
  "imap_get_message_headers", "imap_get_message_raw", "imap_get_messages_bulk", "imap_search",
  "imap_download_attachment", "imap_get_thread", "imap_get_quota", "imap_check_capabilities",
  "smtp_verify_connection", "account_list", "meta_health", "meta_server_info",
]);

// Tools, die --safe entfernt (Loeschen).
const DELETE_TOOLS = new Set<string>([
  "imap_delete_message", "imap_expunge", "imap_delete_mailbox",
]);

// Praefix-Wildcard-Match: "imap_*" matcht "imap_search"; exakte Namen matchen exakt.
function matchesAny(name: string, patterns: string[]): boolean {
  return patterns.some((p) => (p.endsWith("*") ? name.startsWith(p.slice(0, -1)) : name === p));
}

// Stufe 1: grobe Basis-Menge aus den vier Feature-Flags.
function passesFeatureFlags(t: ToolDefinition, o: ResolvedOptions): boolean {
  if (o.noImap && t.category.startsWith("imap")) return false;
  if (o.noSmtp && t.category === "smtp") return false;
  if (o.readonly && !READONLY_TOOLS.has(t.name)) return false;
  if (o.safe && DELETE_TOOLS.has(t.name)) return false;
  return true;
}

// Wendet die volle Kaskade an und liefert die zu registrierenden Tools.
export function resolveActiveTools(all: ToolDefinition[], o: ResolvedOptions): ToolDefinition[] {
  const active = new Set<string>();

  // Stufe 1: Feature-Flags
  for (const t of all) if (passesFeatureFlags(t, o)) active.add(t.name);

  // Stufe 2: Allow ueberschreibt Feature-Flags (b-Logik: kann Tools zurueckholen)
  if (o.allowTools?.length) {
    for (const t of all) if (matchesAny(t.name, o.allowTools)) active.add(t.name);
  }

  // Stufe 3: Deny gewinnt ueber alles
  if (o.denyTools?.length) {
    for (const name of [...active]) if (matchesAny(name, o.denyTools)) active.delete(name);
  }

  return all.filter((t) => active.has(t.name));
}
