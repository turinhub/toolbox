"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, X } from "lucide-react";
import { getRecentTools, clearRecentTools } from "@/lib/recent-tools";
import { getToolByPath } from "@/lib/seo";

export function RecentTools() {
  const [mounted, setMounted] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    setPaths(getRecentTools());
  }, []);

  if (!mounted) return null;

  const tools = paths
    .map(path => ({ path, tool: getToolByPath(path) }))
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
    <section className="w-full rounded-xl border bg-card/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="truncate">最近使用</span>
        </div>
        <button
          onClick={handleClear}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          清除记录
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {tools.map(({ path, tool }) => (
          <Link
            key={path}
            href={path}
            className="group flex min-h-[56px] min-w-[220px] flex-1 items-center gap-3 rounded-lg border bg-background px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm text-primary/90 group-hover:text-primary">
                {tool.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {tool.description}
              </div>
            </div>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
