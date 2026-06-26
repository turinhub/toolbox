import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.describe("tool workflows", () => {
  test("base64 tool encodes and decodes text", async ({ page }) => {
    await page.goto("/tools/base64");

    await page.getByPlaceholder("输入要编码的文本").fill("Hello, Toolbox!");
    await page.getByRole("button", { name: /^编码$/ }).click();

    const encodedOutput = page.locator("textarea[readonly]");
    await expect(encodedOutput).toHaveValue("SGVsbG8sIFRvb2xib3gh");

    await page.getByRole("tab", { name: "解码" }).click();
    await page
      .getByPlaceholder("输入要解码的 Base64 字符串")
      .fill("5L2g5aW977yM5bel5YW3");
    await page.getByRole("button", { name: /^解码$/ }).click();

    await expect(encodedOutput).toHaveValue("你好，工具");
  });

  test("json formatter validates and formats JSON", async ({ page }) => {
    await page.goto("/tools/json-formatter");

    await page
      .getByPlaceholder(/在此粘贴 JSON 数据/)
      .fill('{"name":"toolbox","items":[1,2]}');
    await page.getByRole("button", { name: /格式化/ }).click();

    await expect(page.getByText("JSON 格式有效")).toBeVisible();
    await expect(page.locator("pre")).toContainText('"name": "toolbox"');
    await expect(page.locator("pre")).toContainText('"items": [');
  });

  test("uuid generator creates a standard UUID by default", async ({
    page,
  }) => {
    await page.goto("/tools/uuid");

    await expect(
      page.getByRole("heading", { name: "UUID 生成器", exact: true })
    ).toBeVisible();

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    await expect(page.locator("code").first()).toHaveText(uuidPattern);

    await page.getByRole("button", { name: /^生成 ID$/ }).click();
    await expect(page.locator("code").first()).toHaveText(uuidPattern);
  });

  test("mermaid renderer previews diagrams and handles invalid input", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/tools/mermaid-renderer");

    await expect(
      page.getByRole("heading", { name: "Mermaid 渲染器", exact: true })
    ).toBeVisible();
    await expect(page.getByText("当前图表可正常渲染")).toBeVisible();
    await expect(page.getByLabel("Mermaid 渲染预览")).toBeVisible();

    await page.getByLabel("示例模板").click();
    await page.getByRole("option", { name: "时序图" }).click();
    await expect(page.locator("#mermaid-code-editor")).toContainText(
      "sequenceDiagram"
    );
    await expect(page.getByText("当前图表可正常渲染")).toBeVisible();

    const editor = page.locator("#mermaid-code-editor .cm-content");
    await editor.fill("flowchart TD\n  A -->");
    await expect(page.getByText("渲染失败")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "恢复上次有效代码" })
    ).toBeVisible();

    await page.getByRole("button", { name: "恢复上次有效代码" }).click();
    await expect(page.getByText("当前图表可正常渲染")).toBeVisible();

    await expect(page.getByRole("button", { name: "复制源码" })).toBeVisible();
    await expect(page.getByRole("button", { name: "下载 MMD" })).toBeVisible();
    await expect(page.getByRole("button", { name: "复制 SVG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "下载 SVG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "导出 PNG" })).toBeVisible();

    const svgDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "下载 SVG" }).click();
    const svgDownload = await svgDownloadPromise;
    const svgPath = await svgDownload.path();

    expect(svgPath).toBeTruthy();
    await expect
      .poll(async () => readFile(svgPath!, "utf8"))
      .toContain('fill="#020817"');
  });
});
