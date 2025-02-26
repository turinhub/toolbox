"use client"

import { Home, ChevronRight, Lock, FileText, Shield } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
} from "@/components/ui/sidebar"

const nav = [
  {
    title: "首页",
    url: "/",
    icon: Home,
  },
  {
    title: "综合工具",
    url: "#",
    icon: FileText,
    items: [
      { title: "时间戳转换", url: "/tools/timestamp" },
      { title: "正则表达式", url: "/tools/regex" },
      { title: "JSON 格式化", url: "/tools/json-formatter" },
      { title: "SQL 格式化", url: "/tools/sql-formatter" },
    ],
  },
  {
    title: "加密与编码",
    url: "#",
    icon: Lock,
    items: [
      { title: "UUID 生成器", url: "/tools/uuid" },
      { title: "JWT 编解码", url: "/tools/jwt" },
      { title: "URL 编解码", url: "/tools/url-codec" },
      { title: "Base64 编解码", url: "/tools/base64" },
    ],
  },
  {
    title: "安全与验证",
    url: "#",
    icon: Shield,
    items: [
      { title: "Turnstile 演示", url: "/turnstile-demo" },
      { title: "受保护内容", url: "/protected" },
    ],
  },
]

export function NavMain() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const isActiveItem = (item: { url: string, items?: { url: string }[] }) => {
    if (item.url === pathname) return true
    if (item.items?.some(subItem => subItem.url === pathname)) return true
    return false
  }

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>工具导航</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {nav.map((item) => (
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
                          {item.items?.map((subItem) => (
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
  )
}
