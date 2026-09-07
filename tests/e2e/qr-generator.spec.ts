import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAklEQVR4AewaftIAAAFsSURBVMXBAYrbQBAAwW6h/3+544FbWITOMU5AVfbCgw4edvJD5RMVO5WKoVKh8omKk03Fb1QWlYq/qfiNyjh42MkNlV3FrkJlVLyjsqvYnXyp4n84+ILKTkXlGwcPO7lR8U6FyqhYKq4q3jnZqHxCpWKoVAyVikXlbw4eZi98QWVU/IuDHyqLylBRGSoqVyqLypWKyqKistgLv1BZKobKqFhURoVKxVCp2KksFQcPO/mhUjFURsVQUdmpjIorlSuVO/bCDZWlYlGpUBkVKruKobJU7FQqDh52slEZFRUqQ2Wp2KksFSoqS8U7J5uKXcUdlV3FUqFyR+Xq5IfKJyoqVK5UKioWlVFRobI7eNjJpuI3KruKq4qh8qmDGyoqKipXKovKorKrWFTuHDzs5AsVKqNCZVSoVFxV7CrGyRdU3lG5o1IxVCpOblS8U7GoLCqj4k6FyqgYBw872ah8QqXiqkJF5apip1JhLzzoDwV27HztoIR2AAAAAElFTkSuQmCC",
  "base64"
);

test.describe("二维码结果状态", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/qr-generator");
  });

  test("上传模式未选择图片时明确提示，修正后下载当前结果", async ({ page }) => {
    await page
      .getByLabel("内容", { exact: true })
      .fill("https://example.com/current");
    await page.getByRole("tab", { name: "上传图片", exact: true }).click();
    await page.getByRole("button", { name: "生成二维码", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("请先选择一张中心图片");
    await expect(
      page.getByRole("button", { name: "选择图片", exact: true })
    ).toBeFocused();
    await expect(
      page.getByAltText("生成的二维码", { exact: true })
    ).toHaveCount(0);
    await expect(page.getByText("二维码生成成功", { exact: true })).toHaveCount(
      0
    );

    await page.getByLabel("上传图片", { exact: true }).setInputFiles({
      name: "center.png",
      mimeType: "image/png",
      buffer: png,
    });
    await expect(page.getByAltText("已选择的中心图片")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.getByRole("button", { name: "生成二维码", exact: true }).click();
    const image = page.getByAltText("生成的二维码", { exact: true });
    await expect(image).toBeVisible();
    const source = (await image.getAttribute("src"))!;
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name: "下载", exact: true }).click();
    const file = await downloaded;
    expect(await readFile((await file.path())!)).toEqual(
      Buffer.from(source.split(",")[1], "base64")
    );
  });

  test("内容或容错设置变化会清除旧图，无效图片也不会保留旧结果", async ({
    page,
  }) => {
    const input = page.getByLabel("内容", { exact: true });
    const generate = page.getByRole("button", {
      name: "生成二维码",
      exact: true,
    });
    const image = page.getByAltText("生成的二维码", { exact: true });
    await input.fill("first");
    await generate.click();
    await expect(image).toBeVisible();
    await input.fill("second");
    await expect(image).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "下载", exact: true })
    ).toHaveCount(0);
    await generate.click();
    await expect(image).toBeVisible();

    await page.getByLabel("容错级别", { exact: true }).click();
    await page
      .getByRole("option", { name: "H - 最高 (~30%)", exact: true })
      .click();
    await expect(image).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "复制图片", exact: true })
    ).toHaveCount(0);
    await generate.click();
    await expect(image).toBeVisible();

    await page.getByRole("tab", { name: "上传图片", exact: true }).click();
    await page.getByLabel("上传图片", { exact: true }).setInputFiles({
      name: "broken.png",
      mimeType: "image/png",
      buffer: Buffer.from("not a PNG image"),
    });
    await expect(page.getByRole("alert")).toContainText("无法读取图片");
    await expect(image).toHaveCount(0);
    await expect(generate).toBeEnabled();
  });

  test("生成失败不会保留旧图，缩短输入后可重新生成", async ({ page }) => {
    const input = page.getByLabel("内容", { exact: true });
    const generate = page.getByRole("button", {
      name: "生成二维码",
      exact: true,
    });
    await input.fill("A".repeat(10_000));
    await generate.click();
    await expect(page.getByRole("alert")).toContainText(
      "缩短内容或调整容错级别"
    );
    await expect(
      page.getByAltText("生成的二维码", { exact: true })
    ).toHaveCount(0);
    await expect(page.getByText("二维码生成成功", { exact: true })).toHaveCount(
      0
    );
    await expect(generate).toBeEnabled();
    await input.fill("recover");
    await generate.click();
    await expect(
      page.getByAltText("生成的二维码", { exact: true })
    ).toBeVisible();
  });

  test("读取图片时修改输入会取消旧上传并恢复生成按钮", async ({ page }) => {
    await page.evaluate(() => {
      const nativeRead = FileReader.prototype.readAsDataURL;
      const target = window as Window & {
        releaseImageRead?: () => Promise<void>;
      };
      FileReader.prototype.readAsDataURL = function (file) {
        target.releaseImageRead = () =>
          new Promise(resolve => {
            this.addEventListener("loadend", () => resolve(), { once: true });
            nativeRead.call(this, file);
          });
      };
    });
    await page.getByRole("tab", { name: "上传图片", exact: true }).click();
    await page.getByLabel("上传图片", { exact: true }).setInputFiles({
      name: "pending.png",
      mimeType: "image/png",
      buffer: png,
    });
    await expect(
      page.getByRole("button", { name: "正在读取图片…", exact: true })
    ).toBeDisabled();
    await page.getByLabel("内容", { exact: true }).fill("latest input");
    await expect(
      page.getByRole("button", { name: "生成二维码", exact: true })
    ).toBeEnabled();
    await page.evaluate(async () => {
      await (
        window as Window & { releaseImageRead?: () => Promise<void> }
      ).releaseImageRead?.();
    });
    await expect(page.getByAltText("已选择的中心图片")).toHaveCount(0);
    await page.getByRole("tab", { name: "无图片", exact: true }).click();
    await page.getByRole("button", { name: "生成二维码", exact: true }).click();
    await expect(
      page.getByAltText("生成的二维码", { exact: true })
    ).toBeVisible();
  });

  test("旧生成任务延迟加载中心图片时不能覆盖新结果", async ({ page }) => {
    await page.getByLabel("内容", { exact: true }).fill("old content");
    await page.getByRole("tab", { name: "上传图片", exact: true }).click();
    await page.getByLabel("上传图片", { exact: true }).setInputFiles({
      name: "center.png",
      mimeType: "image/png",
      buffer: png,
    });
    await expect(page.getByAltText("已选择的中心图片")).toBeVisible();

    await page.evaluate(() => {
      const NativeImage = window.Image;
      const source = Object.getOwnPropertyDescriptor(
        HTMLImageElement.prototype,
        "src"
      )!;
      const target = window as Window & {
        releaseQrImage?: () => Promise<void>;
      };
      window.Image = function () {
        const image = new NativeImage();
        Object.defineProperty(image, "src", {
          get: () => source.get!.call(image),
          set: (value: string) => {
            if (value.startsWith("data:image/")) {
              target.releaseQrImage = () =>
                new Promise(resolve => {
                  image.addEventListener("load", () => resolve(), {
                    once: true,
                  });
                  source.set!.call(image, value);
                });
            } else source.set!.call(image, value);
          },
        });
        return image;
      } as unknown as typeof Image;
    });
    await page.getByRole("button", { name: "生成二维码", exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          Boolean(
            (window as Window & { releaseQrImage?: () => Promise<void> })
              .releaseQrImage
          )
        )
      )
      .toBe(true);
    await page.getByLabel("内容", { exact: true }).fill("latest content");
    await page.getByRole("tab", { name: "无图片", exact: true }).click();
    await page.getByRole("button", { name: "生成二维码", exact: true }).click();
    const result = page.getByAltText("生成的二维码", { exact: true });
    await expect(result).toBeVisible();
    const currentSource = await result.getAttribute("src");
    await page.evaluate(async () => {
      await (
        window as Window & { releaseQrImage?: () => Promise<void> }
      ).releaseQrImage?.();
    });
    await expect(result).toHaveAttribute("src", currentSource!);
  });

  test("375px 英文页的示例说明换行且不产生横向溢出", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/tools/qr-generator");
    const example = page.getByRole("button", {
      name: /Wi-Fi connection.*Generate a QR code for Wi-Fi connection details/,
    });
    await expect(example).toBeVisible();
    await expect
      .poll(() =>
        example.evaluate(element => element.scrollWidth <= element.clientWidth)
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true);
    await example.click();
    await expect(page.getByLabel("Content", { exact: true })).toHaveValue(
      "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;"
    );
  });
});
