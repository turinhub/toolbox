import { expect, test, type Page } from "@playwright/test";

async function setRegex(
  page: Page,
  pattern: string,
  text: string,
  flags = "g"
) {
  await page.getByLabel("标志", { exact: true }).fill(flags);
  await page.getByLabel("测试文本", { exact: true }).fill(text);
  await page.getByLabel("正则表达式", { exact: true }).fill(pattern);
}

test.describe("正则 P1 回归", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/regex");
  });

  test("零长度与 Unicode 匹配不会卡死，非全局模式只高亮首项", async ({
    page,
  }) => {
    await setRegex(page, "^", "");
    await expect(page.getByTestId("regex-match-list")).toContainText("0");

    await setRegex(page, "(?:)", "😀", "gu");
    const list = page.getByTestId("regex-match-list");
    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expect(list).toContainText("2");
    await expect(page.getByTestId("regex-highlight")).toHaveText("😀");

    await setRegex(page, "a", "aba", "");
    await expect(list.getByRole("listitem")).toHaveCount(1);
    await expect(
      page.getByTestId("regex-highlight").locator("mark")
    ).toHaveCount(1);
    await expect(page.getByTestId("regex-highlight")).toHaveText("aba");
  });

  test("HTML、SVG 与事件属性原样显示，不创建元素或执行事件", async ({
    page,
  }) => {
    const dialogs: string[] = [];
    page.on("dialog", async dialog => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    const text =
      '<b>hello</b>&amp;<img src=x onerror="alert(1)"><svg onload="alert(2)"></svg>';
    await setRegex(page, "hello", text);
    const output = page.getByTestId("regex-highlight");
    await expect(output).toHaveText(text);
    await expect(output.locator("mark")).toHaveText("hello");
    await expect(output.locator("b,img,svg,script")).toHaveCount(0);
    expect(dialogs).toEqual([]);

    await page.getByLabel("正则表达式", { exact: true }).fill("nomatch");
    await expect(output.locator("mark")).toHaveCount(0);
    await expect(output).toHaveText(text);
  });

  test("灾难回溯超时后输入仍可用，并能恢复到新结果", async ({ page }) => {
    await setRegex(page, "(a+)+$", "a".repeat(50_000) + "!");
    await expect(page.getByRole("alert")).toContainText("超过 1 秒，已停止");
    await expect(page.getByTestId("regex-match-list")).toHaveCount(0);

    await setRegex(page, "b", "abc");
    await expect(
      page.getByTestId("regex-highlight").locator("mark")
    ).toHaveText("b");
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("连续修改输入后只显示最新结果，语法错误清空结果", async ({ page }) => {
    await setRegex(page, "a", "aaa");
    await expect(
      page.getByTestId("regex-highlight").locator("mark")
    ).toHaveCount(3);
    await page.getByLabel("测试文本", { exact: true }).fill("bbb");
    await page.getByLabel("正则表达式", { exact: true }).fill("b");
    await page.getByLabel("测试文本", { exact: true }).fill("bc");
    await expect(page.getByTestId("regex-highlight")).toHaveText("bc");
    await expect(
      page.getByTestId("regex-highlight").locator("mark")
    ).toHaveText("b");

    await page.getByLabel("正则表达式", { exact: true }).fill("[");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByTestId("regex-highlight")).toHaveCount(0);
    await expect(page.getByTestId("regex-match-list")).toHaveCount(0);
  });

  test("匹配上限明确提示且列表分页", async ({ page }) => {
    await setRegex(page, "a", "a".repeat(1100));
    await expect(
      page.getByText(/上限.*1000|1,000.*上限|上限.*1,000/)
    ).toBeVisible();
    const list = page.getByTestId("regex-match-list");
    await expect(list.getByRole("listitem")).toHaveCount(50);
    await page.getByRole("button", { name: "下一页", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "上一页", exact: true })
    ).toBeEnabled();
    await expect(list.getByRole("listitem")).toHaveCount(50);
  });

  test("英文路由使用同一匹配实现和英文状态文案", async ({ page }) => {
    await page.goto("/en/tools/regex");
    await page.getByLabel("Test text", { exact: true }).fill("abc");
    await page.getByLabel("Regular expression", { exact: true }).fill("b");
    await expect(
      page.getByTestId("regex-highlight").locator("mark")
    ).toHaveText("b");
  });
});
