"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolDirectoryList } from "@/components/common/tool-directory-list";
import { getToolCategories } from "@/lib/routes";
import { advancedPinyinSearch } from "@/lib/pinyin";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/config";

const FILTER_CHANGE_EVENT = "toolbox:directory-filters";

function subscribeToFilters(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(FILTER_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(FILTER_CHANGE_EVENT, onChange);
  };
}

function writeFilters(href: string, replace = false) {
  if (`${window.location.pathname}${window.location.search}` === href) return;
  if (replace) window.history.replaceState(null, "", href);
  else window.history.pushState(null, "", href);
  // Next 的 history 同步走 transition；外部快照让受控输入及时响应每次按键。
  window.dispatchEvent(new Event(FILTER_CHANGE_EVENT));
}

export function ToolDirectoryFallback({ locale }: { locale: AppLocale }) {
  return (
    <ToolDirectoryList categories={getToolCategories(locale)} locale={locale} />
  );
}

export function ToolDirectory({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const serverSearchParams = useSearchParams();
  const search = useSyncExternalStore(
    subscribeToFilters,
    () => window.location.search.slice(1),
    () => serverSearchParams.toString()
  );
  const searchParams = new URLSearchParams(search);
  const t = useTranslations("directory");
  const categories = useMemo(() => getToolCategories(locale), [locale]);
  const query = searchParams.get("q") ?? "";
  const requestedCategory = searchParams.get("category") ?? "";
  const selectedCategory = categories.some(
    category => category.id === requestedCategory
  )
    ? requestedCategory
    : "";
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    const matches = (text: string) =>
      text.toLowerCase().includes(normalizedQuery) ||
      (locale === "zh-CN" && advancedPinyinSearch(text, normalizedQuery));
    return categories
      .filter(category => !selectedCategory || category.id === selectedCategory)
      .map(category => ({
        ...category,
        tools: category.tools.filter(
          tool =>
            !normalizedQuery ||
            matches(category.title) ||
            matches(tool.name) ||
            tool.description.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter(category => category.tools.length > 0);
  }, [categories, selectedCategory, normalizedQuery, locale]);
  const resultCount = filteredCategories.reduce(
    (count, category) => count + category.tools.length,
    0
  );

  const filterHref = (changes: { q?: string; category?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="directory-search">{t("searchLabel")}</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="directory-search"
              name="q"
              type="search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              placeholder={t("searchPlaceholder")}
              onChange={event => {
                writeFilters(filterHref({ q: event.target.value }), true);
              }}
              className="h-11 pl-9"
            />
          </div>
        </div>
        <nav aria-label={t("categoryLabel")} className="flex flex-wrap gap-2">
          {[{ id: "", title: t("allCategories") }, ...categories].map(
            category => (
              <Link
                key={category.id}
                href={filterHref({ category: category.id })}
                aria-current={
                  selectedCategory === category.id ? "page" : undefined
                }
                onClick={event => {
                  if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  writeFilters(filterHref({ category: category.id }));
                }}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedCategory === category.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {category.title}
              </Link>
            )
          )}
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            role="status"
            className="text-sm tabular-nums text-muted-foreground"
          >
            {t("resultCount", { count: resultCount })}
          </p>
          {(query || requestedCategory) && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={() => {
                writeFilters(filterHref({ q: "", category: "" }));
              }}
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>
      </div>
      {resultCount > 0 ? (
        <ToolDirectoryList categories={filteredCategories} locale={locale} />
      ) : (
        <div className="border-t py-8 text-center">
          <p className="font-medium">{t("noResults")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noResultsHelp")}
          </p>
        </div>
      )}
    </div>
  );
}
