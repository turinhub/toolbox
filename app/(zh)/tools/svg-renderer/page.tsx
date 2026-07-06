"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

export default function SVGRenderer() {
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        copied: "SVG code copied to clipboard",
        codeTitle: "SVG code",
        placeholder: "Enter SVG code here...",
        copyCode: "Copy SVG code",
        preview: "Preview",
        zoomOut: "Zoom out",
        zoomIn: "Zoom in",
        fullscreen: "Toggle fullscreen",
        helpTitle: "How to use",
        help: [
          "Enter or paste SVG code in the text area on the left.",
          "The right panel shows a live SVG preview.",
          "Edit SVG attributes such as color or size and preview the result immediately.",
          "Use zoom controls to inspect details.",
          "Use fullscreen mode for a larger SVG preview.",
          'Click "Copy SVG code" to copy the current SVG source.',
        ],
      }
    : {
        copied: "SVG 代码已复制到剪贴板",
        codeTitle: "SVG 代码",
        placeholder: "在此输入 SVG 代码…",
        copyCode: "复制 SVG 代码",
        preview: "预览",
        zoomOut: "缩小",
        zoomIn: "放大",
        fullscreen: "切换全屏",
        helpTitle: "使用说明",
        help: [
          "在左侧文本框中输入或粘贴 SVG 代码",
          "右侧区域会实时显示 SVG 图像预览",
          "支持修改 SVG 属性（如颜色、大小等）并实时查看效果",
          "使用缩放控制可以放大或缩小图像，方便查看细节",
          "点击全屏按钮可以在更大的视图中查看 SVG",
          "点击“复制 SVG 代码”按钮可以复制当前的 SVG 代码",
        ],
      };
  const [svgCode, setSvgCode] = useState<string>(`<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="currentColor"
  width="100"
  height="100"
>
  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
  <path d="M17 7L7 17M7 7l10 10" stroke="white" stroke-width="2" />
</svg>`);

  const [error, setError] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const handleSvgChange = (value: string) => {
    setSvgCode(value);
    setError("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(svgCode);
    toast.success(copy.copied);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  const toggleFullscreen = () => {
    setFullscreen(prev => !prev);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className={`grid ${fullscreen ? "" : "md:grid-cols-2"} gap-6`}>
        <Card className={`p-4 ${fullscreen ? "hidden" : ""}`}>
          <h2 className="text-lg font-semibold mb-2">{copy.codeTitle}</h2>
          <div className="flex flex-col gap-4">
            <Textarea
              value={svgCode}
              onChange={e => handleSvgChange(e.target.value)}
              className="font-mono h-[300px]"
              placeholder={copy.placeholder}
            />
            <Button onClick={handleCopy} className="w-full">
              {copy.copyCode}
            </Button>
          </div>
        </Card>

        <Card className={`p-4 ${fullscreen ? "w-full h-screen" : ""}`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">{copy.preview}</h2>
            <div className="flex gap-2">
              <Button
                onClick={zoomOut}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">{copy.zoomOut}</span>
              </Button>
              <Button
                onClick={resetZoom}
                size="sm"
                variant="outline"
                className="h-8"
              >
                {zoomLevel}%
              </Button>
              <Button
                onClick={zoomIn}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">{copy.zoomIn}</span>
              </Button>
              <Button
                onClick={toggleFullscreen}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
              >
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span className="sr-only">{copy.fullscreen}</span>
              </Button>
            </div>
          </div>
          <div
            className={`border rounded-lg p-4 ${fullscreen ? "h-[calc(100vh-160px)]" : "h-[300px]"} flex items-center justify-center bg-grid-pattern overflow-auto`}
          >
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <div
                ref={svgContainerRef}
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s ease",
                }}
                dangerouslySetInnerHTML={{ __html: svgCode }}
              />
            )}
          </div>
        </Card>
      </div>

      <div className={`mt-8 ${fullscreen ? "hidden" : ""}`}>
        <h2 className="text-xl font-semibold mb-4">{copy.helpTitle}</h2>
        <ul className="flex flex-col list-disc list-inside text-muted-foreground gap-2">
          {copy.help.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
