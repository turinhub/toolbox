import {
  Client,
  StreamableHTTPClientTransport,
  type FetchLike,
} from "@modelcontextprotocol/client";
import {
  createSafeMcpFetch,
  McpSecurityError,
  redactErrorText,
  sanitizeOutboundHeaders,
  validateMcpTarget,
} from "@/lib/mcp-tester/security";
import type {
  McpConnectionInfo,
  McpInspectResult,
  McpTesterRequest,
  McpTesterSuccess,
  McpTraceEntry,
} from "@/lib/mcp-tester/types";

const MAX_ITEMS = 200;

export class McpTesterClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly causeValue?: unknown
  ) {
    super(message);
    this.name = "McpTesterClientError";
  }
}

function sanitizeMcpContent(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeMcpContent);
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  if (record.type === "image" || record.type === "audio") {
    const data = typeof record.data === "string" ? record.data : "";
    return {
      ...record,
      data: `[binary content omitted: ${data.length} base64 characters]`,
    };
  }
  if (typeof record.blob === "string") {
    return {
      ...record,
      blob: `[binary resource omitted: ${record.blob.length} base64 characters]`,
    };
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, sanitizeMcpContent(item)])
  );
}

function connectionInfo(client: Client): McpConnectionInfo {
  const server = client.getServerVersion();
  const capabilities = client.getServerCapabilities() ?? {};
  return {
    protocolVersion: client.getNegotiatedProtocolVersion(),
    protocolEra: client.getProtocolEra(),
    serverInfo: server
      ? {
          name: server.name,
          version: server.version,
        }
      : undefined,
    instructions: client.getInstructions(),
    capabilities: Object.keys(capabilities).sort(),
  };
}

function isTimeoutError(error: unknown, seen = new Set<unknown>()): boolean {
  if (!error || (typeof error !== "object" && typeof error !== "string")) {
    return false;
  }
  if (seen.has(error)) return false;
  seen.add(error);

  if (typeof error === "string") {
    return /\b(?:timeout|timed out)\b/i.test(error);
  }

  const candidate = error as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
    cause?: unknown;
  };
  if (candidate.name === "TimeoutError") return true;
  if (
    typeof candidate.code === "string" &&
    candidate.code.toUpperCase().includes("TIMEOUT")
  ) {
    return true;
  }
  if (
    typeof candidate.message === "string" &&
    /\b(?:timeout|timed out)\b/i.test(candidate.message)
  ) {
    return true;
  }
  return isTimeoutError(candidate.cause, seen);
}

async function traced<T>(
  trace: McpTraceEntry[],
  method: string,
  operation: () => Promise<T>
) {
  const startedAt = performance.now();
  try {
    const result = await operation();
    trace.push({
      method,
      status: "success",
      durationMs: Math.round(performance.now() - startedAt),
    });
    return result;
  } catch (error) {
    trace.push({
      method,
      status: "error",
      durationMs: Math.round(performance.now() - startedAt),
      detail: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function inspectServer(
  client: Client,
  trace: McpTraceEntry[]
): Promise<McpInspectResult> {
  const capabilities = client.getServerCapabilities() ?? {};
  const result: McpInspectResult = {
    tools: [],
    resources: [],
    prompts: [],
    truncated: {
      tools: false,
      resources: false,
      prompts: false,
    },
    warnings: [],
  };

  const tasks: Array<{
    key: "tools" | "resources" | "prompts";
    supported: boolean;
    run: () => Promise<{ items: unknown[]; truncated: boolean }>;
  }> = [
    {
      key: "tools",
      supported: Boolean(capabilities.tools),
      run: async () => {
        const items: unknown[] = [];
        let cursor: string | undefined;
        let hasMore = false;
        do {
          const response = await client.listTools({ cursor });
          items.push(...response.tools);
          cursor = response.nextCursor;
          hasMore = Boolean(cursor);
        } while (cursor && items.length < MAX_ITEMS);
        return {
          items: items.slice(0, MAX_ITEMS),
          truncated: items.length > MAX_ITEMS || hasMore,
        };
      },
    },
    {
      key: "resources",
      supported: Boolean(capabilities.resources),
      run: async () => {
        const items: unknown[] = [];
        let cursor: string | undefined;
        let hasMore = false;
        do {
          const response = await client.listResources({ cursor });
          items.push(...response.resources);
          cursor = response.nextCursor;
          hasMore = Boolean(cursor);
        } while (cursor && items.length < MAX_ITEMS);
        return {
          items: items.slice(0, MAX_ITEMS),
          truncated: items.length > MAX_ITEMS || hasMore,
        };
      },
    },
    {
      key: "prompts",
      supported: Boolean(capabilities.prompts),
      run: async () => {
        const items: unknown[] = [];
        let cursor: string | undefined;
        let hasMore = false;
        do {
          const response = await client.listPrompts({ cursor });
          items.push(...response.prompts);
          cursor = response.nextCursor;
          hasMore = Boolean(cursor);
        } while (cursor && items.length < MAX_ITEMS);
        return {
          items: items.slice(0, MAX_ITEMS),
          truncated: items.length > MAX_ITEMS || hasMore,
        };
      },
    },
  ];

  for (const task of tasks) {
    if (!task.supported) continue;
    try {
      const section = await traced(trace, `${task.key}/list`, task.run);
      result[task.key] = sanitizeMcpContent(section.items) as unknown[];
      result.truncated[task.key] = section.truncated;
    } catch (error) {
      result.warnings.push(
        `${task.key}/list: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return result;
}

export async function executeMcpTesterRequest(
  request: McpTesterRequest,
  options?: {
    fetch?: FetchLike;
  }
): Promise<McpTesterSuccess> {
  const headers = sanitizeOutboundHeaders(request.headers);
  if (!options?.fetch) {
    await validateMcpTarget(request.endpoint);
  }
  const secrets = Object.values(headers);
  const safeFetch = options?.fetch ? null : createSafeMcpFetch();
  const fetchImpl = options?.fetch ?? safeFetch!.fetch;
  const trace: McpTraceEntry[] = [];
  const transport = new StreamableHTTPClientTransport(
    new URL(request.endpoint),
    {
      fetch: fetchImpl,
      requestInit: { headers },
      onInsufficientScope: "throw",
      reconnectionOptions: {
        maxReconnectionDelay: 1_000,
        initialReconnectionDelay: 250,
        reconnectionDelayGrowFactor: 1.5,
        maxRetries: 0,
      },
    }
  );
  const client = new Client(
    {
      name: "turinhub-toolbox-mcp-tester",
      version: "1.0.0",
    },
    {
      versionNegotiation: {
        mode: "auto",
        probe: {
          timeoutMs: 5_000,
          maxRetries: 0,
        },
      },
      inputRequired: {
        autoFulfill: false,
      },
    }
  );

  try {
    await traced(trace, "connect", () => client.connect(transport));
    const connection = connectionInfo(client);
    let data: unknown;

    if (request.action === "inspect") {
      data = await inspectServer(client, trace);
    } else if (request.action === "call-tool") {
      let cursor: string | undefined;
      let definition;
      let inspectedCount = 0;
      do {
        const listed = await traced(trace, "tools/list", () =>
          client.listTools({ cursor })
        );
        inspectedCount += listed.tools.length;
        definition = listed.tools.find(tool => tool.name === request.name);
        cursor = listed.nextCursor;
      } while (!definition && cursor && inspectedCount < MAX_ITEMS);
      if (!definition) {
        throw new McpTesterClientError(
          "TOOL_NOT_FOUND",
          `远程服务器未提供工具 ${request.name}`
        );
      }
      data = await traced(trace, "tools/call", () =>
        client.callTool(
          {
            name: request.name,
            arguments: request.arguments,
          },
          { toolDefinition: definition }
        )
      );
    } else if (request.action === "read-resource") {
      data = await traced(trace, "resources/read", () =>
        client.readResource({ uri: request.uri })
      );
    } else {
      data = await traced(trace, "prompts/get", () =>
        client.getPrompt({
          name: request.name,
          arguments: request.arguments,
        })
      );
    }

    return {
      ok: true,
      connection,
      data: sanitizeMcpContent(data),
      trace: trace.map(item => ({
        ...item,
        detail: item.detail ? redactErrorText(item.detail, secrets) : undefined,
      })),
    };
  } catch (error) {
    if (
      error instanceof McpTesterClientError ||
      error instanceof McpSecurityError
    ) {
      throw error;
    }
    const rawMessage = error instanceof Error ? error.message : String(error);
    throw new McpTesterClientError(
      isTimeoutError(error) ? "UPSTREAM_TIMEOUT" : "MCP_UPSTREAM_ERROR",
      redactErrorText(rawMessage, secrets),
      error
    );
  } finally {
    await Promise.allSettled([client.close(), safeFetch?.close()]);
  }
}
