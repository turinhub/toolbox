import { expect, test } from "@playwright/test";
import { zodResolver } from "@hookform/resolvers/zod";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/tools/mcp-tester/route";
import {
  formSchema,
  type FormValues,
} from "@/app/(zh)/tools/api-tester/components/ApiRequestForm";
import {
  readRegistryConfigs,
  writeRegistryConfigs,
} from "@/lib/docker-registry-config";

async function withRequiredVerification(run: () => Promise<void>) {
  const keys = [
    "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY",
    "CLOUDFLARE_TURNSTILE_SECRETKEY",
    "MCP_TESTER_BYPASS_HUMAN_VERIFICATION",
  ] as const;
  const original = keys.map(key => process.env[key]);
  try {
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY = "test-site-key";
    process.env.CLOUDFLARE_TURNSTILE_SECRETKEY = "test-only-secret";
    delete process.env.MCP_TESTER_BYPASS_HUMAN_VERIFICATION;
    await run();
  } finally {
    keys.forEach((key, index) => {
      if (original[index] === undefined) delete process.env[key];
      else process.env[key] = original[index];
    });
  }
}

function sendMcpRequest(body: unknown) {
  return POST(
    new NextRequest("https://toolbox.test/api/tools/mcp-tester", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

// 回环地址通过 URL schema，但即使验证门禁回归也会被网络安全层阻止。
const endpoint = "https://127.0.0.1/mcp";

test("MCP 四类有效参数通过 schema 后要求验证凭证，不访问外部服务", async () => {
  await withRequiredVerification(async () => {
    const requests = [
      { action: "inspect", endpoint },
      {
        action: "call-tool",
        endpoint,
        headers: [],
        name: "echo",
        arguments: {
          text: "中文参数",
          count: 0,
          enabled: false,
          empty: null,
          items: [1, { nested: "value" }],
        },
      },
      {
        action: "get-prompt",
        endpoint,
        name: "welcome",
        arguments: { name: "工具台", "a.b": "", "": "空键" },
      },
      { action: "read-resource", endpoint, uri: "test://guide" },
    ];
    for (const body of requests) {
      await test.step(body.action, async () => {
        const response = await sendMcpRequest(body);
        expect(response.status).toBe(403);
        expect(await response.json()).toMatchObject({
          ok: false,
          error: { code: "HUMAN_VERIFICATION_REQUIRED" },
        });
      });
    }
  });
});

test("MCP 拒绝非字符串 prompt 参数、缺失工具参数和超量请求头", async () => {
  await withRequiredVerification(async () => {
    const requests = [
      {
        action: "get-prompt",
        endpoint,
        name: "welcome",
        arguments: { name: 42 },
      },
      { action: "call-tool", endpoint, name: "echo" },
      {
        action: "inspect",
        endpoint,
        headers: Array.from({ length: 11 }, (_, index) => ({
          name: `X-Test-${index}`,
          value: "value",
        })),
      },
    ];
    for (const body of requests) {
      const response = await sendMcpRequest(body);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        ok: false,
        error: { code: "INVALID_REQUEST" },
      });
    }
  });
});

test("Registry 配置读写剔除旧密码，损坏的配置不会被覆盖", () => {
  const key = "docker-registry-configs";
  const legacyConfigs = [
    {
      name: "Private registry",
      password: "legacy-root-secret",
      config: {
        url: "https://registry.example.com",
        username: "tester",
        password: "legacy-secret",
      },
    },
  ];
  const entries = new Map([[key, JSON.stringify(legacyConfigs)]]);
  const storage = {
    getItem: (name: string) => entries.get(name) ?? null,
    setItem: (name: string, value: string) => {
      entries.set(name, value);
    },
  };
  const expected = [
    {
      name: "Private registry",
      config: { url: "https://registry.example.com", username: "tester" },
    },
  ];

  expect(readRegistryConfigs(storage)).toEqual(expected);
  expect(JSON.parse(storage.getItem(key)!)).toEqual(expected);
  writeRegistryConfigs(storage, legacyConfigs);
  expect(JSON.parse(storage.getItem(key)!)).toEqual(expected);

  const invalid = JSON.stringify([{ name: "Broken", config: { url: 42 } }]);
  storage.setItem(key, invalid);
  expect(() => readRegistryConfigs(storage)).toThrow();
  expect(storage.getItem(key)).toBe(invalid);
});

test("API 表单 resolver 保留合法请求，并为无效 URL 返回中文提示", async () => {
  const resolver = zodResolver(formSchema);
  const options = { fields: {}, shouldUseNativeValidation: false };
  const valid: FormValues = {
    url: "https://example.com/api?name=toolbox",
    method: "POST",
    headers: [{ key: "Content-Type", value: "application/json" }],
    body: '{"enabled":true}',
  };

  expect(await resolver(valid, undefined, options)).toEqual({
    errors: {},
    values: valid,
  });
  const invalid = await resolver(
    { ...valid, url: "无效 URL" },
    undefined,
    options
  );
  expect(invalid.values).toEqual({});
  expect(invalid.errors.url?.message).toBe(
    "请输入有效的 URL / Enter a valid URL"
  );
});
