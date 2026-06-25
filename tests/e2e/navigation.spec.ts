import { expect, test } from "@playwright/test";

test.describe("navigation smoke tests", () => {
  test("home page links to the tools directory", async ({ page }) => {
    await page.goto("/");
    const mainContent = page.locator("main main");

    await expect(
      mainContent.getByRole("heading", {
        name: "Turinhub Toolbox",
        exact: true,
      })
    ).toBeVisible();
    await expect(
      mainContent.getByRole("link", { name: "浏览全部在线工具" })
    ).toHaveAttribute("href", "/tools");

    await page.goto("/tools");
    await expect(
      page.getByRole("heading", { name: "在线工具大全" })
    ).toBeVisible();
  });

  test("tools directory links to representative tools", async ({ page }) => {
    await page.goto("/tools");
    const mainContent = page.locator("main main");

    await expect(
      mainContent.getByRole("link", { name: /Base64 编解码/ })
    ).toHaveAttribute("href", "/tools/base64");
    await expect(
      mainContent.getByRole("link", { name: /JSON 格式化/ })
    ).toHaveAttribute("href", "/tools/json-formatter");

    await page.goto("/tools/base64");
    await expect(
      page.getByRole("heading", { name: "Base64 编解码工具" })
    ).toBeVisible();
  });
});
