import type { Metadata } from "next";
import { toolCategories } from "@/lib/routes";

const SITE_NAME = "Turinhub Toolbox";
const DEFAULT_SITE_URL = "https://turinhub.com";
const DEFAULT_DESCRIPTION =
  "常用网页工具的汇集网站，提供免费、无广告、尽量本地处理的在线工具体验。";
const OG_IMAGE_PATH = "/og-image.png";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(
    /\/$/,
    ""
  );
}

export function buildAbsoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}

export function getToolByPath(path: string) {
  for (const c of toolCategories) {
    for (const t of c.tools) {
      if (t.path === path) return t;
    }
  }
  return null;
}

export function getToolCategoryByPath(path: string) {
  return toolCategories.find(category =>
    category.tools.some(tool => tool.path === path)
  );
}

export function getRelatedTools(path: string, limit = 4) {
  const category = getToolCategoryByPath(path);
  if (!category) return [];
  return category.tools.filter(tool => tool.path !== path).slice(0, limit);
}

export function buildToolMetadata(path: string): Metadata {
  const t = getToolByPath(path);
  const url = buildAbsoluteUrl(path);
  const title = t ? t.title : "工具";
  const description = t?.description ?? "实用在线工具。";
  const image = buildAbsoluteUrl(OG_IMAGE_PATH);

  return {
    title,
    description,
    keywords: t?.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "zh-CN",
      images: [
        {
          url: image,
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
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export function buildHomeJsonLd() {
  const siteUrl = getSiteUrl();
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Turinhub",
      url: siteUrl,
      logo: buildAbsoluteUrl("/icon.svg"),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: siteUrl,
      publisher: {
        "@type": "Organization",
        name: "Turinhub",
      },
    },
  ];
}

export function buildToolsPageMetadata(): Metadata {
  const title = "在线工具大全";
  const description =
    "Turinhub Toolbox 在线工具大全，汇集开发调试、文本处理、图像设计、网络检测、AI 辅助等免费工具。";
  const url = buildAbsoluteUrl("/tools");
  const image = buildAbsoluteUrl(OG_IMAGE_PATH);

  return {
    title,
    description,
    keywords: [
      "在线工具大全",
      "免费在线工具",
      "开发者工具",
      "文本处理工具",
      "格式化工具",
      "Turinhub Toolbox",
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "zh-CN",
      images: [
        {
          url: image,
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
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export function buildToolsPageJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "在线工具大全",
      description:
        "Turinhub Toolbox 免费在线工具目录，覆盖开发调试、文本处理、图像设计、网络检测和 AI 辅助。",
      url: buildAbsoluteUrl("/tools"),
      hasPart: toolCategories.flatMap(category =>
        category.tools.map(tool => ({
          "@type": "WebApplication",
          name: tool.title,
          description: tool.description,
          url: buildAbsoluteUrl(tool.path),
          applicationCategory: category.title,
          operatingSystem: "Web",
        }))
      ),
    },
  ];
}

export function buildToolJsonLd(path: string): object[] {
  const tool = getToolByPath(path);
  if (!tool) return [];

  const application = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.description,
    url: buildAbsoluteUrl(tool.path),
    applicationCategory: tool.categoryName,
    operatingSystem: "Web",
    isAccessibleForFree: true,
    keywords: tool.keywords.join(", "),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
    },
    author: {
      "@type": "Organization",
      name: "Turinhub",
      url: getSiteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: "Turinhub",
      url: getSiteUrl(),
    },
  };

  const faq =
    tool.faq && tool.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faq.map(item => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return faq ? [application, faq] : [application];
}
