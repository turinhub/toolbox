export type McpHeaderInput = {
  name: string;
  value: string;
};

type McpBaseRequest = {
  endpoint: string;
  headers: McpHeaderInput[];
  locale?: "zh-CN" | "en";
};

export type McpTesterRequest =
  | (McpBaseRequest & { action: "inspect" })
  | (McpBaseRequest & {
      action: "call-tool";
      name: string;
      arguments: Record<string, unknown>;
    })
  | (McpBaseRequest & {
      action: "read-resource";
      uri: string;
    })
  | (McpBaseRequest & {
      action: "get-prompt";
      name: string;
      arguments?: Record<string, string>;
    });

export type McpTraceEntry = {
  method: string;
  status: "success" | "error";
  durationMs: number;
  httpStatus?: number;
  detail?: string;
};

export type McpConnectionInfo = {
  protocolVersion?: string;
  protocolEra?: "modern" | "legacy";
  serverInfo?: {
    name: string;
    version: string;
  };
  instructions?: string;
  capabilities: string[];
};

export type McpInspectResult = {
  tools: unknown[];
  resources: unknown[];
  prompts: unknown[];
  truncated: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  warnings: string[];
};

export type McpTesterSuccess = {
  ok: true;
  connection: McpConnectionInfo;
  data: unknown;
  trace: McpTraceEntry[];
};

export type McpTesterFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
};

export type McpTesterResponse = McpTesterSuccess | McpTesterFailure;
