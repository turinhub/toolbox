export const locales = ["zh-CN", "en"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "zh-CN";
export const englishLocale: AppLocale = "en";

export const localeLabels: Record<AppLocale, string> = {
  "zh-CN": "中文",
  en: "English",
};

export const localizedToolPaths = [
  "/tools/json-formatter",
  "/tools/json-visual-editor",
  "/tools/sql-formatter",
  "/tools/xml-formatter",
  "/tools/jwt",
  "/tools/base64",
  "/tools/url-codec",
  "/tools/api-tester",
  "/tools/regex",
  "/tools/uuid",
] as const;

export function isLocale(value: string | null | undefined): value is AppLocale {
  return value === "zh-CN" || value === "en";
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return isLocale(value) ? value : defaultLocale;
}

export function getLocaleFromPathname(pathname: string): AppLocale {
  return pathname === "/en" || pathname.startsWith("/en/")
    ? englishLocale
    : defaultLocale;
}

export function stripLocaleFromPathname(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname || "/";
}

export function localizePath(path: string, locale: AppLocale): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalPath = stripLocaleFromPathname(normalizedPath);

  if (locale === englishLocale) {
    return canonicalPath === "/" ? "/en" : `/en${canonicalPath}`;
  }

  return canonicalPath;
}

export function isLocalizedToolPath(path: string): boolean {
  return localizedToolPaths.includes(
    stripLocaleFromPathname(path) as (typeof localizedToolPaths)[number]
  );
}
