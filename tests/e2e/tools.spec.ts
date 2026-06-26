import { expect, test } from "@playwright/test";

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
});
