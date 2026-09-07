import { expect, test } from "@playwright/test";

test.describe("navigation smoke tests", () => {
  test("home page links to the tools directory", async ({ page }) => {
    await page.goto("/");
    const mainContent = page.locator("#main-content");

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
    const mainContent = page.locator("#main-content");

    await expect(
      mainContent.getByRole("link", { name: /Base64 编解码/ })
    ).toHaveAttribute("href", "/tools/base64");
    await expect(
      mainContent.getByRole("link", { name: /JSON 格式化/ })
    ).toHaveAttribute("href", "/tools/json-formatter");

    await page.goto("/tools/base64");
    await expect(
      page.getByRole("heading", { name: "Base64 编解码", exact: true })
    ).toBeVisible();
  });
});

test.describe("navigation and directory regression", () => {
  test("collapsed categories open a keyboard-accessible menu and navigate", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+b");
    const category = page.getByRole("button", {
      name: "开发者工具",
      exact: true,
    });
    await expect(category).toHaveAttribute("aria-haspopup", "menu");
    await category.focus();
    await category.press("Enter");
    const menu = page.getByRole("menu");
    await expect(
      menu.getByRole("menuitem", { name: "JSON 格式化", exact: true })
    ).toBeVisible();
    await menu.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(category).toBeFocused();
    await category.click();
    await menu
      .getByRole("menuitem", { name: "JSON 格式化", exact: true })
      .click();
    await expect(page).toHaveURL(/\/tools\/json-formatter$/);
  });

  test("mobile navigation remains complete after the desktop sidebar was collapsed", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+b");
    await expect(
      page.getByRole("button", { name: "开发者工具", exact: true })
    ).toHaveAttribute("aria-haspopup", "menu");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "打开菜单", exact: true }).click();
    const navigation = page.getByRole("dialog");
    const search = navigation.getByRole("searchbox", { name: "搜索侧栏工具" });
    await expect(search).toBeVisible();
    await search.fill("Base64");
    await navigation
      .getByRole("link", { name: "Base64 编解码", exact: true })
      .click();
    await expect(page).toHaveURL(/\/tools\/base64$/);
    await expect(navigation).not.toBeVisible();
  });

  test("the mobile home shows an actual tool in the first viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const firstTool = page
      .getByTestId("tool-directory-list")
      .getByRole("link", { name: /^JSON 格式化/ })
      .first();
    await expect(firstTool).toBeInViewport({ ratio: 1 });
    const category = page
      .locator("#main-content")
      .getByRole("link", { name: "系统与网络", exact: true });
    await expect(category).toHaveAttribute("href", "/tools?category=network");
    await category.click();
    await expect(page).toHaveURL(/\/tools\?category=network$/);
    await expect(
      page
        .getByTestId("tool-directory-list")
        .getByRole("heading", { name: "系统与网络", exact: true })
    ).toBeVisible();
    await expect(
      page
        .getByTestId("tool-directory-list")
        .getByRole("heading", { name: "开发者工具", exact: true })
    ).toHaveCount(0);
  });

  test("directory query and category survive refresh and browser Back", async ({
    page,
  }) => {
    await page.goto("/tools?category=developer&q=uuid");
    const search = page.getByRole("searchbox", {
      name: "搜索工具",
      exact: true,
    });
    const categories = page.getByRole("navigation", {
      name: "工具分类",
      exact: true,
    });
    const results = page.getByTestId("tool-directory-list");
    await expect(search).toHaveValue("uuid");
    await search.fill("");
    await search.pressSequentially("uuid");
    await expect(search).toHaveValue("uuid");
    await expect(
      categories.getByRole("link", { name: "开发者工具", exact: true })
    ).toHaveAttribute("aria-current", "page");
    await expect(results.getByRole("link", { name: /^UUID/ })).toHaveCount(1);
    await page.reload();
    await expect(search).toHaveValue("uuid");
    await categories
      .getByRole("link", { name: "全部分类", exact: true })
      .click();
    await expect(page).toHaveURL(/\/tools\?q=uuid$/);
    await search.fill("no-such-tool-12345");
    await expect(page).toHaveURL(/q=no-such-tool-12345/);
    await expect(
      page.getByText("没有找到符合条件的工具", { exact: true })
    ).toBeVisible();
    await page.goBack();
    await expect(search).toHaveValue("uuid");
    await expect(
      categories.getByRole("link", { name: "开发者工具", exact: true })
    ).toHaveAttribute("aria-current", "page");
    await expect(results.getByRole("link", { name: /^UUID/ })).toHaveCount(1);
    await page.getByRole("button", { name: "清除筛选", exact: true }).click();
    await expect(page).toHaveURL(/\/tools$/);
    await expect(search).toHaveValue("");
    await expect(
      results.getByRole("heading", { name: "系统与网络", exact: true })
    ).toBeVisible();
  });

  test("home search and category URLs work in English", async ({ page }) => {
    await page.goto("/en");
    const main = page.locator("#main-content");
    await expect(
      main.getByRole("link", { name: "System and Network", exact: true })
    ).toHaveAttribute("href", "/en/tools?category=network");
    await main
      .getByRole("searchbox", { name: "Search tools", exact: true })
      .fill("uuid");
    await main.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/tools\?q=uuid$/);
    await expect(
      page.getByRole("searchbox", { name: "Search tools", exact: true })
    ).toHaveValue("uuid");
    await expect(
      page
        .getByTestId("tool-directory-list")
        .getByRole("link", { name: /^UUID/ })
    ).toHaveAttribute("href", "/en/tools/uuid");
    await page
      .getByRole("navigation", { name: "Tool categories" })
      .getByRole("link", { name: "Developer Tools", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/tools\?q=uuid&category=developer$/);
  });
});
