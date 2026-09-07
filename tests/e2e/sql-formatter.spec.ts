import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.describe("SQL 结果状态", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/sql-formatter");
  });

  test("输入和格式选项改变后旧结果不能复制或下载", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const input = page.getByLabel("输入 SQL", { exact: true });
    const output = page.getByLabel("格式化结果", { exact: true });
    const format = page.getByRole("button", {
      name: "格式化 SQL",
      exact: true,
    });
    const copy = page.getByRole("button", { name: "复制", exact: true });
    const download = page.getByRole("button", { name: "下载", exact: true });

    await input.fill("select 1;");
    await format.click();
    await expect(output).toHaveValue("SELECT\n  1;");
    await copy.click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("SELECT\n  1;");

    await input.fill("select 2;");
    await expect(output).toHaveValue("");
    await expect(copy).toHaveCount(0);
    await expect(download).toHaveCount(0);
    await format.click();

    for (const tabName of ["4", "否", "PostgreSQL"]) {
      await page.getByRole("tab", { name: tabName, exact: true }).click();
      await expect(output).toHaveValue("");
      await expect(copy).toHaveCount(0);
      await expect(download).toHaveCount(0);
      await format.click();
    }
    await expect(output).toHaveValue("select\n    2;");
    const downloaded = page.waitForEvent("download");
    await download.click();
    const file = await downloaded;
    expect(await readFile((await file.path())!, "utf8")).toBe("select\n    2;");
  });

  test("格式化失败在字段附近显示错误并能恢复", async ({ page }) => {
    const input = page.getByLabel("输入 SQL", { exact: true });
    const output = page.getByLabel("格式化结果", { exact: true });
    const format = page.getByRole("button", {
      name: "格式化 SQL",
      exact: true,
    });
    await input.fill("select 1;");
    await format.click();
    await expect(output).not.toHaveValue("");

    await input.fill("select '");
    await format.click();
    await expect(page.getByRole("alert")).toContainText(
      "检查 SQL 语法和所选方言"
    );
    await expect(input).toBeFocused();
    await expect(output).toHaveValue("");
    await expect(
      page.getByRole("button", { name: "复制", exact: true })
    ).toHaveCount(0);

    await input.fill("select 3;");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await format.click();
    await expect(output).toHaveValue("SELECT\n  3;");
  });

  test("未完成的文件读取不能覆盖后续手动输入", async ({ page }) => {
    await page.evaluate(() => {
      const nativeRead = FileReader.prototype.readAsText;
      const target = window as Window & {
        releaseSqlRead?: () => Promise<void>;
      };
      FileReader.prototype.readAsText = function (file, encoding) {
        target.releaseSqlRead = () =>
          new Promise(resolve => {
            this.addEventListener("loadend", () => resolve(), { once: true });
            nativeRead.call(this, file, encoding);
          });
      };
    });
    await page.getByLabel("上传 SQL 文件", { exact: true }).setInputFiles({
      name: "old.sql",
      mimeType: "text/plain",
      buffer: Buffer.from("select 'old file';"),
    });
    const format = page.getByRole("button", {
      name: "格式化 SQL",
      exact: true,
    });
    await expect(format).toBeDisabled();
    const input = page.getByLabel("输入 SQL", { exact: true });
    await input.fill("select 'current input';");
    await expect(format).toBeEnabled();
    await format.click();
    await page.evaluate(async () => {
      await (
        window as Window & { releaseSqlRead?: () => Promise<void> }
      ).releaseSqlRead?.();
    });
    await expect(input).toHaveValue("select 'current input';");
    await expect(page.getByLabel("格式化结果", { exact: true })).toHaveValue(
      "SELECT\n  'current input';"
    );
  });
});
