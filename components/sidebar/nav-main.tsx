"use client";

import { ChevronRight, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");

  const isActiveItem = (item: { url: string; items?: { url: string }[] }) => {
    if (item.url === pathname) return true;
    if (item.items?.some(subItem => subItem.url === pathname)) return true;
    return false;
  };

  // 筛选导航项
  const filteredNav = useMemo(() => {
    if (!searchQuery.trim()) {
      return nav;
    }

    const query = searchQuery.toLowerCase();
    return nav
      .map(item => {
        // 检查主项目标题是否匹配
        const mainTitleMatch = item.title.toLowerCase().includes(query);

        // 筛选子项目
        const filteredSubItems = item.items?.filter(subItem =>
          subItem.title.toLowerCase().includes(query)
        );

        // 如果主标题匹配，返回所有子项
        if (mainTitleMatch) {
          return item;
        }

        // 如果有匹配的子项，返回包含筛选后子项的项目
        if (filteredSubItems && filteredSubItems.length > 0) {
          return {
            ...item,
            items: filteredSubItems,
          };
        }

        // 都不匹配则返回null
        return null;
      })
      .filter(Boolean) as NavItem[];
  }, [searchQuery]);

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>工具导航</SidebarGroupLabel>}

      {/* 搜索框 */}
      {!isCollapsed && (
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索工具..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-background"
            />
          </div>
        </div>
      )}

      <SidebarGroupContent>
        {!isCollapsed && searchQuery && filteredNav.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            未找到匹配的工具
          </div>
        )}

        <SidebarMenu>
          {filteredNav.map(item => (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={
                isActiveItem(item) ||
                Boolean(searchQuery && item.items && item.items.length > 0)
              }
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
