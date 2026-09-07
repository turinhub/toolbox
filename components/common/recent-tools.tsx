"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";
import { getRecentTools, clearRecentTools } from "@/lib/recent-tools";
import { getToolByPath } from "@/lib/seo";
import {
  getLocaleFromPathname,
  localizePath,
  stripLocaleFromPathname,
} from "@/i18n/config";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function RecentTools() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = useTranslations("recent");
  const [mounted, setMounted] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    setPaths(getRecentTools());
  }, []);

  if (!mounted) return null;

  const tools = paths
    .map(path => ({
      path: stripLocaleFromPathname(path),
      tool: getToolByPath(path, locale),
    }))
    .filter(
      (
        item
      ): item is {
        path: string;
        tool: NonNullable<ReturnType<typeof getToolByPath>>;
      } => item.tool !== null
    );

  if (tools.length === 0) return null;

  const handleClear = () => {
    clearRecentTools();
    setPaths([]);
  };

  return (
    <section aria-labelledby="recent-tools-title" className="mb-6 w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 id="recent-tools-title" className="truncate">
            {t("title")}
          </h2>
        </div>
        <button
          onClick={handleClear}
          className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          {t("clear")}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tools.map(({ path, tool }) => (
          <Link
            key={path}
            href={localizePath(path, locale)}
            className="inline-flex min-h-11 max-w-full items-center rounded-md border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="break-words">{tool.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
