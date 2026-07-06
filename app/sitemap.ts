import { MetadataRoute } from "next";
import { getToolCategories } from "@/lib/routes";
import { buildAbsoluteUrl, getSiteUrl } from "@/lib/seo";
import {
  defaultLocale,
  englishLocale,
  isLocalizedToolPath,
} from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const zhTools = getToolCategories(defaultLocale).flatMap(category =>
    category.tools.map(tool => {
      const languages: Record<string, string> = {
        "zh-CN": buildAbsoluteUrl(tool.path, defaultLocale),
      };

      if (isLocalizedToolPath(tool.path)) {
        languages.en = buildAbsoluteUrl(tool.path, englishLocale);
      }

      return {
        url: buildAbsoluteUrl(tool.path, defaultLocale),
        lastModified: new Date(tool.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: {
          languages,
        },
      };
    })
  );
  const enTools = getToolCategories(englishLocale).flatMap(category =>
    category.tools.map(tool => ({
      url: buildAbsoluteUrl(tool.path, englishLocale),
      lastModified: new Date(tool.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          "zh-CN": buildAbsoluteUrl(tool.path, defaultLocale),
          en: buildAbsoluteUrl(tool.path, englishLocale),
        },
      },
    }))
  );

  const homePage = {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1,
    alternates: {
      languages: {
        "zh-CN": buildAbsoluteUrl("/", defaultLocale),
        en: buildAbsoluteUrl("/", englishLocale),
      },
    },
  };

  const toolsListPage = {
    url: buildAbsoluteUrl("/tools", defaultLocale),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
    alternates: {
      languages: {
        "zh-CN": buildAbsoluteUrl("/tools", defaultLocale),
        en: buildAbsoluteUrl("/tools", englishLocale),
      },
    },
  };

  const enHomePage = {
    ...homePage,
    url: buildAbsoluteUrl("/", englishLocale),
  };

  const enToolsListPage = {
    ...toolsListPage,
    url: buildAbsoluteUrl("/tools", englishLocale),
  };

  return [
    homePage,
    enHomePage,
    toolsListPage,
    enToolsListPage,
    ...zhTools,
    ...enTools,
  ];
}
