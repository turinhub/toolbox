"use client";

import React from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarOverlay() {
  const { openMobile, setOpenMobile } = useSidebar();

  if (!openMobile) return null;

  return (
    <div
      className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
      onClick={() => setOpenMobile(false)}
      aria-hidden="true"
    />
  );
}
