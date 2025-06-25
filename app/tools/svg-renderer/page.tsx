"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

export default function SVGRenderer() {
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
    toast.success("SVG 代码已复制到剪贴板");
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
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-2xl font-bold">SVG 渲染器</h1>
        <p className="text-muted-foreground">
          在线预览和编辑 SVG 矢量图，支持实时渲染和代码编辑
        </p>
      </div>

      <div className={`grid ${fullscreen ? "" : "md:grid-cols-2"} gap-6`}>
        <Card className={`p-4 ${fullscreen ? "hidden" : ""}`}>
          <h2 className="text-lg font-semibold mb-2">SVG 代码</h2>
          <div className="space-y-4">
            <Textarea
              value={svgCode}
              onChange={e => handleSvgChange(e.target.value)}
              className="font-mono h-[300px]"
              placeholder="在此输入 SVG 代码..."
            />
            <Button onClick={handleCopy} className="w-full">
              复制 SVG 代码
            </Button>
          </div>
        </Card>

        <Card className={`p-4 ${fullscreen ? "w-full h-screen" : ""}`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">预览</h2>
            <div className="flex gap-2">
              <Button
                onClick={zoomOut}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">缩小</span>
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
                <span className="sr-only">放大</span>
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
                <span className="sr-only">切换全屏</span>
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
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>在左侧文本框中输入或粘贴 SVG 代码</li>
          <li>右侧区域会实时显示 SVG 图像预览</li>
          <li>支持修改 SVG 属性（如颜色、大小等）并实时查看效果</li>
          <li>使用缩放控制可以放大或缩小图像，方便查看细节</li>
          <li>点击全屏按钮可以在更大的视图中查看 SVG</li>
          <li>点击&ldquo;复制 SVG 代码&rdquo;按钮可以复制当前的 SVG 代码</li>
        </ul>
      </div>
    </div>
  );
}
