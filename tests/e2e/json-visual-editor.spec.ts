import { expect, test, type Page } from "@playwright/test";

type JsonPath = readonly (string | number)[];

function nodeAt(page: Page, path: JsonPath) {
  return page.getByTestId(`json-node-${JSON.stringify(path)}`);
}

async function importJson(page: Page, value: unknown) {
  await page.getByRole("button", { name: "导入", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "导入 JSON 数据" });
  await dialog.getByLabel("粘贴 JSON 数据").fill(JSON.stringify(value));
  await dialog.getByRole("button", { name: "导入数据", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

async function editValue(page: Page, path: JsonPath, value: string) {
  const node = nodeAt(page, path);
  await node.getByRole("button", { name: "编辑当前值", exact: true }).click();
  await node.getByRole("textbox", { name: "值", exact: true }).fill(value);
  await node.getByRole("button", { name: "保存当前值", exact: true }).click();
  await expect(
    node.getByRole("textbox", { name: "值", exact: true })
  ).toHaveCount(0);
}

async function appendItem(
  page: Page,
  path: JsonPath,
  type: "对象" | "布尔值",
  value: string
) {
  const node = nodeAt(page, path);
  await node.getByRole("button", { name: "添加数组元素", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "添加数组元素",
    exact: true,
  });
  await dialog.getByLabel("数据类型", { exact: true }).click();
  await page.getByRole("option", { name: type, exact: true }).click();
  if (type === "布尔值") {
    await dialog.getByLabel("值", { exact: true }).click();
    await page.getByRole("option", { name: value, exact: true }).click();
  } else {
    await dialog.getByLabel("值", { exact: true }).fill(value);
  }
  await dialog.getByRole("button", { name: "确认添加", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

async function deleteValue(page: Page, path: JsonPath) {
  const node = nodeAt(page, path);
  await node.getByRole("button", { name: "删除当前值", exact: true }).click();
}

async function expectPreview(page: Page, value: unknown) {
  await page.getByRole("button", { name: "预览", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "JSON 数据预览" });
  await expect(dialog.locator("pre")).toHaveText(
    JSON.stringify(value, null, 2)
  );
  await dialog.press("Escape");
  await expect(dialog).not.toBeVisible();
}

test.describe("JSON visual editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/json-visual-editor");
    await expect(
      page.getByRole("heading", {
        name: "JSON 可视化编辑器",
        exact: true,
        level: 1,
      })
    ).toBeVisible();
  });

  test("imports a root array and preserves its type after editing, adding, and deleting", async ({
    page,
  }) => {
    await importJson(page, [1, "remove", false, null]);

    await editValue(page, [0], "2");
    await appendItem(page, [], "对象", '{"keep":[true]}');
    await deleteValue(page, [1]);

    await expectPreview(page, [2, false, null, { keep: [true] }]);
  });

  test("edits values and opens array actions using the keyboard without hovering", async ({
    page,
  }) => {
    await importJson(page, { label: "original", items: [] });
    const root = nodeAt(page, []);
    const leaf = nodeAt(page, ["label"]);
    const edit = leaf.getByRole("button", { name: "编辑当前值", exact: true });
    await expect(edit).toBeVisible();
    await root
      .getByRole("button", { name: "收起对象节点", exact: true })
      .focus();
    await page.keyboard.press("Tab");
    await expect(
      root.getByRole("button", { name: "添加对象字段", exact: true })
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(edit).toBeFocused();
    await page.keyboard.press("Enter");
    const input = leaf.getByRole("textbox", { name: "值", exact: true });
    await expect(input).toBeFocused();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.insertText("changed");
    await page.keyboard.press("Enter");
    await expect(edit).toBeFocused();
    await expect(leaf).toContainText('"changed"');

    await page.keyboard.press("Enter");
    await expect(input).toBeFocused();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.insertText("discard");
    await page.keyboard.press("Escape");
    await expect(edit).toBeFocused();
    await expect(leaf).toContainText('"changed"');
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(
      nodeAt(page, ["items"]).getByRole("button", {
        name: "展开数组节点",
        exact: true,
      })
    ).toBeFocused();
    await page.keyboard.press("Tab");
    const addArray = nodeAt(page, ["items"]).getByRole("button", {
      name: "添加数组元素",
      exact: true,
    });
    await expect(addArray).toBeFocused();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "添加数组元素",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(addArray).toBeFocused();
  });

  test("edits nested arrays and literal dotted or empty keys without changing sibling fields", async ({
    page,
  }) => {
    await importJson(page, {
      "a.b": { "": [10, "remove"] },
      a: { b: "untouched" },
      "": "root empty key",
    });
    await page.getByRole("button", { name: "展开全部", exact: true }).click();

    await editValue(page, ["a.b", "", 0], "11");
    await appendItem(page, ["a.b", ""], "布尔值", "false");
    await deleteValue(page, ["a.b", "", 1]);
    await editValue(page, [""], "updated empty key");

    await expectPreview(page, {
      "a.b": { "": [11, false] },
      a: { b: "untouched" },
      "": "updated empty key",
    });
  });

  test("keeps the previous document after an invalid edit or invalid import", async ({
    page,
  }) => {
    const original = { count: 12, enabled: false, items: [1, null] };
    await importJson(page, original);

    const countNode = nodeAt(page, ["count"]);
    await countNode.hover();
    await countNode
      .getByRole("button", { name: "编辑当前值", exact: true })
      .click();
    await countNode
      .getByRole("textbox", { name: "值", exact: true })
      .fill("12oops");
    await countNode
      .getByRole("button", { name: "保存当前值", exact: true })
      .click();
    await expect(countNode.getByRole("alert")).toHaveText("值格式错误");
    await expect(
      countNode.getByRole("textbox", { name: "值", exact: true })
    ).toHaveValue("12oops");
    await countNode
      .getByRole("button", { name: "取消编辑", exact: true })
      .click();
    await expectPreview(page, original);

    await page.getByRole("button", { name: "导入", exact: true }).click();
    const importDialog = page.getByRole("dialog", { name: "导入 JSON 数据" });
    await importDialog.getByLabel("粘贴 JSON 数据").fill('{"count":');
    await importDialog
      .getByRole("button", { name: "导入数据", exact: true })
      .click();
    await expect(importDialog.getByRole("alert")).toHaveText("JSON 格式错误");
    await expect(importDialog).toBeVisible();
    await expect(importDialog.getByLabel("粘贴 JSON 数据")).toHaveValue(
      '{"count":'
    );
    await importDialog.press("Escape");

    await expectPreview(page, original);
  });

  test("imports a JSON file with a nested array and previews the edited result", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "导入", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "导入 JSON 数据" });
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "nested-array.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ rows: [{ active: false, value: null }] })
      ),
    });
    await expect(dialog).not.toBeVisible();
    await page.getByRole("button", { name: "展开全部", exact: true }).click();

    await editValue(page, ["rows", 0, "active"], "true");
    await expectPreview(page, { rows: [{ active: true, value: null }] });
  });
});
