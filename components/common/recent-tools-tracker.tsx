"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { addRecentTool } from "@/lib/recent-tools";

export function RecentToolsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (/^\/tools\/[^/]+$/.test(pathname)) {
      addRecentTool(pathname);
    }
  }, [pathname]);

  return null;
}
