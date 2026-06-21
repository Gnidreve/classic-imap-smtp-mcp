// MCP-Server-Aufbau (SDK v1.x): erzeugt McpServer, registriert die aktiven Tools, mappt Handler-Ergebnisse + Errors auf MCP-Content.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpMailError } from "../lib/errors.js";
import type { ToolContext } from "../tools/_types.js";
import { ALL_TOOLS } from "../tools/index.js";
import type { Logger } from "./logging.js";
import type { ResolvedOptions } from "./options.js";
import { resolveActiveTools } from "./registry.js";

export const SERVER_NAME = "classic-imap-smtp-mcp";
export const SERVER_VERSION = "0.4.0";

export function buildServer(opts: ResolvedOptions, ctx: ToolContext, logger: Logger): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  const active = resolveActiveTools(ALL_TOOLS, opts);

  logger.info({ count: active.length, tools: active.map((t) => t.name) }, "Registering tools");

  for (const tool of active) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      async (input: unknown) => {
        try {
          const result = await tool.handler(input, ctx);
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          const payload =
            err instanceof McpMailError
              ? err.toResult()
              : { code: "INTERNAL_ERROR", message: String(err) };
          logger.error({ tool: tool.name, err: payload }, "Tool call failed");
          return {
            isError: true,
            content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
          };
        }
      },
    );
  }

  return server;
}

export async function runStdio(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
