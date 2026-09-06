import { expect, test } from "@playwright/test";

const key = "docker-registry-configs";
const endpoint = "https://registry.example.com";

for (const locale of [
  {
    path: "/tools/docker-registry",
    manage: "管理配置",
    save: "保存当前",
    name: "配置名称",
    saved: "配置已保存，不包含密码",
  },
  {
    path: "/en/tools/docker-registry",
    manage: "Manage configs",
    save: "Save current",
    name: "Config name",
    saved: "Config saved without a password",
  },
]) {
  test(`${locale.path}: migrates passwords and requires an explicit connection after loading`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, endpoint }) => {
        if (!sessionStorage.getItem("seeded")) {
          localStorage.setItem(
            key,
            JSON.stringify([
              {
                name: "private",
                config: {
                  url: endpoint,
                  username: "reader",
                  password: "old-secret",
                },
              },
              { name: "public", config: { url: endpoint } },
            ])
          );
          sessionStorage.setItem("seeded", "true");
        }
      },
      { key, endpoint }
    );
    const actionRequests: string[] = [];
    await page.route("**/*", async route => {
      if (route.request().headers()["next-action"]) {
        actionRequests.push(route.request().url());
        await route.abort();
      } else await route.continue();
    });
    await page.goto(locale.path);
    const safeConfigs = [
      { name: "private", config: { url: endpoint, username: "reader" } },
      { name: "public", config: { url: endpoint } },
    ];
    await expect
      .poll(() =>
        page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)
      )
      .toEqual(safeConfigs);
    await page.getByLabel(/密码|Password/).fill("different-secret");
    await page
      .getByRole("button", { name: locale.manage, exact: true })
      .click();
    await page
      .getByRole("button", { name: `private ${endpoint}`, exact: true })
      .click();
    await expect(page.getByLabel("Registry URL", { exact: true })).toHaveValue(
      endpoint
    );
    await expect(page.getByLabel(/用户名|Username/)).toHaveValue("reader");
    await expect(page.getByLabel(/密码|Password/)).toHaveValue("");
    await expect(
      page.getByRole("button", { name: /^(连接 Registry|Connect Registry)$/ })
    ).toBeVisible();

    await page.getByLabel(/密码|Password/).fill("new-secret");
    await page
      .getByRole("button", { name: locale.manage, exact: true })
      .click();
    await page
      .getByRole("textbox", { name: locale.name, exact: true })
      .fill("new");
    await page.getByRole("button", { name: locale.save, exact: true }).click();
    await expect(page.getByText(locale.saved, { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)
      )
      .toEqual([
        ...safeConfigs,
        { name: "new", config: { url: endpoint, username: "reader" } },
      ]);
    await page.reload();
    await page
      .getByRole("button", { name: locale.manage, exact: true })
      .click();
    await page
      .getByRole("button", { name: `new ${endpoint}`, exact: true })
      .click();
    await expect(page.getByLabel(/密码|Password/)).toHaveValue("");
    expect(actionRequests).toEqual([]);
  });
}

test("migration failure is visible and cannot overwrite existing configs", async ({
  page,
}) => {
  await page.addInitScript(key => {
    localStorage.setItem(
      key,
      JSON.stringify([
        {
          name: "existing",
          config: {
            url: "https://registry.example.com",
            password: "legacy-secret",
          },
        },
      ])
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key)
        throw new DOMException("Storage blocked", "SecurityError");
      original.call(this, name, value);
    };
  }, key);
  await page.goto("/tools/docker-registry");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "无法读取已保存的配置或清理旧密码" })
  ).toContainText("无法读取已保存的配置或清理旧密码");
  await page.getByRole("button", { name: "管理配置", exact: true }).click();
  await expect(page.getByRole("button", { name: "保存当前" })).toBeDisabled();
  expect(
    await page.evaluate(
      key => JSON.parse(localStorage.getItem(key)!)[0].name,
      key
    )
  ).toBe("existing");
});

test("failed saves do not report success or add an unsaved config", async ({
  page,
}) => {
  await page.goto("/tools/docker-registry");
  await page.getByRole("button", { name: "管理配置", exact: true }).click();
  await expect(page.getByRole("button", { name: "保存当前" })).toBeEnabled();
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key)
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      original.call(this, name, value);
    };
  }, key);
  await page
    .getByRole("textbox", { name: "配置名称", exact: true })
    .fill("unsaved");
  await page.getByRole("button", { name: "保存当前" }).click();
  await expect(
    page.getByText("无法更新配置，请检查浏览器存储权限和可用空间后重试。")
  ).toBeVisible();
  await expect(page.getByText("暂无保存的配置")).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
});
