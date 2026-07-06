"use client";

import { Github, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { ThemeSwitcherDropdown } from "@/components/common/theme-switcher-dropdown";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { useTranslations } from "next-intl";

export function NavUser() {
  const t = useTranslations("nav");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Github className="h-5 w-5" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{t("settings")}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {t("settingsSubtitle")}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel>{t("settingsAndSupport")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette />
                  {t("displaySettings")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <ThemeSwitcherDropdown />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <LanguageSwitcher />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  window.open(
                    "https://github.com/turinhub/toolbox/issues",
                    "_blank"
                  );
                  toast.success(t("feedbackToast"));
                }}
              >
                <Github />
                <span>{t("feedback")}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
