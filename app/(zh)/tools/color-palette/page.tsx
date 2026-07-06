"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Eye, Download } from "lucide-react";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

// 常见配色表数据
const colorPalettes = {
  tableau: {
    name: "Tableau 10",
    description: {
      "zh-CN": "Tableau 默认配色方案，适用于数据可视化",
      en: "Tableau default palette for data visualization",
    },
    colors: [
      "#4e79a7",
      "#f28e2c",
      "#e15759",
      "#76b7b2",
      "#59a14f",
      "#edc949",
      "#af7aa1",
      "#ff9da7",
      "#9c755f",
      "#bab0ab",
    ],
  },
  tableau20: {
    name: "Tableau 20",
    description: {
      "zh-CN": "Tableau 扩展配色方案，提供更多颜色选择",
      en: "Extended Tableau palette with more color choices",
    },
    colors: [
      "#4e79a7",
      "#a0cbe8",
      "#f28e2c",
      "#ffbe7d",
      "#59a14f",
      "#8cd17d",
      "#b6992d",
      "#f1ce63",
      "#499894",
      "#86bcb6",
      "#e15759",
      "#ff9d9a",
      "#79706e",
      "#bab0ab",
      "#d37295",
      "#fabfd2",
      "#b07aa1",
      "#d4a6c8",
      "#9d7660",
      "#d7b5a6",
    ],
  },
  material: {
    name: "Material Design",
    description: {
      "zh-CN": "Google Material Design 配色方案",
      en: "Google Material Design color palette",
    },
    colors: [
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#03a9f4",
      "#00bcd4",
      "#009688",
      "#4caf50",
      "#8bc34a",
      "#cddc39",
      "#ffeb3b",
      "#ffc107",
      "#ff9800",
      "#ff5722",
      "#795548",
      "#9e9e9e",
      "#607d8b",
    ],
  },
  viridis: {
    name: "Viridis",
    description: {
      "zh-CN": "科学可视化常用的感知均匀配色方案",
      en: "Perceptually uniform palette often used for scientific visualization",
    },
    colors: [
      "#440154",
      "#482777",
      "#3f4a8a",
      "#31678e",
      "#26838f",
      "#1f9d8a",
      "#6cce5a",
      "#b6de2b",
      "#fee825",
    ],
  },
  plasma: {
    name: "Plasma",
    description: {
      "zh-CN": "高对比度的感知均匀配色方案",
      en: "High-contrast perceptually uniform palette",
    },
    colors: [
      "#0d0887",
      "#5302a3",
      "#8b0aa5",
      "#b83289",
      "#db5c68",
      "#f48849",
      "#febd2a",
      "#f0f921",
    ],
  },
  cividis: {
    name: "Cividis",
    description: {
      "zh-CN": "对色盲友好的感知均匀配色方案",
      en: "Color-vision-deficiency friendly perceptually uniform palette",
    },
    colors: [
      "#00224e",
      "#123570",
      "#3b496c",
      "#575d6d",
      "#707173",
      "#8a8678",
      "#a59c74",
      "#c3b369",
      "#e1cc55",
      "#fee838",
    ],
  },
  set1: {
    name: "ColorBrewer Set1",
    description: {
      "zh-CN": "定性数据的经典配色方案",
      en: "Classic categorical palette for qualitative data",
    },
    colors: [
      "#e41a1c",
      "#377eb8",
      "#4daf4a",
      "#984ea3",
      "#ff7f00",
      "#ffff33",
      "#a65628",
      "#f781bf",
      "#999999",
    ],
  },
  pastel: {
    name: "Pastel Colors",
    description: {
      "zh-CN": "柔和的粉彩配色方案",
      en: "Soft pastel color palette",
    },
    colors: [
      "#fbb4ae",
      "#b3cde3",
      "#ccebc5",
      "#decbe4",
      "#fed9a6",
      "#ffffcc",
      "#e5d8bd",
      "#fddaec",
      "#f2f2f2",
    ],
  },
};

// 颜色工具函数
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const getContrastRatio = (color1: string, color2: string) => {
  const getLuminance = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

// 颜色分析结果类型定义
interface ColorAnalysis {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  contrastWithWhite: string;
  contrastWithBlack: string;
  wcagAA: boolean;
  wcagAAA: boolean;
}

export default function ColorPalette() {
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const numberFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const copy = isEnglish
    ? {
        colorCopied: "Color {color} copied to clipboard",
        paletteCopied: "Palette copied to clipboard",
        paletteExported: "Palette exported",
        palettes: "Palettes",
        analyzer: "Color analyzer",
        copy: "Copy",
        export: "Export",
        clickCopy: "Click to copy {color}",
        analyzerTitle: "Color analyzer",
        inputColor: "Input color value",
        pickColor: "Pick color",
        analyze: "Analyze",
        contrast: "Contrast analysis:",
        whiteContrast: "Contrast with white:",
        blackContrast: "Contrast with black:",
        helpTitle: "How to use",
        help: [
          {
            title: "Palettes:",
            text: "Browse classic palettes and click a color block to copy its value.",
          },
          {
            title: "Color analysis:",
            text: "Enter a color value to inspect color details and accessibility metrics.",
          },
          {
            title: "Export:",
            text: "Export a palette as JSON for use in other projects.",
          },
          {
            title: "Contrast check:",
            text: "Automatically check whether a color meets WCAG accessibility standards.",
          },
        ],
      }
    : {
        colorCopied: "颜色 {color} 已复制到剪贴板",
        paletteCopied: "配色方案已复制到剪贴板",
        paletteExported: "配色方案已导出",
        palettes: "配色方案",
        analyzer: "颜色分析",
        copy: "复制",
        export: "导出",
        clickCopy: "点击复制 {color}",
        analyzerTitle: "颜色分析器",
        inputColor: "输入颜色值",
        pickColor: "选择颜色",
        analyze: "分析",
        contrast: "对比度分析:",
        whiteContrast: "与白色对比:",
        blackContrast: "与黑色对比:",
        helpTitle: "使用说明",
        help: [
          {
            title: "配色方案:",
            text: "浏览各种经典配色方案，点击颜色块复制颜色值",
          },
          {
            title: "颜色分析:",
            text: "输入颜色值获取详细的颜色信息和可访问性分析",
          },
          {
            title: "导出功能:",
            text: "将配色方案导出为 JSON 文件，便于在其他项目中使用",
          },
          {
            title: "对比度检测:",
            text: "自动检测颜色是否符合 WCAG 可访问性标准",
          },
        ],
      };
  const [inputColor, setInputColor] = useState("#4e79a7");
  const [colorAnalysis, setColorAnalysis] = useState<ColorAnalysis | null>(
    null
  );

  const analyzeColor = (color: string) => {
    const rgb = hexToRgb(color);
    if (!rgb) return;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const contrastWithWhite = getContrastRatio(color, "#ffffff");
    const contrastWithBlack = getContrastRatio(color, "#000000");

    setColorAnalysis({
      hex: color,
      rgb,
      hsl,
      contrastWithWhite: numberFormatter.format(contrastWithWhite),
      contrastWithBlack: numberFormatter.format(contrastWithBlack),
      wcagAA: contrastWithWhite >= 4.5 || contrastWithBlack >= 4.5,
      wcagAAA: contrastWithWhite >= 7 || contrastWithBlack >= 7,
    });
  };

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    toast.success(copy.colorCopied.replace("{color}", color));
  };

  const copyPalette = (colors: string[]) => {
    const colorString = colors.join(", ");
    navigator.clipboard.writeText(colorString);
    toast.success(copy.paletteCopied);
  };

  const exportPalette = (colors: string[], name: string) => {
    const data = {
      name,
      colors,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}-palette.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(copy.paletteExported);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="palettes" className="flex flex-col gap-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="palettes">{copy.palettes}</TabsTrigger>
          <TabsTrigger value="analyzer">{copy.analyzer}</TabsTrigger>
        </TabsList>

        <TabsContent value="palettes" className="flex flex-col gap-6">
          <div className="grid gap-6">
            {Object.entries(colorPalettes).map(([key, palette]) => (
              <Card key={key} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{palette.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {palette.description[isEnglish ? "en" : "zh-CN"]}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPalette(palette.colors)}
                    >
                      <Copy data-icon="inline-start" />
                      {copy.copy}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        exportPalette(palette.colors, palette.name)
                      }
                    >
                      <Download data-icon="inline-start" />
                      {copy.export}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {palette.colors.map((color, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div
                        className="w-full h-16 rounded-lg border cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => copyColor(color)}
                        title={copy.clickCopy.replace("{color}", color)}
                      />
                      <div className="text-xs text-center font-mono">
                        {color}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analyzer" className="flex flex-col gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {copy.analyzerTitle}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="color-text-input"
                    className="text-sm font-medium mb-2 block"
                  >
                    {copy.inputColor}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="color-picker-input"
                      name="colorPicker"
                      aria-label={copy.pickColor}
                      type="color"
                      value={inputColor}
                      onChange={e => setInputColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      id="color-text-input"
                      name="colorValue"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={inputColor}
                      onChange={e => setInputColor(e.target.value)}
                      placeholder="#4e79a7"
                      className="flex-1"
                    />
                    <Button onClick={() => analyzeColor(inputColor)}>
                      <Eye data-icon="inline-start" />
                      {copy.analyze}
                    </Button>
                  </div>
                </div>
              </div>

              {colorAnalysis && (
                <div className="flex flex-col gap-4">
                  <div
                    className="w-full h-32 rounded-lg border"
                    style={{ backgroundColor: colorAnalysis.hex }}
                  />

                  <div className="flex flex-col text-sm gap-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">HEX:</span>{" "}
                        {colorAnalysis.hex}
                      </div>
                      <div>
                        <span className="font-medium">RGB:</span>{" "}
                        {colorAnalysis.rgb.r}, {colorAnalysis.rgb.g},{" "}
                        {colorAnalysis.rgb.b}
                      </div>
                      <div>
                        <span className="font-medium">HSL:</span>{" "}
                        {colorAnalysis.hsl.h}°, {colorAnalysis.hsl.s}%,{" "}
                        {colorAnalysis.hsl.l}%
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="font-medium mb-2">{copy.contrast}</div>
                      <div className="flex flex-col gap-1">
                        <div>
                          {copy.whiteContrast} {colorAnalysis.contrastWithWhite}
                        </div>
                        <div>
                          {copy.blackContrast} {colorAnalysis.contrastWithBlack}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge
                            variant={
                              colorAnalysis.wcagAA ? "default" : "destructive"
                            }
                          >
                            WCAG AA {colorAnalysis.wcagAA ? "✓" : "✗"}
                          </Badge>
                          <Badge
                            variant={
                              colorAnalysis.wcagAAA ? "default" : "destructive"
                            }
                          >
                            WCAG AAA {colorAnalysis.wcagAAA ? "✓" : "✗"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{copy.helpTitle}</h2>
        <ul className="flex flex-col list-disc list-inside text-muted-foreground gap-2">
          {copy.help.map(item => (
            <li key={item.title}>
              <strong>{item.title}</strong> {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
