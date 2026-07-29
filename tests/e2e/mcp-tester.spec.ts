import { expect, test } from "@playwright/test";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod4";
import { executeMcpTesterRequest } from "@/lib/mcp-tester/client";
import {
  isBlockedIpAddress,
  isPrivateNetworkIpAddress,
  McpSecurityError,
  redactErrorText,
  resolveMcpRedirect,
  sanitizeOutboundHeaders,
  validateMcpTarget,
} from "@/lib/mcp-tester/security";
import { createHumanVerificationToken, isHumanVerified } from "@/lib/turnstile";

function createTestMcpHandler() {
  return createMcpHandler(
    () => {
      const server = new McpServer(
        {
          name: "toolbox-test-server",
          version: "1.0.0",
        },
        {
          instructions: "Deterministic MCP test fixture",
        }
      );

      server.registerTool(
        "echo",
        {
          title: "Echo",
          description: "Echo a message",
          inputSchema: z.object({ message: z.string() }),
        },
        async ({ message }) => ({
          content: [{ type: "text", text: message }],
          structuredContent: { message },
        })
      );
      server.registerResource(
        "guide",
        "test://guide",
        {
          title: "Test Guide",
          description: "A deterministic resource",
          mimeType: "text/plain",
        },
        async uri => ({
          contents: [{ uri: uri.href, text: "MCP test guide" }],
        })
      );
      server.registerPrompt(
        "welcome",
        {
          title: "Welcome",
          description: "Create a welcome message",
          argsSchema: z.object({ name: z.string() }),
        },
        async ({ name }) => ({
          messages: [
            {
              role: "user",
              content: { type: "text", text: `Welcome ${name}` },
            },
          ],
        })
      );
      return server;
    },
    {
      legacy: "stateless",
      responseMode: "json",
    }
  );
}

test.describe("MCP tester security", () => {
  test("blocks private, mapped, reserved, and invalid IP addresses", () => {
    expect(isBlockedIpAddress("127.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("10.0.0.8")).toBe(true);
    expect(isBlockedIpAddress("169.254.169.254")).toBe(true);
    expect(isBlockedIpAddress("::1")).toBe(true);
    expect(isBlockedIpAddress("::192.168.1.2")).toBe(true);
    expect(isBlockedIpAddress("::ffff:192.168.1.2")).toBe(true);
    expect(isBlockedIpAddress("2002:0a00:0001::")).toBe(true);
    expect(isBlockedIpAddress("3fff::1")).toBe(true);
    expect(isBlockedIpAddress("8.8.8.8")).toBe(false);
    expect(isBlockedIpAddress("2606:4700:4700::1111")).toBe(false);
    expect(isBlockedIpAddress("not-an-ip")).toBe(true);
    expect(isPrivateNetworkIpAddress("10.0.0.8")).toBe(true);
    expect(isPrivateNetworkIpAddress("fd00::1")).toBe(true);
    expect(isPrivateNetworkIpAddress("127.0.0.1")).toBe(false);
    expect(isPrivateNetworkIpAddress("169.254.169.254")).toBe(false);
  });

  test("rejects insecure targets and controlled headers", async () => {
    await expect(
      validateMcpTarget("http://example.com/mcp")
    ).rejects.toMatchObject({ code: "HTTPS_REQUIRED" });
    await expect(
      validateMcpTarget("https://user:password@example.com/mcp")
    ).rejects.toMatchObject({ code: "URL_CREDENTIALS_BLOCKED" });
    await expect(
      validateMcpTarget("https://127.0.0.1/mcp")
    ).rejects.toMatchObject({ code: "PRIVATE_ADDRESS_BLOCKED" });
    await expect(
      validateMcpTarget("https://example.com:8443/mcp")
    ).rejects.toMatchObject({ code: "PORT_BLOCKED" });

    expect(() =>
      sanitizeOutboundHeaders([{ name: "Host", value: "internal" }])
    ).toThrow(McpSecurityError);
    expect(() =>
      sanitizeOutboundHeaders([{ name: "MCP-Protocol-Version", value: "x" }])
    ).toThrow(McpSecurityError);
    expect(
      sanitizeOutboundHeaders([
        { name: "Authorization", value: "Bearer secret" },
        { name: "X-API-Key", value: "key" },
      ])
    ).toEqual({
      Authorization: "Bearer secret",
      "X-API-Key": "key",
    });
    expect(redactErrorText("Bearer secret failed", ["Bearer secret"])).toBe(
      "[REDACTED] failed"
    );
  });

  test("allows only private ranges behind the non-production opt-in", async () => {
    const previousPrivateSetting =
      process.env.MCP_TESTER_ALLOW_PRIVATE_NETWORKS;
    process.env.MCP_TESTER_ALLOW_PRIVATE_NETWORKS = "true";
    try {
      await expect(
        validateMcpTarget("https://10.0.0.8/mcp")
      ).resolves.toMatchObject({
        addresses: [{ address: "10.0.0.8", family: 4 }],
      });
      await expect(
        validateMcpTarget("https://[fd00::1]/mcp")
      ).resolves.toMatchObject({
        addresses: [{ address: "fd00::1", family: 6 }],
      });
      for (const endpoint of [
        "https://127.0.0.1/mcp",
        "https://169.254.169.254/mcp",
        "https://192.0.2.1/mcp",
        "https://224.0.0.1/mcp",
        "https://[::1]/mcp",
      ]) {
        await expect(validateMcpTarget(endpoint)).rejects.toMatchObject({
          code: "PRIVATE_ADDRESS_BLOCKED",
        });
      }
    } finally {
      if (previousPrivateSetting === undefined) {
        delete process.env.MCP_TESTER_ALLOW_PRIVATE_NETWORKS;
      } else {
        process.env.MCP_TESTER_ALLOW_PRIVATE_NETWORKS = previousPrivateSetting;
      }
    }
  });

  test("supports public IPv6 literals and blocks cross-origin redirects", async () => {
    await expect(
      validateMcpTarget("https://[2606:4700:4700::1111]/mcp")
    ).resolves.toMatchObject({
      addresses: [{ address: "2606:4700:4700::1111", family: 6 }],
    });

    expect(
      resolveMcpRedirect(new URL("https://mcp.example/api"), "/next").toString()
    ).toBe("https://mcp.example/next");
    expect(() =>
      resolveMcpRedirect(
        new URL("https://mcp.example/api"),
        "https://credentials.example/mcp"
      )
    ).toThrow(
      expect.objectContaining({ code: "CROSS_ORIGIN_REDIRECT_BLOCKED" })
    );
  });

  test("requires a signed human-verification cookie", () => {
    const previousSecret = process.env.CLOUDFLARE_TURNSTILE_SECRETKEY;
    process.env.CLOUDFLARE_TURNSTILE_SECRETKEY = "test-turnstile-secret";
    try {
      expect(
        isHumanVerified(
          new Request("https://toolbox.test", {
            headers: { cookie: "human_verified=true" },
          })
        )
      ).toBe(false);
      const token = createHumanVerificationToken();
      expect(
        isHumanVerified(
          new Request("https://toolbox.test", {
            headers: { cookie: `human_verified=${token}` },
          })
        )
      ).toBe(true);
    } finally {
      if (previousSecret === undefined) {
        delete process.env.CLOUDFLARE_TURNSTILE_SECRETKEY;
      } else {
        process.env.CLOUDFLARE_TURNSTILE_SECRETKEY = previousSecret;
      }
    }
  });
});

test.describe("MCP tester protocol adapter", () => {
  test("inspects and invokes a modern MCP server", async () => {
    const handler = createTestMcpHandler();
    const injectedFetch = (url: string | URL, init?: RequestInit) =>
      handler.fetch(new Request(url, init));

    try {
      const inspection = await executeMcpTesterRequest(
        {
          action: "inspect",
          endpoint: "https://mcp.test/mcp",
          headers: [],
        },
        { fetch: injectedFetch }
      );
      expect(inspection.connection.protocolEra).toBe("modern");
      expect(inspection.connection.serverInfo?.name).toBe(
        "toolbox-test-server"
      );
      expect(inspection.data).toMatchObject({
        tools: [{ name: "echo" }],
        resources: [{ uri: "test://guide" }],
        prompts: [{ name: "welcome" }],
        warnings: [],
      });

      const toolCall = await executeMcpTesterRequest(
        {
          action: "call-tool",
          endpoint: "https://mcp.test/mcp",
          headers: [],
          name: "echo",
          arguments: { message: "Hello MCP" },
        },
        { fetch: injectedFetch }
      );
      expect(toolCall.data).toMatchObject({
        structuredContent: { message: "Hello MCP" },
      });

      const resource = await executeMcpTesterRequest(
        {
          action: "read-resource",
          endpoint: "https://mcp.test/mcp",
          headers: [],
          uri: "test://guide",
        },
        { fetch: injectedFetch }
      );
      expect(JSON.stringify(resource.data)).toContain("MCP test guide");

      const prompt = await executeMcpTesterRequest(
        {
          action: "get-prompt",
          endpoint: "https://mcp.test/mcp",
          headers: [],
          name: "welcome",
          arguments: { name: "Toolbox" },
        },
        { fetch: injectedFetch }
      );
      expect(JSON.stringify(prompt.data)).toContain("Welcome Toolbox");
    } finally {
      await handler.close();
    }
  });

  test("falls back to the legacy era after a rejected modern probe", async () => {
    const handler = createTestMcpHandler();
    const legacyOnlyFetch = async (
      url: string | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const request = new Request(url, init);
      const body = await request
        .clone()
        .json()
        .catch(() => null);
      if (
        body &&
        typeof body === "object" &&
        "method" in body &&
        body.method === "server/discover"
      ) {
        return new Response("Not found", { status: 404 });
      }
      return handler.fetch(request);
    };

    try {
      const inspection = await executeMcpTesterRequest(
        {
          action: "inspect",
          endpoint: "https://legacy-mcp.test/mcp",
          headers: [],
        },
        { fetch: legacyOnlyFetch }
      );
      expect(inspection.connection.protocolEra).toBe("legacy");
      expect(inspection.connection.protocolVersion).toBeTruthy();
      expect(inspection.data).toMatchObject({
        tools: [{ name: "echo" }],
      });
    } finally {
      await handler.close();
    }
  });

  test("returns partial inspection data when one capability list fails", async () => {
    const handler = createTestMcpHandler();
    const partiallyFailingFetch = async (
      url: string | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const request = new Request(url, init);
      const body = await request
        .clone()
        .json()
        .catch(() => null);
      if (
        body &&
        typeof body === "object" &&
        "method" in body &&
        body.method === "prompts/list"
      ) {
        return Response.json({
          jsonrpc: "2.0",
          id: "id" in body ? body.id : null,
          error: { code: -32603, message: "Prompt fixture unavailable" },
        });
      }
      return handler.fetch(request);
    };

    try {
      const inspection = await executeMcpTesterRequest(
        {
          action: "inspect",
          endpoint: "https://partial-mcp.test/mcp",
          headers: [],
        },
        { fetch: partiallyFailingFetch }
      );
      expect(inspection.data).toMatchObject({
        tools: [{ name: "echo" }],
        resources: [{ uri: "test://guide" }],
        prompts: [],
      });
      expect(
        (inspection.data as { warnings: string[] }).warnings.join(" ")
      ).toContain("prompts/list");
    } finally {
      await handler.close();
    }
  });

  test("maps an upstream timeout to a stable error code", async () => {
    await expect(
      executeMcpTesterRequest(
        {
          action: "inspect",
          endpoint: "https://timeout-mcp.test/mcp",
          headers: [],
        },
        {
          fetch: async () => {
            throw new DOMException("fixture timed out", "TimeoutError");
          },
        }
      )
    ).rejects.toMatchObject({ code: "UPSTREAM_TIMEOUT" });
  });
});

test.describe("MCP tester API security", () => {
  test("rejects blocked inputs before making an upstream request", async ({
    request,
  }) => {
    const ip = `mcp-security-${Date.now()}`;
    const privateTarget = await request.post("/api/tools/mcp-tester", {
      headers: { "x-vercel-forwarded-for": ip },
      data: {
        action: "inspect",
        endpoint: "https://127.0.0.1/mcp",
        headers: [],
      },
    });
    expect(privateTarget.status()).toBe(403);
    await expect(privateTarget.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "PRIVATE_ADDRESS_BLOCKED" },
    });

    const blockedHeader = await request.post("/api/tools/mcp-tester", {
      headers: { "x-vercel-forwarded-for": ip },
      data: {
        action: "inspect",
        endpoint: "https://example.com/mcp",
        headers: [{ name: "Host", value: "internal.example" }],
      },
    });
    expect(blockedHeader.status()).toBe(403);
    await expect(blockedHeader.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "HEADER_BLOCKED" },
    });
  });

  test("rejects oversized request bodies", async ({ request }) => {
    const response = await request.post("/api/tools/mcp-tester", {
      headers: {
        "content-type": "application/json",
        "x-vercel-forwarded-for": `mcp-large-${Date.now()}`,
      },
      data: JSON.stringify({
        action: "inspect",
        endpoint: "https://example.com/mcp",
        headers: [],
        padding: "x".repeat(256 * 1024),
      }),
    });
    expect(response.status()).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "REQUEST_TOO_LARGE" },
    });
  });

  test("applies the per-IP fixed-window limit", async ({ request }) => {
    const ip = `mcp-rate-${Date.now()}`;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await request.post("/api/tools/mcp-tester", {
        headers: { "x-vercel-forwarded-for": ip },
        data: {
          action: "inspect",
          endpoint: "https://127.0.0.1/mcp",
          headers: [],
        },
      });
      expect(response.status()).toBe(403);
    }

    const limited = await request.post("/api/tools/mcp-tester", {
      headers: { "x-vercel-forwarded-for": ip },
      data: {
        action: "inspect",
        endpoint: "https://127.0.0.1/mcp",
        headers: [],
      },
    });
    expect(limited.status()).toBe(429);
    await expect(limited.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "RATE_LIMITED" },
    });
  });
});

test.describe("MCP tester UI", () => {
  test("inspects a server and confirms a tool call", async ({ page }) => {
    await page.route("**/api/tools/mcp-tester", async route => {
      const request = route.request().postDataJSON() as { action: string };
      if (request.action === "inspect") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            connection: {
              protocolVersion: "2026-07-28",
              protocolEra: "modern",
              serverInfo: { name: "Demo MCP", version: "1.0.0" },
              capabilities: ["prompts", "resources", "tools"],
            },
            data: {
              tools: [
                {
                  name: "echo",
                  title: "Echo",
                  description: "Echo a message",
                  inputSchema: {
                    type: "object",
                    properties: {
                      message: { type: "string", default: "Hello" },
                    },
                  },
                },
              ],
              resources: [
                { uri: "demo://guide", name: "Guide", title: "Guide" },
              ],
              prompts: [
                {
                  name: "welcome",
                  title: "Welcome",
                  arguments: [{ name: "name", required: true }],
                },
              ],
              warnings: [],
              truncated: {
                tools: false,
                resources: false,
                prompts: false,
              },
            },
            trace: [{ method: "connect", status: "success", durationMs: 12 }],
          }),
        });
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          connection: {
            protocolVersion: "2026-07-28",
            protocolEra: "modern",
            serverInfo: { name: "Demo MCP", version: "1.0.0" },
            capabilities: ["tools"],
          },
          data: {
            content: [{ type: "text", text: "Hello" }],
          },
          trace: [{ method: "tools/call", status: "success", durationMs: 18 }],
        }),
      });
    });

    await page.goto("/tools/mcp-tester");
    await page.getByLabel("MCP Endpoint").fill("https://example.com/mcp");
    await page.getByRole("button", { name: "检查连接" }).click();

    await expect(page.getByText("Demo MCP 1.0.0")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Tools (1)" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Echo/ })).toBeVisible();
    await expect(page.getByLabel("调用参数")).toContainText("Hello");

    await page.getByRole("button", { name: "调用 Tool" }).click();
    await expect(
      page.getByRole("heading", { name: "确认调用远程 Tool" })
    ).toBeVisible();
    await expect(page.getByText("https://example.com/mcp")).toBeVisible();
    await page.getByRole("button", { name: "确认调用" }).click();
    await expect(page.getByText('"text": "Hello"')).toBeVisible();

    await page.getByRole("tab", { name: "协议记录" }).click();
    await expect(page.getByText("tools/call")).toBeVisible();
  });

  test("invalidates inspected tools when endpoint or headers change", async ({
    page,
  }) => {
    await page.route("**/api/tools/mcp-tester", async route => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          connection: {
            protocolVersion: "2026-07-28",
            protocolEra: "modern",
            serverInfo: { name: "Snapshot MCP", version: "1.0.0" },
            capabilities: ["tools"],
          },
          data: {
            tools: [{ name: "dangerous", title: "Dangerous" }],
            resources: [],
            prompts: [],
            warnings: [],
            truncated: {
              tools: false,
              resources: false,
              prompts: false,
            },
          },
          trace: [],
        }),
      });
    });

    await page.goto("/tools/mcp-tester");
    const endpoint = page.getByLabel("MCP Endpoint");
    await endpoint.fill("https://server-a.example/mcp");
    await page.getByRole("button", { name: "检查连接" }).click();
    await expect(page.getByText("Snapshot MCP 1.0.0")).toBeVisible();

    await endpoint.fill("https://server-b.example/mcp");
    await expect(
      page.getByText("连接配置已变更，请重新检查连接后再执行操作。")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "调用 Tool" })).toHaveCount(
      0
    );

    await page.getByRole("button", { name: "检查连接" }).click();
    await expect(page.getByText("Snapshot MCP 1.0.0")).toBeVisible();
    await page.getByLabel("Header 名称 1").fill("Authorization");
    await page.getByLabel("Header 值 1").fill("Bearer changed");
    await expect(
      page.getByText("连接配置已变更，请重新检查连接后再执行操作。")
    ).toBeVisible();
  });

  test("isolates prompt arguments and submits only declared fields", async ({
    page,
  }) => {
    const promptCalls: Array<Record<string, unknown>> = [];
    await page.route("**/api/tools/mcp-tester", async route => {
      const request = route.request().postDataJSON() as Record<string, unknown>;
      if (request.action === "get-prompt") {
        promptCalls.push(request);
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            connection: {
              protocolVersion: "2026-07-28",
              protocolEra: "modern",
              serverInfo: { name: "Prompt MCP", version: "1.0.0" },
              capabilities: ["prompts"],
            },
            data: { messages: [] },
            trace: [],
          }),
        });
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          connection: {
            protocolVersion: "2026-07-28",
            protocolEra: "modern",
            serverInfo: { name: "Prompt MCP", version: "1.0.0" },
            capabilities: ["prompts"],
          },
          data: {
            tools: [],
            resources: [],
            prompts: [
              {
                name: "first",
                title: "First prompt",
                arguments: [{ name: "shared" }, { name: "firstOnly" }],
              },
              {
                name: "second",
                title: "Second prompt",
                arguments: [
                  { name: "shared" },
                  { name: "secondOnly" },
                  { name: "optionalUnused" },
                ],
              },
            ],
            warnings: [],
            truncated: {
              tools: false,
              resources: false,
              prompts: false,
            },
          },
          trace: [],
        }),
      });
    });

    await page.goto("/tools/mcp-tester");
    await page.getByLabel("MCP Endpoint").fill("https://prompts.example/mcp");
    await page.getByRole("button", { name: "检查连接" }).click();
    await page.getByRole("tab", { name: "Prompts (2)" }).click();

    await page.locator("#prompt-first-shared").fill("first shared");
    await page.locator("#prompt-first-firstOnly").fill("first only");
    await expect(page.locator("#prompt-second-shared")).toHaveValue("");
    await page.getByRole("button", { name: "获取 Prompt" }).nth(0).click();
    await expect.poll(() => promptCalls.length).toBe(1);
    expect(promptCalls[0]).toMatchObject({
      name: "first",
      arguments: {
        shared: "first shared",
        firstOnly: "first only",
      },
    });

    await page.locator("#prompt-second-shared").fill("second shared");
    await page.locator("#prompt-second-secondOnly").fill("second only");
    await expect(page.locator("#prompt-first-shared")).toHaveValue(
      "first shared"
    );
    await page.getByRole("button", { name: "获取 Prompt" }).nth(1).click();
    await expect.poll(() => promptCalls.length).toBe(2);
    expect(promptCalls[1]).toMatchObject({
      name: "second",
      arguments: {
        shared: "second shared",
        secondOnly: "second only",
      },
    });
    expect(promptCalls[1].arguments).not.toHaveProperty("firstOnly");
    expect(promptCalls[1].arguments).not.toHaveProperty("optionalUnused");
  });

  test("renders the English route and remains usable on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/tools/mcp-tester");

    await expect(
      page.getByRole("heading", { name: "MCP Tester", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Inspect connection" })
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true);
  });
});
