"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { addRecentTool } from "@/lib/recent-tools";
import { stripLocaleFromPathname } from "@/i18n/config";

export function RecentToolsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const canonicalPath = stripLocaleFromPathname(pathname);
    if (/^\/tools\/[^/]+$/.test(canonicalPath)) {
      addRecentTool(canonicalPath);
    }
  }, [pathname]);

  return null;
}
