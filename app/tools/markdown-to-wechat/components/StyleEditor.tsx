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
}

export function StyleEditor({
  config,
  onConfigChange,
  onReset,
}: StyleEditorProps) {
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
    <div className="space-y-3">
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
        开启
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
        关闭
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-8 pb-8">
          {/* 主题 */}
          <OptionGroup label="主题">
            <ToggleButton<ThemeType>
              value="classic"
              currentValue={config.themeType}
              label="经典"
              onChange={v => handleConfigChange("themeType", v)}
            />
            <ToggleButton<ThemeType>
              value="elegant"
              currentValue={config.themeType}
              label="优雅"
              onChange={v => handleConfigChange("themeType", v)}
            />
            <ToggleButton<ThemeType>
              value="simple"
              currentValue={config.themeType}
              label="简洁"
              onChange={v => handleConfigChange("themeType", v)}
            />
          </OptionGroup>

          {/* 字体 */}
          <OptionGroup label="字体">
            <ToggleButton<FontType>
              value="sans"
              currentValue={config.fontType}
              label="无衬线"
              onChange={v => handleConfigChange("fontType", v)}
            />
            <ToggleButton<FontType>
              value="serif"
              currentValue={config.fontType}
              label="衬线"
              onChange={v => handleConfigChange("fontType", v)}
            />
            <ToggleButton<FontType>
              value="mono"
              currentValue={config.fontType}
              label="等宽"
              onChange={v => handleConfigChange("fontType", v)}
            />
          </OptionGroup>

          {/* 字号 */}
          <OptionGroup label="字号">
            <ToggleButton<FontSizeLevel>
              value="xs"
              currentValue={config.fontSizeLevel}
              label="更小"
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
            <ToggleButton<FontSizeLevel>
              value="sm"
              currentValue={config.fontSizeLevel}
              label="稍小"
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
            <ToggleButton<FontSizeLevel>
              value="md"
              currentValue={config.fontSizeLevel}
              label="推荐"
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
            <ToggleButton<FontSizeLevel>
              value="lg"
              currentValue={config.fontSizeLevel}
              label="稍大"
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
            <ToggleButton<FontSizeLevel>
              value="xl"
              currentValue={config.fontSizeLevel}
              label="更大"
              onChange={v => handleConfigChange("fontSizeLevel", v)}
            />
          </OptionGroup>

          {/* 主题色 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">主题色</Label>
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
                  <span className="truncate">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 自定义主题色 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">自定义主题色</Label>
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
          <div className="space-y-3">
            <Label className="text-sm font-medium">代码块主题</Label>
            <Select
              value={config.codeTheme}
              onValueChange={v => handleConfigChange("codeTheme", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github-dark">github-dark</SelectItem>
                <SelectItem value="github-light">github-light</SelectItem>
                <SelectItem value="monokai">monokai</SelectItem>
                <SelectItem value="solarized-dark">solarized-dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 图注格式 */}
          <OptionGroup label="图注格式">
            <ToggleButton<FigcaptionType>
              value="title"
              currentValue={config.figcaptionType}
              label="title 优先"
              onChange={v => handleConfigChange("figcaptionType", v)}
            />
            <ToggleButton<FigcaptionType>
              value="alt"
              currentValue={config.figcaptionType}
              label="alt 优先"
              onChange={v => handleConfigChange("figcaptionType", v)}
            />
            <ToggleButton<FigcaptionType>
              value="none"
              currentValue={config.figcaptionType}
              label="不显示"
              onChange={v => handleConfigChange("figcaptionType", v)}
            />
          </OptionGroup>

          {/* 开关选项组 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Mac 代码块</Label>
              <BooleanToggle
                value={config.macCodeBlock}
                onChange={v => handleConfigChange("macCodeBlock", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">代码块行号</Label>
              <BooleanToggle
                value={config.codeLineNumber}
                onChange={v => handleConfigChange("codeLineNumber", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">微信外链转底部引用</Label>
              <BooleanToggle
                value={config.wechatLink}
                onChange={v => handleConfigChange("wechatLink", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">段落首行缩进</Label>
              <BooleanToggle
                value={config.indent}
                onChange={v => handleConfigChange("indent", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">段落两端对齐</Label>
              <BooleanToggle
                value={config.justify}
                onChange={v => handleConfigChange("justify", v)}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button variant="destructive" className="w-full" onClick={onReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              重置配置
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
