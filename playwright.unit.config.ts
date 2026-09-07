import { defineConfig } from "@playwright/test";

// 纯逻辑回归沿用 Playwright runner，不启动应用服务或浏览器。
export default defineConfig({
  testDir: "./tests/unit",
  workers: 1,
  timeout: 10_000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
});
