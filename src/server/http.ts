import { randomUUID } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "./logging.js";
import type { ResolvedOptions } from "./options.js";

type HttpTransport = SSEServerTransport | StreamableHTTPServerTransport;
type NodeRequest = Parameters<StreamableHTTPServerTransport["handleRequest"]>[0];
type NodeResponse = Parameters<StreamableHTTPServerTransport["handleRequest"]>[1];
type HttpRequest = NodeRequest & {
  body?: unknown;
  headers: IncomingHttpHeaders;
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};
type HttpResponse = NodeResponse & {
  headersSent: boolean;
  json(payload: unknown): void;
  status(code: number): {
    end(): void;
    json(payload: unknown): void;
  };
};

export interface HttpRuntime {
  close(): Promise<void>;
}

export async function runHttp(
  opts: ResolvedOptions,
  logger: Logger,
  createServer: () => McpServer,
): Promise<HttpRuntime> {
  const app = createMcpExpressApp({ host: opts.httpHost });
  const transports = new Map<string, HttpTransport>();

  const connectServer = async (transport: HttpTransport): Promise<void> => {
    const server = createServer();
    transport.onclose = () => {
      const sessionId = transport.sessionId;
      if (sessionId) transports.delete(sessionId);
      server.close().catch((err) => logger.warn({ err }, "Error closing MCP server session"));
    };
    transport.onerror = (err) => logger.warn({ err }, "HTTP transport error");
    await server.connect(transport as Parameters<McpServer["connect"]>[0]);
  };

  app.all(opts.httpEndpoint, async (req: HttpRequest, res: HttpResponse) => {
    try {
      const sessionId = req.headers["mcp-session-id"];
      let transport: StreamableHTTPServerTransport;

      if (typeof sessionId === "string") {
        const existing = transports.get(sessionId);
        if (existing instanceof StreamableHTTPServerTransport) {
          transport = existing;
        } else if (existing) {
          res.status(400).json(jsonRpcError("Session exists with a different transport"));
          return;
        } else {
          res.status(400).json(jsonRpcError("Unknown MCP session ID"));
          return;
        }
      } else if (req.method === "POST" && isInitializeRequest(req.body)) {
        const newTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports.set(id, newTransport);
            logger.info({ sessionId: id }, "HTTP MCP session initialized");
          },
        });
        transport = newTransport;
        await connectServer(transport);
      } else {
        res.status(400).json(jsonRpcError("No valid MCP session ID provided"));
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      logger.error({ err }, "HTTP MCP request failed");
      if (!res.headersSent) res.status(500).json(jsonRpcError("Internal server error"));
    }
  });

  app.get(opts.sseEndpoint, async (_req: HttpRequest, res: HttpResponse) => {
    try {
      const transport = new SSEServerTransport(opts.messagesEndpoint, res);
      transports.set(transport.sessionId, transport);
      logger.info({ sessionId: transport.sessionId }, "Legacy SSE MCP session initialized");
      await connectServer(transport);
    } catch (err) {
      logger.error({ err }, "Legacy SSE session setup failed");
      if (!res.headersSent) res.status(500).end();
    }
  });

  app.post(opts.messagesEndpoint, async (req: HttpRequest, res: HttpResponse) => {
    const sessionId = typeof req.query?.sessionId === "string" ? req.query.sessionId : undefined;
    if (!sessionId) {
      res.status(400).json(jsonRpcError("Missing sessionId"));
      return;
    }

    const existing = transports.get(sessionId);
    if (!(existing instanceof SSEServerTransport)) {
      res.status(400).json(jsonRpcError("No SSE transport found for sessionId"));
      return;
    }

    try {
      await existing.handlePostMessage(req, res, req.body);
    } catch (err) {
      logger.error({ err, sessionId }, "Legacy SSE message handling failed");
      if (!res.headersSent) res.status(500).json(jsonRpcError("Internal server error"));
    }
  });

  const server = await new Promise<import("node:http").Server>((resolve, reject) => {
    const httpServer = app.listen(opts.httpPort, opts.httpHost, () => resolve(httpServer));
    httpServer.once("error", reject);
  });

  logger.info(
    {
      host: opts.httpHost,
      port: opts.httpPort,
      endpoint: opts.httpEndpoint,
      sseEndpoint: opts.sseEndpoint,
      messagesEndpoint: opts.messagesEndpoint,
    },
    "classic-imap-smtp-mcp running over HTTP",
  );

  return {
    async close() {
      await Promise.allSettled(Array.from(transports.values(), (transport) => transport.close()));
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}

function jsonRpcError(message: string) {
  return {
    jsonrpc: "2.0",
    error: { code: -32000, message },
    id: null,
  };
}
