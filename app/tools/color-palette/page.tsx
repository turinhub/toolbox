"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Eye, Download } from "lucide-react";

// 常见配色表数据
const colorPalettes = {
  tableau: {
    name: "Tableau 10",
    description: "Tableau 默认配色方案，适用于数据可视化",
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
    description: "Tableau 扩展配色方案，提供更多颜色选择",
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
    description: "Google Material Design 配色方案",
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
    description: "科学可视化常用的感知均匀配色方案",
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
    description: "高对比度的感知均匀配色方案",
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
    description: "对色盲友好的感知均匀配色方案",
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
    description: "定性数据的经典配色方案",
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
    description: "柔和的粉彩配色方案",
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
      contrastWithWhite: contrastWithWhite.toFixed(2),
      contrastWithBlack: contrastWithBlack.toFixed(2),
      wcagAA: contrastWithWhite >= 4.5 || contrastWithBlack >= 4.5,
      wcagAAA: contrastWithWhite >= 7 || contrastWithBlack >= 7,
    });
  };

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    toast.success(`颜色 ${color} 已复制到剪贴板`);
  };

  const copyPalette = (colors: string[]) => {
    const colorString = colors.join(", ");
    navigator.clipboard.writeText(colorString);
    toast.success("配色方案已复制到剪贴板");
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

    toast.success("配色方案已导出");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-2xl font-bold">配色表</h1>
        <p className="text-muted-foreground">
          常见配色表展示，支持在线配色检测和色彩搭配
        </p>
      </div>

      <Tabs defaultValue="palettes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="palettes">配色方案</TabsTrigger>
          <TabsTrigger value="analyzer">颜色分析</TabsTrigger>
        </TabsList>

        <TabsContent value="palettes" className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(colorPalettes).map(([key, palette]) => (
              <Card key={key} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{palette.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {palette.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPalette(palette.colors)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      复制
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        exportPalette(palette.colors, palette.name)
                      }
                    >
                      <Download className="h-4 w-4 mr-1" />
                      导出
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {palette.colors.map((color, index) => (
                    <div key={index} className="space-y-2">
                      <div
                        className="w-full h-16 rounded-lg border cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => copyColor(color)}
                        title={`点击复制 ${color}`}
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

        <TabsContent value="analyzer" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">颜色分析器</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    输入颜色值
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={inputColor}
                      onChange={e => setInputColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={inputColor}
                      onChange={e => setInputColor(e.target.value)}
                      placeholder="#4e79a7"
                      className="flex-1"
                    />
                    <Button onClick={() => analyzeColor(inputColor)}>
                      <Eye className="h-4 w-4 mr-1" />
                      分析
                    </Button>
                  </div>
                </div>
              </div>

              {colorAnalysis && (
                <div className="space-y-4">
                  <div
                    className="w-full h-32 rounded-lg border"
                    style={{ backgroundColor: colorAnalysis.hex }}
                  />

                  <div className="space-y-2 text-sm">
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
                      <div className="font-medium mb-2">对比度分析:</div>
                      <div className="space-y-1">
                        <div>与白色对比: {colorAnalysis.contrastWithWhite}</div>
                        <div>与黑色对比: {colorAnalysis.contrastWithBlack}</div>
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
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            <strong>配色方案:</strong>{" "}
            浏览各种经典配色方案，点击颜色块复制颜色值
          </li>
          <li>
            <strong>颜色分析:</strong>{" "}
            输入颜色值获取详细的颜色信息和可访问性分析
          </li>
          <li>
            <strong>导出功能:</strong> 将配色方案导出为 JSON
            文件，便于在其他项目中使用
          </li>
          <li>
            <strong>对比度检测:</strong> 自动检测颜色是否符合 WCAG 可访问性标准
          </li>
        </ul>
      </div>
    </div>
  );
}
