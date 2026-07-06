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
import { getHomeNavItem, getToolCategories } from "@/lib/routes";
import { LucideIcon } from "lucide-react";
import { advancedPinyinSearch } from "@/lib/pinyin";
import { getLocaleFromPathname, localizePath } from "@/i18n/config";
import { useTranslations } from "next-intl";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: { title: string; url: string }[];
};

export function NavMain() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = useTranslations("nav");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const nav: NavItem[] = useMemo(
    () => [
      {
        ...getHomeNavItem(locale),
        url: localizePath("/", locale),
        items: undefined,
      },
      ...getToolCategories(locale).map(category => ({
        title: category.title,
        url: localizePath("/tools", locale),
        icon: category.icon,
        items: category.tools.map(tool => ({
          title: tool.title,
          url: localizePath(tool.url, locale),
        })),
      })),
    ],
    [locale]
  );

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
    const matchesTitle = (title: string) =>
      locale === "zh-CN"
        ? advancedPinyinSearch(title, query)
        : title.toLowerCase().includes(query);

    return nav
      .map(item => {
        const mainTitleMatch = matchesTitle(item.title);

        const filteredSubItems = item.items?.filter(subItem =>
          matchesTitle(subItem.title)
        );

        if (mainTitleMatch) {
          return {
            ...item,
            items: item.items?.map(subItem => ({
              ...subItem,
              isMatch: matchesTitle(subItem.title),
            })),
          };
        }

        if (filteredSubItems && filteredSubItems.length > 0) {
          return {
            ...item,
            items: filteredSubItems,
          };
        }

        return null;
      })
      .filter(Boolean) as NavItem[];
  }, [locale, nav, searchQuery]);

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>{t("groupLabel")}</SidebarGroupLabel>}

      {!isCollapsed && (
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
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
            {t("noResults")}
          </div>
        )}

        <SidebarMenu>
          {filteredNav.map(item => (
            <Collapsible
              key={item.title}
              asChild
              open={
                searchQuery.trim()
                  ? Boolean(item.items && item.items.length > 0)
                  : (openItems[item.title] ?? isActiveItem(item))
              }
              onOpenChange={open =>
                setOpenItems(prev => ({ ...prev, [item.title]: open }))
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
