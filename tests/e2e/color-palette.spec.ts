import { expect, test, type Page } from "@playwright/test";

async function mockClipboard(page: Page, shouldFail = false) {
  await page.addInitScript(fail => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          if (fail)
            throw new DOMException(
              "Clipboard access denied",
              "NotAllowedError"
            );
          const values = JSON.parse(
            sessionStorage.getItem("clipboard-values") || "[]"
          );
          sessionStorage.setItem(
            "clipboard-values",
            JSON.stringify([...values, value])
          );
        },
      },
    });
  }, shouldFail);
}

async function clipboardValues(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("clipboard-values") || "[]")
  );
}

test.describe("color palette accessibility", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`supports keyboard color copying and visible focus in ${theme} mode`, async ({
      page,
    }) => {
      await mockClipboard(page);
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/tools/color-palette");
      await expect(page.locator("html")).toHaveClass(
        new RegExp(`\\b${theme}\\b`)
      );

      const palette = page.getByRole("region", {
        name: "Tableau 10",
        exact: true,
      });
      const exportButton = palette.getByRole("button", {
        name: "导出 Tableau 10 配色方案",
        exact: true,
      });
      const swatch = palette.getByRole("button", {
        name: "复制 Tableau 10 的颜色 #4e79a7",
        exact: true,
      });

      await page.keyboard.press("Tab");
      await exportButton.focus();
      await expect(exportButton).toHaveCSS("outline-style", "solid");
      await expect(exportButton).toHaveCSS("outline-width", "2px");
      await expect(exportButton).toHaveCSS("outline-offset", "2px");
      await page.keyboard.press("Tab");
      await expect(swatch).toBeFocused();
      await expect(swatch).toHaveCSS("outline-style", "solid");
      await expect(swatch).toHaveCSS("outline-width", "2px");

      const contrast = await swatch.evaluate(element => {
        const luminance = (color: string) => {
          const channels = color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number);
          const linear = channels.map(channel => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
        };
        const ring = luminance(getComputedStyle(element).outlineColor);
        const background = luminance(
          getComputedStyle(document.body).backgroundColor
        );
        return (
          (Math.max(ring, background) + 0.05) /
          (Math.min(ring, background) + 0.05)
        );
      });
      expect(contrast).toBeGreaterThanOrEqual(3);

      await page.keyboard.press("Enter");
      await expect.poll(() => clipboardValues(page)).toEqual(["#4e79a7"]);
      await page.keyboard.press("Space");
      await expect
        .poll(() => clipboardValues(page))
        .toEqual(["#4e79a7", "#4e79a7"]);
    });
  }

  for (const action of ["single color", "whole palette"] as const) {
    test(`reports clipboard failure for ${action} without reporting success`, async ({
      page,
    }) => {
      await mockClipboard(page, true);
      await page.goto("/tools/color-palette");
      const palette = page.getByRole("region", {
        name: "Tableau 10",
        exact: true,
      });
      await palette
        .getByRole("button", {
          name:
            action === "single color"
              ? "复制 Tableau 10 的颜色 #4e79a7"
              : "复制 Tableau 10 配色方案",
          exact: true,
        })
        .click();

      await expect(
        page.getByText("复制失败，请允许剪贴板访问或手动复制颜色值。", {
          exact: true,
        })
      ).toBeVisible();
      await expect(page.getByText(/已复制到剪贴板$/)).toHaveCount(0);
      expect(await clipboardValues(page)).toEqual([]);
    });
  }
});

test.describe("color contrast analysis", () => {
  test("evaluates white and black backgrounds independently for normal-size text", async ({
    page,
  }) => {
    await page.goto("/tools/color-palette");
    await page.getByRole("tab", { name: "颜色分析", exact: true }).click();
    const input = page.getByLabel("输入颜色值", { exact: true });

    await input.fill(" FFFFFF ");
    await input.press("Enter");
    await expect(input).toHaveValue("#ffffff");
    const white = page.getByRole("region", { name: "白色背景", exact: true });
    const black = page.getByRole("region", { name: "黑色背景", exact: true });
    await expect(
      white.getByText("对比度 1.00:1", { exact: true })
    ).toBeVisible();
    await expect(white.getByText("AA 不通过", { exact: true })).toBeVisible();
    await expect(white.getByText("AAA 不通过", { exact: true })).toBeVisible();
    await expect(
      black.getByText("对比度 21.00:1", { exact: true })
    ).toBeVisible();
    await expect(black.getByText("AA 通过", { exact: true })).toBeVisible();
    await expect(black.getByText("AAA 通过", { exact: true })).toBeVisible();

    await input.fill("#777777");
    await input.press("Enter");
    await expect(
      white.getByText("对比度 4.48:1", { exact: true })
    ).toBeVisible();
    await expect(white.getByText("AA 不通过", { exact: true })).toBeVisible();
    await expect(black.getByText("AA 通过", { exact: true })).toBeVisible();
    await expect(black.getByText("AAA 不通过", { exact: true })).toBeVisible();
  });

  test("clears stale analysis and explains invalid color input", async ({
    page,
  }) => {
    await page.goto("/tools/color-palette");
    await page.getByRole("tab", { name: "颜色分析", exact: true }).click();
    const input = page.getByLabel("输入颜色值", { exact: true });
    await input.fill("#ffffff");
    await input.press("Enter");
    await expect(
      page.getByRole("region", { name: "白色背景", exact: true })
    ).toBeVisible();

    await input.fill("#invalid");
    await page.getByRole("button", { name: "分析颜色", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "请输入六位十六进制颜色，例如 #4e79a7。"
    );
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByRole("region", { name: "白色背景", exact: true })
    ).toHaveCount(0);
  });
});

test.describe("mobile color palette", () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });

  test("copies a color by touch without overflowing the English layout", async ({
    page,
  }) => {
    await mockClipboard(page);
    await page.goto("/en/tools/color-palette");
    const palette = page.getByRole("region", {
      name: "Tableau 10",
      exact: true,
    });
    const swatch = palette.getByRole("button", {
      name: "Copy #4e79a7 from Tableau 10",
      exact: true,
    });
    const bounds = await swatch.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await swatch.tap();
    await expect.poll(() => clipboardValues(page)).toEqual(["#4e79a7"]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});
