"use client";

import React from "react";
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { NavHeader } from "./nav-header";

export function Sidebar() {
  const { openMobile, setOpenMobile, isMobile } = useSidebar();

  React.useEffect(() => {
    if (!isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return (
    <UISidebar
      collapsible="icon"
      variant="sidebar"
      className={`
        ${isMobile ? "fixed inset-y-0 left-0 z-40" : ""}
        ${openMobile ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 transition-transform duration-300
      `}
    >
      <SidebarHeader>
        <NavHeader />
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="h-full">
          <NavMain />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </UISidebar>
  );
}
