"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";
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
    <section className="max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>最近使用</span>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          清除记录
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {tools.map(({ path, tool }) => (
          <Link
            key={path}
            href={path}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 hover:border-primary/50 bg-card hover:bg-muted/30 transition-all duration-200"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-primary/90 group-hover:text-primary">
                {tool.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {tool.description}
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-primary opacity-60 group-hover:opacity-100"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
