import { expect, test, type Locator } from "@playwright/test";
import { buildAbsoluteUrl, getSiteUrl } from "@/lib/seo";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const origin =
  process.env.SEO_EXPECTED_ORIGIN ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://toolbox.turinhub.com";

async function expectUrl(
  locator: Locator,
  attribute: string,
  expected: string
) {
  await expect(locator).toHaveAttribute(attribute, /^https?:\/\//);
  expect(new URL((await locator.getAttribute(attribute))!).toString()).toBe(
    new URL(expected).toString()
  );
}

test("SEO defaults and self-hosted overrides share the same origin", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    for (const value of [undefined, "", "  ", "https://self-hosted.example/"]) {
      if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = value;
      const expected = value?.startsWith("https")
        ? "https://self-hosted.example"
        : "https://toolbox.turinhub.com";
      expect(getSiteUrl()).toBe(expected);
      expect(buildAbsoluteUrl("/tools/docker-registry", "en")).toBe(
        `${expected}/en/tools/docker-registry`
      );
      expect(robots().sitemap).toBe(`${expected}/sitemap.xml`);
      expect(
        sitemap().every(entry => new URL(entry.url).origin === expected)
      ).toBe(true);
    }
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

for (const path of [
  "/",
  "/en",
  "/tools",
  "/en/tools",
  "/tools/docker-registry",
  "/en/tools/docker-registry",
]) {
  test(`${path}: serves correct canonical, alternates and structured data`, async ({
    page,
  }) => {
    await page.goto(path);
    const expected = new URL(path, origin).toString();
    await expectUrl(page.locator('link[rel="canonical"]'), "href", expected);
    await expectUrl(
      page.locator('meta[property="og:url"]'),
      "content",
      expected
    );
    const zhPath = path === "/en" ? "/" : path.replace(/^\/en\//, "/");
    const enPath = zhPath === "/" ? "/en" : `/en${zhPath}`;
    await expectUrl(
      page.locator('link[hreflang="zh-CN"]'),
      "href",
      new URL(zhPath, origin).toString()
    );
    await expectUrl(
      page.locator('link[hreflang="en"]'),
      "href",
      new URL(enPath, origin).toString()
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${origin}/og-image.png`
    );
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLd.length).toBeGreaterThan(0);
    const urls: string[] = [];
    const collect = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(collect);
      else if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) {
          if ((key === "url" || key === "logo") && typeof child === "string")
            urls.push(child);
          else collect(child);
        }
      }
    };
    jsonLd.forEach(text => collect(JSON.parse(text)));
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every(url => new URL(url).origin === origin)).toBe(true);
  });
}

test("robots and every sitemap URL use the expected origin", async ({
  request,
}) => {
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.ok()).toBe(true);
  const robotsText = await robotsResponse.text();
  expect(robotsText).toContain(`Sitemap: ${origin}/sitemap.xml`);
  expect(robotsText).toContain("Disallow: /api/");
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const xml = await sitemapResponse.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>|href="([^"]+)"/g)].map(
    match => match[1] ?? match[2]
  );
  expect(urls.length).toBeGreaterThan(60);
  expect(urls.every(url => new URL(url).origin === origin)).toBe(true);
});
