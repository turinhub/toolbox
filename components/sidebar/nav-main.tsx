"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { homeNavItem, toolCategories } from "@/lib/routes";
import { LucideIcon } from "lucide-react";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: { title: string; url: string }[];
};

// 将共享配置转换为侧边栏导航格式
const nav: NavItem[] = [
  {
    ...homeNavItem,
    items: undefined,
  },
  ...toolCategories.map(category => ({
    title: category.title,
    url: category.url,
    icon: category.icon,
    items: category.tools.map(tool => ({
      title: tool.title,
      url: tool.url,
    })),
  })),
];

export function NavMain() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActiveItem = (item: { url: string; items?: { url: string }[] }) => {
    if (item.url === pathname) return true;
    if (item.items?.some(subItem => subItem.url === pathname)) return true;
    return false;
  };

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>工具导航</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {nav.map(item => (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActiveItem(item)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {item.items ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-active={isActiveItem(item)}>
                        {item.icon && <item.icon />}
                        {!isCollapsed && (
                          <>
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!isCollapsed && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map(subItem => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                data-active={pathname === subItem.url}
                              >
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    data-active={pathname === item.url}
                  >
                    <a href={item.url}>
                      {item.icon && <item.icon />}
                      {!isCollapsed && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
