"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileNav() {
  const { setOpenMobile } = useSidebar();

  return (
    <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/icon.svg" alt="Logo" width={24} height={24} />
        <span className="font-semibold text-sm sm:text-base">
          Turinhub Toolbox
        </span>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpenMobile(true)}
        aria-label="打开菜单"
        className="min-h-[44px] min-w-[44px]"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
}
