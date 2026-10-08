import { expect, test } from "@playwright/test";
import {
  DomainCheckError,
  normalizeDomainInput,
} from "@/lib/domain-checker/input";
import { checkHttp } from "@/lib/domain-checker/http";
import {
  resolvePublicHost,
  type PublicRequest,
  type PublicResponse,
} from "@/lib/domain-checker/network";
import {
  checkRegistration,
  findRdapService,
  parseBootstrap,
  parseRegistration,
} from "@/lib/domain-checker/rdap";
import { POST } from "@/app/api/tools/domain-checker/route";
import { createHumanVerificationToken } from "@/lib/turnstile";

const bootstrap = {
  services: [
    [["com"], ["https://registry.example/com/"]],
    [["uk"], ["https://registry.example/uk/"]],
    [["co.uk"], ["https://registry.example/co-uk/"]],
  ],
};
const record = {
  ldhName: "EXAMPLE.COM",
  events: [
    { eventAction: "registration", eventDate: "2020-01-01T00:00:00Z" },
    { eventAction: "expiration", eventDate: "not a date" },
  ],
  entities: [
    {
      roles: ["registrar"],
      vcardArray: ["vcard", [["fn", {}, "text", "Test Registrar"]]],
    },
  ],
  nameservers: [{ ldhName: "ns1.example.com" }],
  status: ["client transfer prohibited"],
};

test("域名与常见 URL 输入保留 HTTP 目标，独立提取 DNS 和 TLS 目标", () => {
  expect(normalizeDomainInput(" Example.COM ")).toEqual({
    hostname: "example.com",
    url: "https://example.com/",
    protocol: "https:",
    port: 443,
    sslPort: 443,
  });
  expect(
    normalizeDomainInput("HTTP://WWW.Example.com:8080/a?x=1#section")
  ).toEqual({
    hostname: "www.example.com",
    url: "http://www.example.com:8080/a?x=1",
    protocol: "http:",
    port: 8080,
    sslPort: 443,
  });
  expect(normalizeDomainInput("https://example.com:8443/path").sslPort).toBe(
    8443
  );
  expect(normalizeDomainInput("//example.com/path").url).toBe(
    "https://example.com/path"
  );
  expect(normalizeDomainInput("example.com./path").hostname).toBe(
    "example.com"
  );
  expect(normalizeDomainInput("https://例子.中国/路径").hostname).toBe(
    "xn--fsqu00a.xn--fiqs8s"
  );
  expect(normalizeDomainInput("example.com/path?query=a%20b").url).toBe(
    "https://example.com/path?query=a%20b"
  );
});

test("拒绝协议混淆、凭据、IP 变体、无效标签和异常端口", () => {
  for (const input of [
    "",
    "localhost",
    "https:example.com",
    "https:///",
    "https://example..com",
    "-a.example.com",
    "a_.example.com",
    "https://example.com:65536",
    "https://example.com:0",
    "127.0.0.1",
    "https://2130706433",
    "https://0x7f000001",
    "https://[::ffff:127.0.0.1]",
    "https://example.com\\@internal",
    "exa mple.com",
  ]) {
    expect(() => normalizeDomainInput(input), input).toThrow(DomainCheckError);
  }
  expect(() => normalizeDomainInput("ftp://example.com")).toThrow(
    "unsupportedProtocol"
  );
  expect(() => normalizeDomainInput("https://user:pass@example.com")).toThrow(
    "credentialsNotAllowed"
  );
});

test("任意解析地址包含私网或保留地址时阻止连接，公共地址及超时处理可恢复", async () => {
  await expect(
    resolvePublicHost("example.com", 100, async () => [
      { address: "8.8.8.8", family: 4 },
    ])
  ).resolves.toHaveLength(1);
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "::1",
    "::ffff:10.0.0.1",
    "2002:0a00:0001::",
  ]) {
    await expect(
      resolvePublicHost("example.com", 100, async () => [
        { address: "8.8.8.8", family: 4 },
        { address, family: address.includes(":") ? 6 : 4 },
      ])
    ).rejects.toMatchObject({ code: "blockedAddress" });
  }
  await expect(
    resolvePublicHost("example.com", 1, () => new Promise(() => {}))
  ).rejects.toMatchObject({ code: "timeout" });
  await expect(
    resolvePublicHost("example.com", 100, async () => [])
  ).rejects.toMatchObject({ code: "dnsFailed" });
});

test("HTTP 跟踪相对和跨域重定向，HEAD 不支持时回退 GET，保留最终响应头", async () => {
  const calls: { url: string; method: string }[] = [];
  const request: PublicRequest = async (
    url,
    options
  ): Promise<PublicResponse> => {
    calls.push({ url, method: options.method });
    if (url.endsWith("/start?q=1"))
      return { status: 301, headers: { location: "/next" }, responseTime: 4 };
    if (url.endsWith("/next"))
      return {
        status: 302,
        headers: { location: "https://other.example.com/final" },
        responseTime: 5,
      };
    if (options.method === "HEAD")
      return { status: 405, headers: {}, responseTime: 2 };
    return {
      status: 200,
      headers: {
        "strict-transport-security": "max-age=31536000",
        "content-type": "text/html",
        "set-cookie": "secret",
      },
      responseTime: 3,
    };
  };
  const result = await checkHttp(
    normalizeDomainInput("http://example.com/start?q=1"),
    request
  );
  expect(result.status).toBe("success");
  expect(result.data?.hops.map(hop => hop.status)).toEqual([301, 302, 200]);
  expect(result.data?.hops[2]).toMatchObject({
    method: "GET",
    responseTime: 5,
  });
  expect(result.data?.finalUrl).toBe("https://other.example.com/final");
  expect(result.data?.headers).toEqual({
    "strict-transport-security": "max-age=31536000",
    "content-type": "text/html",
  });
  expect(calls).toHaveLength(4);
});

test("循环、跳转上限和不安全重定向都停止请求并保留已收到的响应", async () => {
  const loop = await checkHttp(
    normalizeDomainInput("example.com"),
    async () => ({ status: 302, headers: { location: "/" }, responseTime: 1 })
  );
  expect(loop).toMatchObject({ status: "error", error: "redirectLoop" });
  expect(loop.data?.hops).toHaveLength(1);
  let count = 0;
  const excess = await checkHttp(
    normalizeDomainInput("example.com"),
    async () => ({
      status: 302,
      headers: { location: `/${++count}` },
      responseTime: 1,
    })
  );
  expect(excess.error).toBe("tooManyRedirects");
  expect(excess.data?.hops).toHaveLength(6);
  for (const location of [
    "file:///etc/passwd",
    "http://127.0.0.1/",
    "https://user:pass@example.com/",
  ]) {
    let requests = 0;
    const result = await checkHttp(
      normalizeDomainInput("example.com"),
      async () => {
        requests++;
        return { status: 302, headers: { location }, responseTime: 1 };
      }
    );
    expect(result.status).toBe("error");
    expect(requests).toBe(1);
  }
  const blocked = await checkHttp(
    normalizeDomainInput("example.com"),
    async url => {
      if (url.includes("private.example.com"))
        throw new DomainCheckError("blockedAddress");
      return {
        status: 302,
        headers: { location: "https://private.example.com/" },
        responseTime: 1,
      };
    }
  );
  expect(blocked).toMatchObject({ status: "error", error: "blockedAddress" });
  expect(blocked.data?.hops).toHaveLength(1);
});

test("HTTP 404 是有效响应，连接超时没有伪造成功状态", async () => {
  const missing = await checkHttp(
    normalizeDomainInput("example.com"),
    async () => ({ status: 404, headers: {}, responseTime: 0 })
  );
  expect(missing).toMatchObject({
    status: "success",
    data: { httpStatus: 404 },
  });
  const timeout = await checkHttp(
    normalizeDomainInput("example.com"),
    async () => {
      throw new DomainCheckError("timeout");
    }
  );
  expect(timeout).toMatchObject({
    status: "error",
    error: "timeout",
    data: { hops: [] },
  });
});

test("RDAP 服务使用最长后缀匹配，解析缺失字段和异常日期", () => {
  expect(
    findRdapService("www.example.co.uk", parseBootstrap(bootstrap))
  ).toEqual({ suffix: "co.uk", url: "https://registry.example/co-uk/" });
  expect(
    parseRegistration(
      record,
      "example.com",
      "https://registry.example/domain/example.com"
    )
  ).toMatchObject({
    domain: "example.com",
    registrar: "Test Registrar",
    registrationDate: "2020-01-01T00:00:00Z",
    expirationDate: undefined,
    nameServers: ["ns1.example.com"],
  });
  expect(
    parseRegistration(
      { ldhName: "EXAMPLE.COM", nameservers: null, entities: null },
      "example.com",
      "source"
    ).nameServers
  ).toEqual([]);
  expect(() =>
    parseRegistration({ ldhName: "OTHER.COM" }, "example.com", "source")
  ).toThrow("invalidResponse");
});

test("RDAP 子域名回退、未支持、未找到、限流和数据源异常互不混淆", async () => {
  const calls: string[] = [];
  const request: PublicRequest = async url => {
    calls.push(url);
    if (url.endsWith("dns.json"))
      return { status: 200, headers: {}, responseTime: 1, body: bootstrap };
    if (url.endsWith("/www.example.com"))
      return { status: 404, headers: {}, responseTime: 1 };
    return { status: 200, headers: {}, responseTime: 1, body: record };
  };
  expect(await checkRegistration("www.example.com", request)).toMatchObject({
    status: "success",
    data: { domain: "example.com" },
  });
  expect(calls).toHaveLength(3);
  expect(await checkRegistration("example.cn", request)).toMatchObject({
    status: "unsupported",
    error: "registrationUnsupported",
  });
  for (const [status, expected] of [
    [404, "registrationNotFound"],
    [429, "rateLimited"],
    [503, "networkFailed"],
  ] as const) {
    const result = await checkRegistration("example.com", async url =>
      url.endsWith("dns.json")
        ? { status: 200, headers: {}, responseTime: 1, body: bootstrap }
        : { status, headers: {}, responseTime: 1 }
    );
    expect(result.error).toBe(expected);
  }
  expect(
    await checkRegistration("example.com", async () => {
      throw new DomainCheckError("timeout");
    })
  ).toMatchObject({ status: "error", error: "timeout" });
});

test("服务端独立拒绝异常输入和超限请求体，无需依赖浏览器校验", async () => {
  for (const body of [
    JSON.stringify({ input: "ftp://example.com" }),
    JSON.stringify({ input: "https://user:pass@example.com" }),
    JSON.stringify({ input: 123 }),
    "{bad json",
    " ".repeat(4097),
  ]) {
    const response = await POST(
      new Request("https://toolbox.example/api/tools/domain-checker", {
        method: "POST",
        body,
      })
    );
    expect(response.status).toBe(400);
  }
});

test("域名检测 API 遵循页面验证开关，并拒绝缺失、伪造和过期凭证", async () => {
  const keys = [
    "TOOLBOX_PROXY_TURNSTILE",
    "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY",
    "CLOUDFLARE_TURNSTILE_SECRETKEY",
  ] as const;
  const original = keys.map(key => process.env[key]);
  const send = (cookie?: string) =>
    POST(
      new Request("https://toolbox.example/api/tools/domain-checker", {
        method: "POST",
        headers: cookie ? { cookie } : {},
        body: "{bad json",
      })
    );
  try {
    process.env.TOOLBOX_PROXY_TURNSTILE = "true";
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY = "test-site-key";
    process.env.CLOUDFLARE_TURNSTILE_SECRETKEY = "test-only-secret";
    const token = createHumanVerificationToken();
    const originalNow = Date.now;
    let expired: string;
    try {
      Date.now = () => originalNow() - 2 * 60 * 60 * 1000;
      expired = createHumanVerificationToken();
    } finally {
      Date.now = originalNow;
    }
    for (const cookie of [
      undefined,
      "human_verified=true",
      `human_verified=${expired}`,
    ]) {
      const response = await send(cookie);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "humanVerificationRequired",
      });
    }
    // 有效凭证或关闭保护后进入请求体校验，不依赖任何外部网络。
    expect((await send(`human_verified=${token}`)).status).toBe(400);
    process.env.TOOLBOX_PROXY_TURNSTILE = "false";
    expect((await send()).status).toBe(400);
    process.env.TOOLBOX_PROXY_TURNSTILE = "true";
    delete process.env.CLOUDFLARE_TURNSTILE_SECRETKEY;
    expect((await send()).status).toBe(400);
  } finally {
    keys.forEach((key, index) => {
      if (original[index] === undefined) delete process.env[key];
      else process.env[key] = original[index];
    });
  }
});
