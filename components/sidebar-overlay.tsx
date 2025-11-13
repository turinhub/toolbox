"use client";

import React from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarOverlay() {
  const { openMobile, setOpenMobile } = useSidebar();

  React.useEffect(() => {
    if (openMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [openMobile]);

  if (!openMobile) return null;

  return (
    <div
      className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden cursor-pointer touch-none"
      onClick={() => setOpenMobile(false)}
      aria-hidden="true"
    />
  );
}
