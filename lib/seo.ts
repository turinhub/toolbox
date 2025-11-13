import type { Metadata } from "next";
import { toolCategories } from "@/lib/routes";

export function getToolByPath(path: string) {
  for (const c of toolCategories) {
    for (const t of c.tools) {
      if (t.path === path) return t;
    }
  }
  return null;
}

export function buildToolMetadata(
  path: string,
  site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://turinhub.com"
): Metadata {
  const t = getToolByPath(path);
  const url = new URL(path, site).toString();
  const title = t ? t.title : "工具";
  const description = t?.description ?? "实用在线工具。";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Turinhub Toolbox",
      type: "website",
      locale: "zh-CN",
      images: [
        {
          url: "https://turinhub.com/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://turinhub.com/og-image.png"],
    },
    robots: { index: true, follow: true },
  };
}
