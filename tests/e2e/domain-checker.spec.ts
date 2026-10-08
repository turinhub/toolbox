import { expect, test } from "@playwright/test";
import type { DomainReport } from "@/lib/domain-checker/types";

function fixture(): DomainReport {
  return {
    target: {
      hostname: "www.example.com",
      url: "http://www.example.com:8080/path?q=1",
      protocol: "http:",
      port: 8080,
      sslPort: 443,
    },
    checkedAt: "2026-10-08T06:00:00Z",
    basic: {
      status: "success",
      data: { addresses: [{ address: "93.184.215.14", family: 4 }] },
    },
    dns: {
      status: "success",
      data: {
        records: { A: ["93.184.215.14"], TXT: ["a".repeat(300)] },
        failedTypes: [],
      },
    },
    ssl: {
      status: "success",
      data: {
        valid: true,
        hostname: "www.example.com",
        port: 443,
        issuer: "Test CA",
        validFrom: "2026-01-01T00:00:00Z",
        validTo: "2027-01-01T00:00:00Z",
        daysLeft: 85,
        protocol: "TLSv1.3",
        subjectAltName: "DNS:www.example.com",
        fingerprint: "AA:".repeat(31) + "AA",
      },
    },
    whois: {
      status: "success",
      data: {
        domain: "example.com",
        sourceUrl: "https://registry.example/domain/example.com",
        registrar: "Test Registrar",
        registrationDate: "2020-01-01T00:00:00Z",
        expirationDate: "2027-01-01T00:00:00Z",
        statuses: ["client transfer prohibited"],
        nameServers: ["ns1.example.com"],
      },
    },
    performance: {
      status: "success",
      data: {
        responseTime: 50,
        httpStatus: 200,
        finalUrl: "https://www.example.com/final",
        hops: [
          {
            url: "http://www.example.com:8080/path?q=1",
            status: 301,
            responseTime: 20,
            method: "HEAD",
            location: "https://www.example.com/final",
          },
          {
            url: "https://www.example.com/final",
            status: 200,
            responseTime: 30,
            method: "GET",
          },
        ],
        headers: {
          "strict-transport-security": "max-age=31536000",
          "content-type": "text/html",
        },
      },
    },
  };
}

test("URL 检测完整展示注册信息、TLS 与 HTTP，并保存标签页状态", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  let payload: unknown;
  await page.route("**/api/tools/domain-checker", async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: fixture() });
  });
  await page.goto("/tools/domain-checker?tab=whois");
  await page
    .getByLabel("域名或 URL", { exact: true })
    .fill(" http://www.example.com:8080/path?q=1#section ");
  await page.getByRole("button", { name: "开始检测", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Test Registrar");
  expect(payload).toEqual({
    input: " http://www.example.com:8080/path?q=1#section ",
  });
  await page
    .getByRole("button", { name: "复制注册信息所属域名", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("example.com");
  await page.getByRole("tab", { name: "基本信息", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "http://www.example.com:8080/path?q=1"
  );
  await expect(page.getByRole("tabpanel")).toContainText("DNS 已解析");
  await page.getByRole("tab", { name: "SSL 证书", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("TLSv1.3");
  await page.getByRole("tab", { name: "HTTP 检测", exact: true }).click();
  await expect(page).toHaveURL(/tab=performance/);
  const panel = page.getByRole("tabpanel");
  await expect(panel).toContainText("301");
  await expect(panel).toContainText("GET");
  await expect(
    panel.getByRole("heading", { name: "安全响应头" })
  ).toBeVisible();
  await expect(panel).toContainText("未返回");
  await expect(page.locator("h1")).toHaveCount(1);
});

test("非法输入提供内联错误和焦点，复制失败可恢复", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/tools/domain-checker", async route => {
    requests++;
    await route.fulfill({ json: fixture() });
  });
  await page.goto("/tools/domain-checker");
  const input = page.getByLabel("域名或 URL", { exact: true });
  await input.fill("ftp://example.com");
  await page.getByRole("button", { name: "开始检测", exact: true }).click();
  await expect(
    page.getByText("只支持 HTTP 和 HTTPS，请修改 URL 协议。")
  ).toBeVisible();
  await expect(input).toBeFocused();
  expect(requests).toBe(0);
  await input.fill("example.com");
  await page.getByRole("button", { name: "开始检测", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("DNS 已解析");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    })
  );
  await page.getByRole("button", { name: "复制检测域名", exact: true }).click();
  await expect(
    page.getByText("无法复制，请检查浏览器剪贴板权限。")
  ).toBeVisible();
});

test("注册信息不支持或 HTTP 失败时保留 DNS 与证书结果，可重试", async ({
  page,
}) => {
  const report = fixture();
  report.whois = { status: "unsupported", error: "registrationUnsupported" };
  report.performance = {
    status: "error",
    error: "timeout",
    data: { responseTime: 15000, hops: [], headers: {} },
  };
  await page.route("**/api/tools/domain-checker", route =>
    route.fulfill({ json: report })
  );
  await page.goto("/tools/domain-checker");
  await page
    .getByLabel("域名或 URL", { exact: true })
    .fill("https://example.cn");
  await page.getByRole("button", { name: "开始检测", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("DNS 已解析");
  await page
    .getByRole("tab", { name: "Whois / 注册信息", exact: true })
    .click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "暂无可用的权威 RDAP 接口"
  );
  await page.getByRole("tab", { name: "HTTP 检测", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "查询超时，请稍后重试。"
  );
  await page.getByRole("tab", { name: "DNS 记录", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("93.184.215.14");
  await expect(
    page.getByRole("button", { name: "开始检测", exact: true })
  ).toBeEnabled();
});

for (const theme of ["light", "dark"]) {
  test(`英文移动端 ${theme} 主题长内容不溢出`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(
      value => localStorage.setItem("theme", value),
      theme
    );
    await page.route("**/api/tools/domain-checker", route =>
      route.fulfill({ json: fixture() })
    );
    await page.goto("/en/tools/domain-checker");
    await page
      .getByLabel("Domain or URL", { exact: true })
      .fill("https://example.com");
    await page
      .getByRole("button", { name: "Start check", exact: true })
      .click();
    for (const tab of [
      "DNS records",
      "SSL certificate",
      "Whois / Registration",
      "HTTP check",
    ]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await expect(page.getByRole("tabpanel")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
    }
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await page.screenshot({
      path: `test-results/domain-checker-${theme}-mobile.png`,
      fullPage: true,
      animations: "disabled",
    });
  });
}
