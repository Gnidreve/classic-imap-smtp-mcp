// Beispiel-Unit-Test: prueft die Kaskaden-Logik der Registry (Feature-Flags, Allow ueberschreibt, Deny gewinnt, Wildcards).
import { describe, expect, it } from "vitest";
import type { ToolDefinition } from "../tools/_types.js";
import type { ResolvedOptions } from "./options.js";
import { resolveActiveTools } from "./registry.js";

const base: ResolvedOptions = {
  safe: false,
  readonly: false,
  noImap: false,
  noSmtp: false,
  transport: "stdio",
  logLevel: "info",
  logFormat: "json",
  httpHost: "127.0.0.1",
  httpPort: 3000,
  httpEndpoint: "/mcp",
  sseEndpoint: "/sse",
  messagesEndpoint: "/messages",
};

const fakeTool = (name: string, category: ToolDefinition["category"]): ToolDefinition => ({
  name,
  category,
  description: "",
  inputSchema: {} as never,
  handler: async () => ({}),
});

const TOOLS: ToolDefinition[] = [
  fakeTool("imap_get_message", "imap-read"),
  fakeTool("imap_delete_message", "imap-write"),
  fakeTool("imap_delete_mailbox", "imap-mailbox"),
  fakeTool("smtp_send", "smtp"),
  fakeTool("account_add", "account"),
  fakeTool("meta_server_info", "meta"),
];

const names = (o: ResolvedOptions) =>
  resolveActiveTools(TOOLS, o)
    .map((t) => t.name)
    .sort();

describe("resolveActiveTools cascade", () => {
  it("default: all tools active", () => {
    expect(names(base)).toHaveLength(6);
  });

  it("--safe removes delete tools", () => {
    const r = names({ ...base, safe: true });
    expect(r).not.toContain("imap_delete_message");
    expect(r).not.toContain("imap_delete_mailbox");
    expect(r).toContain("smtp_send");
  });

  it("--no-smtp removes smtp; allow brings it back (b-logic)", () => {
    expect(names({ ...base, noSmtp: true })).not.toContain("smtp_send");
    expect(names({ ...base, noSmtp: true, allowTools: ["smtp_send"] })).toContain("smtp_send");
  });

  it("--deny wins over allow with wildcard", () => {
    const r = names({ ...base, allowTools: ["account_*"], denyTools: ["account_*"] });
    expect(r).not.toContain("account_add");
  });
});
