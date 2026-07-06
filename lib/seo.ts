import type { Metadata } from "next";
import {
  defaultLocale,
  englishLocale,
  isLocalizedToolPath,
  localizePath,
  stripLocaleFromPathname,
  type AppLocale,
} from "@/i18n/config";
import { getToolCategories } from "@/lib/routes";

const SITE_NAME = "Turinhub Toolbox";
const DEFAULT_SITE_URL = "https://turinhub.com";
const OG_IMAGE_PATH = "/og-image.png";
const manifestPaths: Record<AppLocale, string> = {
  "zh-CN": "/manifest.zh-CN.webmanifest",
  en: "/manifest.en.webmanifest",
};

const siteCopy: Record<
  AppLocale,
  {
    title: string;
    description: string;
    keywords: string[];
    toolsTitle: string;
    toolsDescription: string;
    toolsKeywords: string[];
    locale: string;
  }
> = {
  "zh-CN": {
    title: "Turinhub Toolbox - 免费在线工具箱",
    description:
      "常用网页工具的汇集网站，提供免费、无广告、尽量本地处理的在线工具体验。",
    keywords: [
      "在线工具",
      "免费工具",
      "开发工具",
      "文本处理",
      "格式化工具",
      "编码加密",
      "计算器",
      "API测试",
      "图像处理",
      "AI工具",
      "JSON格式化",
      "时间戳转换",
      "UUID生成",
      "Base64编码",
      "正则表达式测试",
    ],
    toolsTitle: "在线工具大全",
    toolsDescription:
      "Turinhub Toolbox 在线工具大全，汇集开发调试、文本处理、图像设计、网络检测、AI 辅助等免费工具。",
    toolsKeywords: [
      "在线工具大全",
      "免费在线工具",
      "开发者工具",
      "文本处理工具",
      "格式化工具",
      "Turinhub Toolbox",
    ],
    locale: "zh-CN",
  },
  en: {
    title: "Turinhub Toolbox - Free Online Tools",
    description:
      "A collection of free, ad-free, mostly local-first online tools for everyday browser workflows.",
    keywords: [
      "online tools",
      "free tools",
      "developer tools",
      "text tools",
      "formatting tools",
      "encoding tools",
      "calculator",
      "API testing",
      "image tools",
      "AI tools",
      "JSON formatter",
      "Base64 encoder",
    ],
    toolsTitle: "Online Tools",
    toolsDescription:
      "Turinhub Toolbox collects free online tools for development, text processing, design, networking, AI assistance, and everyday calculations.",
    toolsKeywords: [
      "online tools",
      "free online tools",
      "developer tools",
      "text processing tools",
      "formatting tools",
      "Turinhub Toolbox",
    ],
    locale: "en",
  },
};

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(
    /\/$/,
    ""
  );
}

export function buildAbsoluteUrl(
  path: string,
  locale: AppLocale = defaultLocale
) {
  return new URL(localizePath(path, locale), getSiteUrl()).toString();
}

function buildLanguageAlternates(path: string) {
  const languages: Record<string, string> = {
    "zh-CN": buildAbsoluteUrl(path, defaultLocale),
  };

  if (path === "/" || path === "/tools" || isLocalizedToolPath(path)) {
    languages.en = buildAbsoluteUrl(path, englishLocale);
  }

  return languages;
}

function getManifestPath(locale: AppLocale) {
  return manifestPaths[locale];
}

export function getToolByPath(path: string, locale: AppLocale = defaultLocale) {
  const canonicalPath = stripLocaleFromPathname(path);

  for (const category of getToolCategories(locale)) {
    for (const tool of category.tools) {
      if (tool.path === canonicalPath) return tool;
    }
  }

  return null;
}

export function getToolCategoryByPath(
  path: string,
  locale: AppLocale = defaultLocale
) {
  const canonicalPath = stripLocaleFromPathname(path);

  return getToolCategories(locale).find(category =>
    category.tools.some(tool => tool.path === canonicalPath)
  );
}

export function getRelatedTools(
  path: string,
  locale: AppLocale = defaultLocale,
  limit = 4
) {
  const canonicalPath = stripLocaleFromPathname(path);
  const category = getToolCategoryByPath(canonicalPath, locale);
  if (!category) return [];
  return category.tools
    .filter(tool => tool.path !== canonicalPath)
    .slice(0, limit);
}

export function buildHomeMetadata(locale: AppLocale = defaultLocale): Metadata {
  const copy = siteCopy[locale];
  const path = "/";
  const url = buildAbsoluteUrl(path, locale);
  const image = buildAbsoluteUrl(OG_IMAGE_PATH);

  return {
    title: {
      default: copy.title,
      template: `%s - ${SITE_NAME}`,
    },
    description: copy.description,
    keywords: copy.keywords,
    authors: [{ name: "Turinhub" }],
    creator: "Turinhub",
    publisher: "Turinhub",
    metadataBase: new URL(getSiteUrl()),
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(path),
    },
    manifest: getManifestPath(locale),
    icons: {
      icon: "/icon.svg",
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
      locale: copy.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function buildToolMetadata(
  path: string,
  locale: AppLocale = defaultLocale
): Metadata {
  const canonicalPath = stripLocaleFromPathname(path);
  const tool = getToolByPath(canonicalPath, locale);
  const url = buildAbsoluteUrl(canonicalPath, locale);
  const title = tool ? tool.title : locale === englishLocale ? "Tool" : "工具";
  const description =
    tool?.description ??
    (locale === englishLocale ? "Useful online tool." : "实用在线工具。");
  const image = buildAbsoluteUrl(OG_IMAGE_PATH);

  return {
    title,
    description,
    keywords: tool?.keywords,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(canonicalPath),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: siteCopy[locale].locale,
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

export function buildHomeJsonLd(locale: AppLocale = defaultLocale) {
  const siteUrl = getSiteUrl();
  const copy = siteCopy[locale];

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
      description: copy.description,
      url: buildAbsoluteUrl("/", locale),
      publisher: {
        "@type": "Organization",
        name: "Turinhub",
      },
      inLanguage: siteCopy[locale].locale,
    },
  ];
}

export function buildToolsPageMetadata(
  locale: AppLocale = defaultLocale
): Metadata {
  const copy = siteCopy[locale];
  const path = "/tools";
  const url = buildAbsoluteUrl(path, locale);
  const image = buildAbsoluteUrl(OG_IMAGE_PATH);

  return {
    title: copy.toolsTitle,
    description: copy.toolsDescription,
    keywords: copy.toolsKeywords,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      title: copy.toolsTitle,
      description: copy.toolsDescription,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: copy.locale,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: copy.toolsTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.toolsTitle,
      description: copy.toolsDescription,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export function buildToolsPageJsonLd(locale: AppLocale = defaultLocale) {
  const categories = getToolCategories(locale);

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: siteCopy[locale].toolsTitle,
      description: siteCopy[locale].toolsDescription,
      url: buildAbsoluteUrl("/tools", locale),
      inLanguage: siteCopy[locale].locale,
      hasPart: categories.flatMap(category =>
        category.tools.map(tool => ({
          "@type": "WebApplication",
          name: tool.title,
          description: tool.description,
          url: buildAbsoluteUrl(tool.path, locale),
          applicationCategory: category.title,
          operatingSystem: "Web",
        }))
      ),
    },
  ];
}

export function buildToolJsonLd(
  path: string,
  locale: AppLocale = defaultLocale
): object[] {
  const canonicalPath = stripLocaleFromPathname(path);
  const tool = getToolByPath(canonicalPath, locale);
  if (!tool) return [];

  const application = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.description,
    url: buildAbsoluteUrl(tool.path, locale),
    applicationCategory: tool.categoryName,
    operatingSystem: "Web",
    isAccessibleForFree: true,
    keywords: tool.keywords.join(", "),
    inLanguage: siteCopy[locale].locale,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: locale === englishLocale ? "USD" : "CNY",
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
          inLanguage: siteCopy[locale].locale,
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
