"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Eye, Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
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
  contrastWithWhite: number;
  contrastWithBlack: number;
}

export default function ColorPalette() {
  const locale = useLocale();
  const t = useTranslations("colorPalette");
  const isEnglish = locale === englishLocale;
  const numberFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const [inputColor, setInputColor] = useState("#4e79a7");
  const [colorAnalysis, setColorAnalysis] = useState<ColorAnalysis | null>(
    null
  );
  const [colorError, setColorError] = useState("");
  const colorInputRef = useRef<HTMLInputElement>(null);

  const changeInputColor = (color: string) => {
    setInputColor(color);
    setColorError("");
    setColorAnalysis(null);
  };

  const analyzeColor = (color: string) => {
    const normalizedColor = `#${color.trim().replace(/^#/, "").toLowerCase()}`;
    const rgb = hexToRgb(normalizedColor);
    if (!rgb) {
      setColorError(t("invalidColor"));
      setColorAnalysis(null);
      colorInputRef.current?.focus();
      return;
    }

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const contrastWithWhite = getContrastRatio(normalizedColor, "#ffffff");
    const contrastWithBlack = getContrastRatio(normalizedColor, "#000000");

    setInputColor(normalizedColor);
    setColorError("");
    setColorAnalysis({
      hex: normalizedColor,
      rgb,
      hsl,
      contrastWithWhite,
      contrastWithBlack,
    });
  };

  const copyColor = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      toast.success(t("colorCopied", { color }));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const copyPalette = async (colors: string[]) => {
    try {
      await navigator.clipboard.writeText(colors.join(", "));
      toast.success(t("paletteCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
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

    toast.success(t("paletteExported"));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="palettes" className="flex flex-col gap-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="palettes">{t("palettes")}</TabsTrigger>
          <TabsTrigger value="analyzer">{t("analyzer")}</TabsTrigger>
        </TabsList>

        <TabsContent value="palettes" className="flex flex-col gap-6">
          <div className="grid gap-6">
            {Object.entries(colorPalettes).map(([key, palette]) => (
              <Card
                key={key}
                role="region"
                aria-labelledby={`${key}-palette-title`}
                className="min-w-0 p-4 sm:p-6"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2
                      id={`${key}-palette-title`}
                      className="text-lg font-semibold"
                    >
                      {palette.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {palette.description[isEnglish ? "en" : "zh-CN"]}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11"
                      aria-label={t("copyPaletteLabel", {
                        palette: palette.name,
                      })}
                      onClick={() => copyPalette(palette.colors)}
                    >
                      <Copy data-icon="inline-start" />
                      {t("copy")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11"
                      aria-label={t("exportPaletteLabel", {
                        palette: palette.name,
                      })}
                      onClick={() =>
                        exportPalette(palette.colors, palette.name)
                      }
                    >
                      <Download data-icon="inline-start" />
                      {t("export")}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
                  {palette.colors.map((color, index) => (
                    <div key={index} className="flex min-w-0 flex-col gap-2">
                      <button
                        type="button"
                        className="h-16 w-full rounded-lg border transition-opacity hover:opacity-80 active:opacity-70"
                        style={{ backgroundColor: color }}
                        onClick={() => copyColor(color)}
                        aria-label={t("copyColorLabel", {
                          palette: palette.name,
                          color,
                        })}
                      />
                      <div
                        className="break-all text-center font-mono text-xs"
                        translate="no"
                      >
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
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("analyzerTitle")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <form
                className="flex min-w-0 flex-col gap-4"
                onSubmit={event => {
                  event.preventDefault();
                  analyzeColor(inputColor);
                }}
              >
                <div>
                  <label
                    htmlFor="color-text-input"
                    className="text-sm font-medium mb-2 block"
                  >
                    {t("inputColor")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id="color-picker-input"
                      name="colorPicker"
                      aria-label={t("pickColor")}
                      type="color"
                      value={
                        hexToRgb(inputColor.trim())
                          ? `#${inputColor.trim().replace(/^#/, "")}`
                          : "#4e79a7"
                      }
                      onChange={e => changeInputColor(e.target.value)}
                      className="h-11 w-16 shrink-0 p-1"
                    />
                    <Input
                      ref={colorInputRef}
                      id="color-text-input"
                      name="colorValue"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={Boolean(colorError)}
                      aria-describedby={
                        colorError ? "color-input-error" : undefined
                      }
                      value={inputColor}
                      onChange={e => changeInputColor(e.target.value)}
                      placeholder="#4e79a7"
                      className="h-11 min-w-0 flex-1 font-mono"
                    />
                    <Button type="submit" className="min-h-11 w-full">
                      <Eye data-icon="inline-start" />
                      {t("analyze")}
                    </Button>
                  </div>
                  {colorError && (
                    <p
                      id="color-input-error"
                      role="alert"
                      className="mt-2 text-sm text-destructive dark:text-destructive-foreground"
                    >
                      {colorError}
                    </p>
                  )}
                </div>
              </form>

              {colorAnalysis && (
                <div className="flex min-w-0 flex-col gap-4">
                  <div
                    className="w-full h-32 rounded-lg border"
                    style={{ backgroundColor: colorAnalysis.hex }}
                  />

                  <div className="flex flex-col text-sm gap-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

                    <div className="border-t pt-3">
                      <h3 className="font-medium">{t("contrast")}</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("contrastScope")}
                      </p>
                      <div className="mt-3 divide-y">
                        {[
                          {
                            key: "white",
                            label: t("whiteBackground"),
                            ratio: colorAnalysis.contrastWithWhite,
                          },
                          {
                            key: "black",
                            label: t("blackBackground"),
                            ratio: colorAnalysis.contrastWithBlack,
                          },
                        ].map(({ key, label, ratio }) => (
                          <section
                            key={key}
                            aria-labelledby={`contrast-${key}`}
                            className="py-3 first:pt-0 last:pb-0"
                          >
                            <h4 id={`contrast-${key}`} className="font-medium">
                              {label}
                            </h4>
                            <p className="mt-1 font-mono tabular-nums">
                              {t("contrastRatio", {
                                ratio: numberFormatter.format(ratio),
                              })}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(
                                [
                                  { level: "AA", threshold: 4.5 },
                                  { level: "AAA", threshold: 7 },
                                ] as const
                              ).map(({ level, threshold }) => (
                                <Badge key={level} variant="outline">
                                  {t("wcagResult", {
                                    level,
                                    result: t(
                                      ratio >= threshold ? "passes" : "fails"
                                    ),
                                  })}
                                </Badge>
                              ))}
                            </div>
                          </section>
                        ))}
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
        <h2 className="text-xl font-semibold mb-4">{t("helpTitle")}</h2>
        <ul className="flex flex-col list-disc list-inside text-muted-foreground gap-2">
          {(["palettes", "analysis", "export", "contrast"] as const).map(
            key => (
              <li key={key}>
                <strong>{t(`help.${key}.title`)}</strong>{" "}
                {t(`help.${key}.text`)}
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}
