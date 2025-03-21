"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const handleSvgChange = (value: string) => {
    setSvgCode(value);
    setError("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(svgCode);
    toast.success("SVG 代码已复制到剪贴板");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">SVG 渲染器</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">SVG 代码</h2>
          <div className="space-y-4">
            <Textarea
              value={svgCode}
              onChange={(e) => handleSvgChange(e.target.value)}
              className="font-mono h-[300px]"
              placeholder="在此输入 SVG 代码..."
            />
            <Button onClick={handleCopy} className="w-full">
              复制 SVG 代码
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">预览</h2>
          <div className="border rounded-lg p-4 h-[300px] flex items-center justify-center bg-grid-pattern">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: svgCode }} />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>在左侧文本框中输入或粘贴 SVG 代码</li>
          <li>右侧区域会实时显示 SVG 图像预览</li>
          <li>支持修改 SVG 属性（如颜色、大小等）并实时查看效果</li>
          <li>点击“复制 SVG 代码”按钮可以复制当前的 SVG 代码</li>
        </ul>
      </div>
    </div>
  );
} 