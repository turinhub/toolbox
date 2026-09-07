"use client";

import { ChevronRight, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getHomeNavItem, getToolCategories } from "@/lib/routes";
import { advancedPinyinSearch } from "@/lib/pinyin";
import { getLocaleFromPathname, localizePath } from "@/i18n/config";
import { useTranslations } from "next-intl";

type NavItem = {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  items?: { title: string; url: string }[];
};

export function NavMain() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = useTranslations("nav");
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const nav: NavItem[] = useMemo(
    () => [
      {
        ...getHomeNavItem(locale),
        id: "home",
        url: localizePath("/", locale),
      },
      ...getToolCategories(locale).map(category => ({
        id: category.id,
        title: category.title,
        url: `${localizePath("/tools", locale)}?category=${category.id}`,
        icon: category.icon,
        items: category.tools.map(tool => ({
          title: tool.title,
          url: localizePath(tool.url, locale),
        })),
      })),
    ],
    [locale]
  );

  const isActiveItem = (item: NavItem) =>
    item.items
      ? item.items.some(subItem => subItem.url === pathname)
      : item.url === pathname;
  const query = isCollapsed ? "" : searchQuery.trim().toLowerCase();
  const filteredNav = useMemo(() => {
    if (!query) return nav;
    const matchesTitle = (title: string) =>
      locale === "zh-CN"
        ? advancedPinyinSearch(title, query)
        : title.toLowerCase().includes(query);
    return nav.flatMap(item => {
      if (matchesTitle(item.title)) return [item];
      const items = item.items?.filter(subItem => matchesTitle(subItem.title));
      return items?.length ? [{ ...item, items }] : [];
    });
  }, [locale, nav, query]);
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>{t("groupLabel")}</SidebarGroupLabel>}
      {!isCollapsed && (
        <div className="px-2 pb-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="sidebar-search"
              type="search"
              aria-label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="h-11 bg-background pl-8 md:h-8"
            />
          </div>
        </div>
      )}
      <SidebarGroupContent>
        {!isCollapsed && query && filteredNav.length === 0 && (
          <p
            role="status"
            className="px-2 py-4 text-center text-sm text-muted-foreground"
          >
            {t("noResults")}
          </p>
        )}
        <SidebarMenu>
          {filteredNav.map(item => {
            const active = isActiveItem(item);
            if (!item.items)
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className="min-h-11 md:min-h-8"
                  >
                    <Link
                      href={item.url}
                      onClick={closeMobile}
                      aria-label={item.title}
                      aria-current={active ? "page" : undefined}
                    >
                      <item.icon aria-hidden="true" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            if (isCollapsed)
              return (
                <SidebarMenuItem key={item.id}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        aria-label={item.title}
                      >
                        <item.icon aria-hidden="true" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="right"
                      align="start"
                      className="max-h-[min(70vh,var(--radix-dropdown-menu-content-available-height))] w-64 overflow-y-auto"
                    >
                      <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {item.items.map(subItem => (
                        <DropdownMenuItem key={subItem.url} asChild>
                          <Link
                            href={subItem.url}
                            aria-current={
                              pathname === subItem.url ? "page" : undefined
                            }
                            className="min-h-9"
                          >
                            {subItem.title}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              );
            return (
              <Collapsible
                key={item.id}
                asChild
                open={query ? true : (openItems[item.id] ?? active)}
                onOpenChange={open =>
                  setOpenItems(previous => ({ ...previous, [item.id]: open }))
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={active}
                      className="min-h-11 md:min-h-8"
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                      <ChevronRight
                        className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map(subItem => (
                        <SidebarMenuSubItem key={subItem.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                            className="min-h-11 md:min-h-8"
                          >
                            <Link
                              href={subItem.url}
                              onClick={closeMobile}
                              aria-current={
                                pathname === subItem.url ? "page" : undefined
                              }
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
