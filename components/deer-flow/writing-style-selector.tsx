// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useTranslations } from "next-intl";
import { GraduationCap, FileText, Newspaper, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setReportStyle, useSettingsStore } from "@/core/store";
import { cn } from "@/lib/utils";
import { Tooltip } from "./tooltip";

const WRITING_STYLES = [
  {
    value: "academic" as const,
    labelKey: "academic",
    icon: GraduationCap,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
  },
  {
    value: "popular_science" as const,
    labelKey: "popularScience",
    icon: FileText,
    color: "text-green-600",
    bgColor: "bg-green-50",
    hoverColor: "hover:bg-green-100",
  },
  {
    value: "news" as const,
    labelKey: "news",
    icon: Newspaper,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    hoverColor: "hover:bg-purple-100",
  },
  {
    value: "social_media" as const,
    labelKey: "socialMedia",
    icon: Users,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    hoverColor: "hover:bg-orange-100",
  },
];

interface WritingStyleSelectorProps {
  className?: string;
  size?: "small" | "medium";
}

export function WritingStyleSelector({ 
  className, 
  size = "medium" 
}: WritingStyleSelectorProps) {
  const t = useTranslations("settings.reportStyle");
  const currentStyle = useSettingsStore((state: any) => state.general.reportStyle);

  const handleStyleChange = (
    style: "academic" | "popular_science" | "news" | "social_media",
  ) => {
    setReportStyle(style);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="text-sm font-medium text-muted-foreground mb-1">
        {t("writingStyle")}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {WRITING_STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = currentStyle === style.value;

          return (
            <Tooltip
              key={style.value}
              title={t(style.labelKey)}
            >
              <Button
                className={cn(
                  "flex items-center gap-2 transition-all duration-200",
                  size === "small" ? "px-3 py-2 text-sm" : "px-4 py-2",
                  isSelected 
                    ? `${style.bgColor} ${style.color} border-2 ${style.color.replace('text-', 'border-')}` 
                    : "bg-background hover:bg-accent border"
                )}
                variant={isSelected ? "default" : "outline"}
                onClick={() => handleStyleChange(style.value)}
              >
                <Icon className={cn("h-4 w-4", size === "small" && "h-3 w-3")} />
                <span className={size === "small" ? "text-xs" : "text-sm"}>
                  {t(style.labelKey)}
                </span>
              </Button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}