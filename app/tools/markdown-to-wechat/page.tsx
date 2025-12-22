"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "./components/MarkdownEditor";
import {
  WeChatPreview,
  WeChatPreviewHandle,
} from "./components/WeChatPreview";
import { StyleEditor } from "./components/StyleEditor";
import { defaultConfig, generateTheme } from "./utils/themeGenerator";
import { MarkdownConfig } from "./types";
import {
  Copy,
  RotateCcw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

const defaultMarkdown = `# 欢迎使用 Markdown 转公众号工具

这是一个简单的 **Markdown** 编辑器，可以帮助你将 Markdown 内容转换为微信公众号支持的格式。

## 功能特性

- 支持 **Markdown** 基础语法
- 支持 **代码块** 高亮（基础样式）
- 支持 **自定义主题**（默认主题支持自定义修改）
- **一键复制** 到公众号后台
- **右侧样式编辑**：可以实时调整各个元素的样式

## 示例链接

这是一个[外部链接示例](https://github.com/doocs/md)，开启“微信外链转底部引用”后会显示为引用格式。

## 示例代码

\`\`\`javascript
function hello() {
  console.log("Hello, WeChat!");
}
\`\`\`

> 这是一个引用块示例。

## 图片示例

![这是一个图片描述（Alt Text）](https://picsum.photos/800/400 "这是一个图片标题（Title）")

## 列表

1. 第一项
2. 第二项
3. 第三项

- 无序列表 1
- 无序列表 2

开始你的创作吧！
`;

export default function MarkdownToWeChatPage() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [config, setConfig] = useState<MarkdownConfig>(defaultConfig);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const previewRef = useRef<WeChatPreviewHandle>(null);

  const theme = generateTheme(config);

  const handleCopy = async () => {
    if (previewRef.current) {
      await previewRef.current.copyToClipboard();
      toast.success("已复制到剪贴板，请到公众号后台粘贴");
    }
  };

  const handleReset = () => {
    setMarkdown(defaultMarkdown);
    toast.info("已重置内容");
  };

  const handleConfigChange = (newConfig: MarkdownConfig) => {
    setConfig(newConfig);
  };

  const handleConfigReset = () => {
    setConfig(defaultConfig);
    toast.info("已重置样式配置");
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Markdown 转公众号</h1>
        <p className="text-muted-foreground">
          将 Markdown 内容转换为微信公众号格式，支持自定义样式
        </p>
      </div>

      <Card className="h-[calc(100vh-250px)] min-h-[600px] flex flex-col border shadow-sm">
        {/* Unified Toolbar */}
        <div className="flex justify-between items-center p-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              重置内容
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" />
              复制
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStyleEditor(!showStyleEditor)}
              className={showStyleEditor ? "bg-muted" : ""}
            >
              <Settings className="h-4 w-4 mr-1" />
              样式配置
            </Button>
          </div>
        </div>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="flex h-full w-full">
            {/* Editor Panel */}
            {!showStyleEditor && (
              <div className="w-[40%] flex flex-col h-full border-r relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border backdrop-blur-sm">Markdown</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MarkdownEditor value={markdown} onChange={setMarkdown} />
                </div>
              </div>
            )}

            {/* Preview Panel */}
            <div className="flex-1 flex flex-col h-full bg-white relative group">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border backdrop-blur-sm">预览</span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <WeChatPreview
                  ref={previewRef}
                  content={markdown}
                  theme={theme}
                  config={config}
                />
              </div>
            </div>

            {/* Style Editor Panel */}
            {showStyleEditor && (
              <div className="w-[300px] flex flex-col h-full border-l bg-background">
                <div className="p-3 border-b text-sm font-medium bg-muted/10">
                  样式设置
                </div>
                <div className="flex-1 overflow-hidden">
                  <StyleEditor
                    config={config}
                    onConfigChange={handleConfigChange}
                    onReset={handleConfigReset}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
