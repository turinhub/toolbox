"use client";

import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  localeLabels,
  locales,
  getLocaleFromPathname,
  isLocalizedToolPath,
  localizePath,
  stripLocaleFromPathname,
} from "@/i18n/config";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("nav");
  const currentLocale = getLocaleFromPathname(pathname);
  const canonicalPath = stripLocaleFromPathname(pathname);
  const queryString = searchParams.toString();
  const withQuery = (path: string) =>
    queryString ? `${path}?${queryString}` : path;

  const getTargetPath = (locale: (typeof locales)[number]) => {
    if (
      locale === "en" &&
      canonicalPath.startsWith("/tools/") &&
      !isLocalizedToolPath(canonicalPath)
    ) {
      return withQuery(localizePath("/tools", locale));
    }

    return withQuery(localizePath(canonicalPath, locale));
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages />
        {t("language")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {locales.map(locale => (
          <DropdownMenuItem key={locale} asChild>
            <Link href={getTargetPath(locale)}>
              {localeLabels[locale]}
              {locale === currentLocale ? " ✓" : ""}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
