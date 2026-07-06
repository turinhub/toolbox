"use client";

import {
  MarkdownConfig,
  ThemeType,
  FontType,
  FontSizeLevel,
  FigcaptionType,
} from "../types";
import { PRESET_COLORS } from "../utils/themeGenerator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";

interface StyleEditorProps {
  config: MarkdownConfig;
  onConfigChange: (newConfig: MarkdownConfig) => void;
  onReset: () => void;
  locale: "zh-CN" | "en";
}

export function StyleEditor({
  config,
  onConfigChange,
  onReset,
  locale,
}: StyleEditorProps) {
  const isEnglish = locale === "en";
  const copy = isEnglish
    ? {
        on: "On",
        off: "Off",
        theme: "Theme",
        classic: "Classic",
        elegant: "Elegant",
        simple: "Simple",
        font: "Font",
        sans: "Sans",
        serif: "Serif",
        mono: "Mono",
        fontSize: "Font size",
        xs: "Smaller",
        sm: "Small",
        md: "Recommended",
        lg: "Large",
        xl: "Larger",
        primaryColor: "Primary color",
        customColor: "Custom primary color",
        codeTheme: "Code block theme",
        figcaption: "Image caption",
        titleFirst: "title first",
        altFirst: "alt first",
        hidden: "Hidden",
        macCode: "Mac code block",
        lineNumbers: "Code line numbers",
        wechatLink: "Convert WeChat external links to references",
        indent: "First-line paragraph indent",
        justify: "Justify paragraphs",
        reset: "Reset config",
        colors: {
          经典蓝: "Classic blue",
          翡翠绿: "Emerald green",
          活力橘: "Vivid orange",
          柠檬黄: "Lemon yellow",
          薰衣紫: "Lavender purple",
          天空蓝: "Sky blue",
          玫瑰金: "Rose gold",
          橄榄绿: "Olive green",
          石墨黑: "Graphite black",
          雾霾灰: "Mist gray",
          樱花粉: "Sakura pink",
        } as Record<string, string>,
      }
    : {
        on: "开启",
        off: "关闭",
        theme: "主题",
        classic: "经典",
        elegant: "优雅",
        simple: "简洁",
        font: "字体",
        sans: "无衬线",
        serif: "衬线",
        mono: "等宽",
        fontSize: "字号",
        xs: "更小",
        sm: "稍小",
        md: "推荐",
        lg: "稍大",
        xl: "更大",
        primaryColor: "主题色",
        customColor: "自定义主题色",
        codeTheme: "代码块主题",
        figcaption: "图注格式",
        titleFirst: "title 优先",
        altFirst: "alt 优先",
        hidden: "不显示",
        macCode: "Mac 代码块",
        lineNumbers: "代码块行号",
        wechatLink: "微信外链转底部引用",
        indent: "段落首行缩进",
        justify: "段落两端对齐",
        reset: "重置配置",
        colors: {} as Record<string, string>,
      };
  const handleConfigChange = <K extends keyof MarkdownConfig>(
    key: K,
    value: MarkdownConfig[K]
  ) => {
    onConfigChange({ ...config, [key]: value });
  };

  const OptionGroup = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );

  const ToggleButton = <T extends string | boolean>({
    value,
    currentValue,
    label,
    onChange,
  }: {
    value: T;
    currentValue: T;
    label: string;
    onChange: (val: T) => void;
  }) => (
    <Button
      variant={currentValue === value ? "default" : "outline"}
      size="sm"
      onClick={() => onChange(value)}
      className="h-8 px-3 text-xs"
    >
      {label}
    </Button>
  );

  const BooleanToggle = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex border rounded-md overflow-hidden">
      <button
        className={cn(
          "px-3 py-1.5 text-xs transition-colors",
          value
            ? "bg-primary text-primary-foreground font-medium"
            : "bg-muted/50 hover:bg-muted"
        )}
        onClick={() => onChange(true)}
      >
        {copy.on}
      </button>
      <div className="w-px bg-border" />
      <button
        className={cn(
          "px-3 py-1.5 text-xs transition-colors",
          !value
            ? "bg-primary text-primary-foreground font-medium"
            : "bg-muted/50 hover:bg-muted"
        )}
        onClick={() => onChange(false)}
      >
        {copy.off}
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col pb-8 gap-8">
          {/* 主题 */}
          <OptionGroup label={copy.theme}>
            <ToggleButton<ThemeType>
              value="classic"
              currentValue={config.themeType}
              label={copy.classic}
              onChange={v => handleConfigChange("themeType", v)}
            />
            <ToggleButton<ThemeType>
              value="elegant"
              currentValue={config.themeType}
              label={copy.elegant}
              onChange={v => handleConfigChange("themeType", v)}
            />
            <ToggleButton<ThemeType>
              value="simple"
              currentValue={config.themeType}
              label={copy.simple}
              onChange={v => handleConfigChange("themeType", v)}
            />
          </OptionGroup>

          {/* 字体 */}
          <OptionGroup label={copy.font}>
            <ToggleButton<FontType>
              value="sans"
              currentValue={config.fontType}
              label={copy.sans}
              onChange={v => handleConfigChange("fontType", v)}
            />
            <ToggleButton<FontType>
              value="serif"
              currentValue={config.fontType}
              label={copy.serif}
              onChange={v => handleConfigChange("fontType", v)}
            />
            <ToggleButton<FontType>
              value="mono"
              currentValue={config.fontType}
              label={copy.mono}
              onChange={v => handleConfigChange("fontType", v)}
            />
          </OptionGroup>

          {/* 字号 */}
          <OptionGroup label={copy.fontSize}>
            <ToggleButton<FontSizeLevel>
              value="xs"
              currentValue={config.fontSizeLevel}
              label={copy.xs}
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
            <ToggleButton<FontSizeLevel>
              value="sm"
              currentValue={config.fontSizeLevel}
              label={copy.sm}
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
            <ToggleButton<FontSizeLevel>
              value="md"
              currentValue={config.fontSizeLevel}
              label={copy.md}
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
            <ToggleButton<FontSizeLevel>
              value="lg"
              currentValue={config.fontSizeLevel}
              label={copy.lg}
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
            <ToggleButton<FontSizeLevel>
              value="xl"
              currentValue={config.fontSizeLevel}
              label={copy.xl}
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
          </OptionGroup>

          {/* 主题色 */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">{copy.primaryColor}</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => {
                    onConfigChange({
                      ...config,
                      primaryColor: color.value,
                      customPrimaryColor: "",
                    });
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded border text-xs hover:bg-muted transition-colors",
                    config.primaryColor === color.value &&
                      !config.customPrimaryColor
                      ? "ring-1 ring-primary border-primary bg-primary/5"
                      : ""
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="truncate">
                    {copy.colors[color.label] ?? color.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 自定义主题色 */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">{copy.customColor}</Label>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Input
                  type="color"
                  value={config.customPrimaryColor || config.primaryColor}
                  onChange={e =>
                    handleConfigChange("customPrimaryColor", e.target.value)
                  }
                  className="w-10 h-10 p-1 cursor-pointer"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {config.customPrimaryColor || config.primaryColor}
              </span>
            </div>
          </div>

          {/* 代码块主题 */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">{copy.codeTheme}</Label>
            <Select
              value={config.codeTheme}
              onValueChange={v => handleConfigChange("codeTheme", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="github-dark">github-dark</SelectItem>
                  <SelectItem value="github-light">github-light</SelectItem>
                  <SelectItem value="monokai">monokai</SelectItem>
                  <SelectItem value="solarized-dark">solarized-dark</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* 图注格式 */}
          <OptionGroup label={copy.figcaption}>
            <ToggleButton<FigcaptionType>
              value="title"
              currentValue={config.figcaptionType}
              label={copy.titleFirst}
              onChange={v => handleConfigChange("figcaptionType", v)}
            />
            <ToggleButton<FigcaptionType>
              value="alt"
              currentValue={config.figcaptionType}
              label={copy.altFirst}
              onChange={v => handleConfigChange("figcaptionType", v)}
            />
            <ToggleButton<FigcaptionType>
              value="none"
              currentValue={config.figcaptionType}
              label={copy.hidden}
              onChange={v => handleConfigChange("figcaptionType", v)}
            />
          </OptionGroup>

          {/* 开关选项组 */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{copy.macCode}</Label>
              <BooleanToggle
                value={config.macCodeBlock}
                onChange={v => handleConfigChange("macCodeBlock", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{copy.lineNumbers}</Label>
              <BooleanToggle
                value={config.codeLineNumber}
                onChange={v => handleConfigChange("codeLineNumber", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{copy.wechatLink}</Label>
              <BooleanToggle
                value={config.wechatLink}
                onChange={v => handleConfigChange("wechatLink", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{copy.indent}</Label>
              <BooleanToggle
                value={config.indent}
                onChange={v => handleConfigChange("indent", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{copy.justify}</Label>
              <BooleanToggle
                value={config.justify}
                onChange={v => handleConfigChange("justify", v)}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button variant="destructive" className="w-full" onClick={onReset}>
              <RotateCcw data-icon="inline-start" />
              {copy.reset}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
