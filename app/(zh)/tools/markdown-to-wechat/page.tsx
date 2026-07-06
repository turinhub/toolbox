"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { WeChatPreview, WeChatPreviewHandle } from "./components/WeChatPreview";
import { StyleEditor } from "./components/StyleEditor";
import { defaultConfig, generateTheme } from "./utils/themeGenerator";
import { MarkdownConfig } from "./types";
import { Copy, RotateCcw, Settings } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

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

const englishDefaultMarkdown = `# Welcome to Markdown to WeChat

This is a simple **Markdown** editor that converts Markdown content into a format suitable for the WeChat Official Account editor.

## Features

- Supports common **Markdown** syntax
- Supports basic styling for **code blocks**
- Supports **custom themes**
- **One-click copy** to the WeChat editor
- **Live style editing** from the side panel

## Example link

This is an [external link example](https://github.com/doocs/md). When "Convert WeChat external links to references" is enabled, it will appear as a reference.

## Example code

\`\`\`javascript
function hello() {
  console.log("Hello, WeChat!");
}
\`\`\`

> This is an example blockquote.

## Image example

![Image alt text](https://picsum.photos/800/400 "Image title")

## Lists

1. First item
2. Second item
3. Third item

- Unordered item 1
- Unordered item 2

Start writing.
`;

export default function MarkdownToWeChatPage() {
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        copied: "Copied. Paste it into the WeChat Official Account editor.",
        resetContent: "Content reset",
        resetConfig: "Style config reset",
        resetContentButton: "Reset content",
        copy: "Copy",
        styleConfig: "Style config",
        preview: "Preview",
        styleSettings: "Style settings",
        defaultMarkdown: englishDefaultMarkdown,
        referenceLinks: "Reference links",
      }
    : {
        copied: "已复制到剪贴板，请到公众号后台粘贴",
        resetContent: "已重置内容",
        resetConfig: "已重置样式配置",
        resetContentButton: "重置内容",
        copy: "复制",
        styleConfig: "样式配置",
        preview: "预览",
        styleSettings: "样式设置",
        defaultMarkdown,
        referenceLinks: "引用链接",
      };
  const [markdown, setMarkdown] = useState(copy.defaultMarkdown);
  const [config, setConfig] = useState<MarkdownConfig>(defaultConfig);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const previewRef = useRef<WeChatPreviewHandle>(null);

  const theme = generateTheme(config);

  const handleCopy = async () => {
    if (previewRef.current) {
      await previewRef.current.copyToClipboard();
      toast.success(copy.copied);
    }
  };

  const handleReset = () => {
    setMarkdown(copy.defaultMarkdown);
    toast.info(copy.resetContent);
  };

  const handleConfigChange = (newConfig: MarkdownConfig) => {
    setConfig(newConfig);
  };

  const handleConfigReset = () => {
    setConfig(defaultConfig);
    toast.info(copy.resetConfig);
  };

  return (
    <div className="flex flex-col container mx-auto py-8 gap-8">
      <Card className="h-[calc(100vh-250px)] min-h-[600px] flex flex-col border shadow-sm">
        {/* Unified Toolbar */}
        <div className="flex justify-between items-center p-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw data-icon="inline-start" />
              {copy.resetContentButton}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleCopy}>
              <Copy data-icon="inline-start" />
              {copy.copy}
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStyleEditor(!showStyleEditor)}
              className={showStyleEditor ? "bg-muted" : ""}
            >
              <Settings data-icon="inline-start" />
              {copy.styleConfig}
            </Button>
          </div>
        </div>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="flex h-full w-full">
            {/* Editor Panel */}
            {!showStyleEditor && (
              <div className="w-[40%] flex flex-col h-full border-r relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border backdrop-blur-sm">
                    Markdown
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MarkdownEditor value={markdown} onChange={setMarkdown} />
                </div>
              </div>
            )}

            {/* Preview Panel */}
            <div className="flex-1 flex flex-col h-full bg-white relative group">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border backdrop-blur-sm">
                  {copy.preview}
                </span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <WeChatPreview
                  ref={previewRef}
                  content={markdown}
                  theme={theme}
                  config={config}
                  referenceTitle={copy.referenceLinks}
                />
              </div>
            </div>

            {/* Style Editor Panel */}
            {showStyleEditor && (
              <div className="w-[300px] flex flex-col h-full border-l bg-background">
                <div className="p-3 border-b text-sm font-medium bg-muted/10">
                  {copy.styleSettings}
                </div>
                <div className="flex-1 overflow-hidden">
                  <StyleEditor
                    config={config}
                    onConfigChange={handleConfigChange}
                    onReset={handleConfigReset}
                    locale={isEnglish ? "en" : "zh-CN"}
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
