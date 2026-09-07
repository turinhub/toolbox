import { expect, test } from "@playwright/test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

test("仅正则静态 Worker 绕过人机验证，工具页和其他 Worker 仍受保护", () => {
  const envKeys = [
    "TOOLBOX_PROXY_TURNSTILE",
    "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY",
    "CLOUDFLARE_TURNSTILE_SECRETKEY",
  ] as const;
  const original = envKeys.map(key => process.env[key]);

  try {
    process.env.TOOLBOX_PROXY_TURNSTILE = "true";
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY = "test-site-key";
    process.env.CLOUDFLARE_TURNSTILE_SECRETKEY = "test-only-secret";

    for (const path of ["/workers/regex.worker.js", "/api/test"]) {
      const response = proxy(new NextRequest(`https://toolbox.test${path}`));
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("location")).toBeNull();
    }

    for (const path of [
      "/tools/regex",
      "/en/tools/regex",
      "/workers/other.worker.js",
      "/workers/regex.worker.js/extra",
    ]) {
      const response = proxy(new NextRequest(`https://toolbox.test${path}`));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `https://toolbox.test${path.startsWith("/en/") ? "/en" : "/"}?verify=1`
      );
    }
  } finally {
    envKeys.forEach((key, index) => {
      if (original[index] === undefined) delete process.env[key];
      else process.env[key] = original[index];
    });
  }
});
