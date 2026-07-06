"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { useTheme } from "next-themes";
import mermaid from "mermaid";
import {
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  ImageDown,
  Maximize2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type MermaidThemeOption = "system" | "default" | "dark" | "neutral" | "forest";
type MermaidTheme = Exclude<MermaidThemeOption, "system">;
type BackgroundMode = "page" | "white" | "transparent";

interface MermaidExample {
  value: string;
  label: string;
  code: string;
}

interface RenderError {
  message: string;
  line?: number;
  column?: number;
}

const FILE_BASENAME = "mermaid-diagram";

const EXAMPLES: MermaidExample[] = [
  {
    value: "flowchart",
    label: "流程图",
    code: `flowchart TD
    A[接收需求] --> B{信息完整?}
    B -- 是 --> C[生成方案]
    B -- 否 --> D[补充上下文]
    D --> B
    C --> E[交付结果]`,
  },
  {
    value: "sequence",
    label: "时序图",
    code: `sequenceDiagram
    participant 用户
    participant 前端
    participant API
    用户->>前端: 提交请求
    前端->>API: 校验并发送数据
    API-->>前端: 返回处理结果
    前端-->>用户: 展示反馈`,
  },
  {
    value: "gantt",
    label: "甘特图",
    code: `gantt
    title 发布计划
    dateFormat  YYYY-MM-DD
    section 设计
    交互梳理     :done,    des1, 2026-06-01, 3d
    视觉调整     :active,  des2, after des1, 4d
    section 开发
    功能实现     :dev1, 2026-06-08, 5d
    验证发布     :dev2, after dev1, 2d`,
  },
  {
    value: "class",
    label: "类图",
    code: `classDiagram
    class Tool {
      +string name
      +string path
      +render()
    }
    class MermaidRenderer {
      +exportSvg()
      +exportPng()
    }
    Tool <|-- MermaidRenderer`,
  },
  {
    value: "state",
    label: "状态图",
    code: `stateDiagram-v2
    [*] --> Editing
    Editing --> Rendering: 输入变化
    Rendering --> Ready: 渲染成功
    Rendering --> Error: 语法错误
    Error --> Editing: 修复代码
    Ready --> Exporting: 下载图表
    Exporting --> Ready`,
  },
  {
    value: "er",
    label: "ER 图",
    code: `erDiagram
    USER ||--o{ DIAGRAM : creates
    DIAGRAM ||--o{ EXPORT : has
    USER {
      string id
      string name
    }
    DIAGRAM {
      string id
      string source
    }
    EXPORT {
      string format
      datetime createdAt
    }`,
  },
  {
    value: "journey",
    label: "用户旅程",
    code: `journey
    title 图表导出流程
    section 编辑
      粘贴 Mermaid 代码: 5: 用户
      修复语法错误: 3: 用户
    section 预览
      调整主题: 4: 用户
      放大查看细节: 4: 用户
    section 交付
      下载 SVG: 5: 用户
      导出 PNG: 5: 用户`,
  },
  {
    value: "gitgraph",
    label: "GitGraph",
    code: `gitGraph
    commit id: "init"
    branch feature
    checkout feature
    commit id: "renderer"
    commit id: "export"
    checkout main
    merge feature
    commit id: "release"`,
  },
];

const DEFAULT_CODE = EXAMPLES[0].code;

function extractRenderError(error: unknown): RenderError {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const lines = rawMessage.split("\n").filter(Boolean);
  const compactMessage = lines.slice(0, 4).join("\n") || rawMessage;
  const lineMatch = rawMessage.match(/line\s+(\d+)/i);
  const columnMatch = rawMessage.match(/(?:column|col)\s+(\d+)/i);

  return {
    message: compactMessage,
    line: lineMatch ? Number(lineMatch[1]) : undefined,
    column: columnMatch ? Number(columnMatch[1]) : undefined,
  };
}

function downloadTextFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getExportBackgroundColor(
  backgroundMode: BackgroundMode,
  resolvedTheme?: string
) {
  if (backgroundMode === "transparent") return null;
  if (backgroundMode === "white") return "#ffffff";
  return resolvedTheme === "dark" ? "#020817" : "#ffffff";
}

function buildSvgForExport(svg: string, backgroundColor: string | null) {
  if (!backgroundColor) return svg;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const svgNode = doc.querySelector("svg");

  if (!svgNode) return svg;

  const width =
    svgNode.getAttribute("width") ||
    svgNode.viewBox.baseVal?.width.toString() ||
    "1200";
  const height =
    svgNode.getAttribute("height") ||
    svgNode.viewBox.baseVal?.height.toString() ||
    "800";
  const rect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("fill", backgroundColor);
  svgNode.insertBefore(rect, svgNode.firstChild);

  return new XMLSerializer().serializeToString(svgNode);
}

function getSvgDimensions(svg: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const svgNode = doc.querySelector("svg");
  const viewBox = svgNode?.getAttribute("viewBox")?.split(/\s+/).map(Number);
  const width = Number.parseFloat(svgNode?.getAttribute("width") || "");
  const height = Number.parseFloat(svgNode?.getAttribute("height") || "");

  return {
    width: Number.isFinite(width) && width > 0 ? width : viewBox?.[2] || 1200,
    height:
      Number.isFinite(height) && height > 0 ? height : viewBox?.[3] || 800,
  };
}

function PreviewCanvas({
  svg,
  zoomLevel,
  backgroundMode,
  isRendering,
  error,
}: {
  svg: string;
  zoomLevel: number;
  backgroundMode: BackgroundMode;
  isRendering: boolean;
  error: RenderError | null;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[360px] items-center justify-center overflow-auto rounded-lg border p-4",
        backgroundMode === "page" && "bg-background",
        backgroundMode === "white" && "bg-white",
        backgroundMode === "transparent" &&
          "bg-[linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(-45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(45deg,transparent_75%,hsl(var(--muted))_75%),linear-gradient(-45deg,transparent_75%,hsl(var(--muted))_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]"
      )}
    >
      {isRendering ? (
        <div className="absolute left-3 top-3 rounded-md border bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
          正在渲染…
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-x-3 top-3 z-10 rounded-md border border-destructive/30 bg-background/95 p-3 text-sm shadow-sm">
          <div className="flex items-center gap-2 font-medium text-destructive">
            <ShieldAlert className="size-4" aria-hidden="true" />
            Mermaid 语法需要修正
          </div>
          <p className="mt-1 text-muted-foreground">
            {error.line
              ? `定位：第 ${error.line} 行${error.column ? `，第 ${error.column} 列` : ""}`
              : "请检查图表类型、箭头、缩进或引号是否完整。"}
          </p>
        </div>
      ) : null}
      {svg ? (
        <div
          aria-label="Mermaid 渲染预览"
          className={cn(
            "mermaid-preview max-w-none text-foreground transition-transform",
            backgroundMode === "white" && "text-slate-950"
          )}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "center center",
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="text-center text-sm text-muted-foreground">
          输入 Mermaid 代码后会在这里显示图表。
        </div>
      )}
    </div>
  );
}

export default function MermaidRendererPage() {
  const [mermaidCode, setMermaidCode] = useState(DEFAULT_CODE);
  const [lastValidCode, setLastValidCode] = useState(DEFAULT_CODE);
  const [lastValidSvg, setLastValidSvg] = useState("");
  const [error, setError] = useState<RenderError | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [themeOption, setThemeOption] = useState<MermaidThemeOption>("system");
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("page");
  const [allowInteractiveContent, setAllowInteractiveContent] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const renderIdRef = useRef(0);
  const { resolvedTheme } = useTheme();

  const resolvedMermaidTheme = useMemo<MermaidTheme>(() => {
    if (themeOption !== "system") return themeOption;
    return resolvedTheme === "dark" ? "dark" : "default";
  }, [resolvedTheme, themeOption]);

  const securityLevel = allowInteractiveContent ? "loose" : "strict";
  const canExport = Boolean(lastValidSvg);

  const renderMermaid = useCallback(
    async (code: string) => {
      const renderId = renderIdRef.current + 1;
      renderIdRef.current = renderId;

      if (!code.trim()) {
        setError(null);
        setIsRendering(false);
        setLastValidSvg("");
        return;
      }

      setIsRendering(true);
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedMermaidTheme,
        securityLevel,
      });

      try {
        const { svg } = await mermaid.render(
          `mermaid-graph-${renderId}-${Date.now()}`,
          code
        );

        if (renderIdRef.current !== renderId) return;

        setLastValidSvg(svg);
        setLastValidCode(code);
        setError(null);
      } catch (renderError) {
        if (renderIdRef.current !== renderId) return;
        setError(extractRenderError(renderError));
      } finally {
        if (renderIdRef.current === renderId) {
          setIsRendering(false);
        }
      }
    },
    [resolvedMermaidTheme, securityLevel]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      renderMermaid(mermaidCode);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [mermaidCode, renderMermaid]);

  const handleCopy = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("复制失败，请检查浏览器剪贴板权限");
    }
  };

  const handleDownloadSource = () => {
    downloadTextFile(
      mermaidCode,
      `${FILE_BASENAME}.mmd`,
      "text/plain;charset=utf-8"
    );
    toast.success("Mermaid 源码已下载");
  };

  const handleDownloadSvg = () => {
    if (!lastValidSvg) return;

    downloadTextFile(
      buildSvgForExport(
        lastValidSvg,
        getExportBackgroundColor(backgroundMode, resolvedTheme)
      ),
      `${FILE_BASENAME}.svg`,
      "image/svg+xml;charset=utf-8"
    );
    toast.success("SVG 图表已下载");
  };

  const handleDownloadPng = async () => {
    if (!lastValidSvg) return;

    try {
      const backgroundColor = getExportBackgroundColor(
        backgroundMode,
        resolvedTheme
      );
      const exportSvg = buildSvgForExport(lastValidSvg, backgroundColor);
      const { width, height } = getSvgDimensions(exportSvg);
      const svgBlob = new Blob([exportSvg], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("SVG 图像无法转换为 PNG"));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width);
      canvas.height = Math.ceil(height);
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("当前浏览器不支持 Canvas 导出");
      }

      if (backgroundColor) {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("PNG 导出失败"));
          }
        }, "image/png");
      });

      const pngUrl = URL.createObjectURL(pngBlob);
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${FILE_BASENAME}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pngUrl);
      toast.success("PNG 图表已下载");
    } catch (downloadError) {
      toast.error("PNG 导出失败", {
        description:
          downloadError instanceof Error
            ? downloadError.message
            : "请尝试导出 SVG。",
      });
    }
  };

  const handleRestore = () => {
    setMermaidCode(lastValidCode);
    setError(null);
    renderMermaid(lastValidCode);
    toast.success("已恢复上次有效代码");
  };

  const handleLoadExample = (value: string) => {
    const example = EXAMPLES.find(item => item.value === value);
    if (!example) return;

    setMermaidCode(example.code);
    setZoomLevel(100);
    toast.success(`已载入${example.label}示例`);
  };

  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
  const resetZoom = () => setZoomLevel(100);

  const preview = (
    <PreviewCanvas
      svg={lastValidSvg}
      zoomLevel={zoomLevel}
      backgroundMode={backgroundMode}
      isRendering={isRendering}
      error={error}
    />
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileCode2 className="size-5" aria-hidden="true" />
                  图表工作台
                </CardTitle>
                <CardDescription>
                  编辑 Mermaid 代码，实时预览并导出 SVG 或 PNG 图表。
                </CardDescription>
              </div>
              <Badge
                variant={allowInteractiveContent ? "destructive" : "secondary"}
                className="w-fit"
              >
                {allowInteractiveContent ? "交互内容已允许" : "安全模式"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <Label htmlFor="mermaid-example">示例模板</Label>
                <Select onValueChange={handleLoadExample}>
                  <SelectTrigger id="mermaid-example">
                    <SelectValue placeholder="选择示例" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {EXAMPLES.map(example => (
                        <SelectItem key={example.value} value={example.value}>
                          {example.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mermaid-theme">渲染主题</Label>
                <Select
                  value={themeOption}
                  onValueChange={value =>
                    setThemeOption(value as MermaidThemeOption)
                  }
                >
                  <SelectTrigger id="mermaid-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="system">跟随系统</SelectItem>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="forest">Forest</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mermaid-background">背景模式</Label>
                <Select
                  value={backgroundMode}
                  onValueChange={value =>
                    setBackgroundMode(value as BackgroundMode)
                  }
                >
                  <SelectTrigger id="mermaid-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="page">页面背景</SelectItem>
                      <SelectItem value="white">白底导出</SelectItem>
                      <SelectItem value="transparent">透明导出</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-[220px] items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="mermaid-interactive" className="text-sm">
                    允许图表链接
                  </Label>
                  <p className="text-xs leading-5 text-muted-foreground">
                    开启后使用 Mermaid loose 模式。
                  </p>
                </div>
                <Switch
                  id="mermaid-interactive"
                  checked={allowInteractiveContent}
                  onCheckedChange={setAllowInteractiveContent}
                  aria-label="允许 Mermaid 图表链接和交互内容"
                />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <section className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Label
                      htmlFor="mermaid-code-editor"
                      className="text-base font-semibold"
                    >
                      Mermaid 代码
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      支持流程图、时序图、甘特图、类图等 Mermaid 语法。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy(mermaidCode, "Mermaid 源码已复制")
                      }
                    >
                      <Copy className="mr-2 size-4" aria-hidden="true" />
                      复制源码
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadSource}
                    >
                      <Download className="mr-2 size-4" aria-hidden="true" />
                      下载 MMD
                    </Button>
                  </div>
                </div>

                <div
                  id="mermaid-code-editor"
                  className="min-h-[420px] overflow-hidden rounded-lg border bg-background"
                >
                  <CodeMirror
                    value={mermaidCode}
                    height="420px"
                    extensions={[markdown()]}
                    onChange={setMermaidCode}
                    className="h-full text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono"
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: false,
                      highlightActiveLine: true,
                      bracketMatching: true,
                      closeBrackets: true,
                      autocompletion: true,
                    }}
                    theme={resolvedTheme === "dark" ? "dark" : "light"}
                    aria-label="Mermaid 代码编辑器"
                  />
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
                  >
                    <div className="flex items-center gap-2 font-medium text-destructive">
                      <ShieldAlert className="size-4" aria-hidden="true" />
                      渲染失败
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                      {error.message}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => renderMermaid(mermaidCode)}
                      >
                        <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                        重新渲染
                      </Button>
                      {lastValidCode ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleRestore}
                        >
                          <RotateCcw
                            className="mr-2 size-4"
                            aria-hidden="true"
                          />
                          恢复上次有效代码
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : lastValidSvg ? (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    <CheckCircle2
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                    当前图表可正常渲染
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    正在等待图表渲染…
                  </div>
                )}
              </section>

              <section className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">预览与导出</h2>
                    <p className="text-sm text-muted-foreground">
                      渲染失败时会保留上一次成功图表，方便对照修复。
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-9"
                          onClick={zoomOut}
                          aria-label="缩小预览"
                        >
                          <ZoomOut className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>缩小预览</TooltipContent>
                    </Tooltip>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-w-16"
                      onClick={resetZoom}
                    >
                      {zoomLevel}%
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-9"
                          onClick={zoomIn}
                          aria-label="放大预览"
                        >
                          <ZoomIn className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>放大预览</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-9"
                          onClick={() => setPreviewOpen(true)}
                          aria-label="打开全屏预览"
                        >
                          <Maximize2 className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>全屏预览</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {preview}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopy(lastValidSvg, "渲染 SVG 已复制")}
                    disabled={!canExport}
                  >
                    <Copy className="mr-2 size-4" aria-hidden="true" />
                    复制 SVG
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadSvg}
                    disabled={!canExport}
                  >
                    <Download className="mr-2 size-4" aria-hidden="true" />
                    下载 SVG
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDownloadPng}
                    disabled={!canExport}
                  >
                    <ImageDown className="mr-2 size-4" aria-hidden="true" />
                    导出 PNG
                  </Button>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
            <CardDescription>
              常用图表可以从示例模板开始，再按项目内容调整节点、关系和样式。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium text-foreground">编辑</h3>
              <p className="mt-2 leading-6">
                左侧编辑器支持行号和括号匹配，适合粘贴较长的 Mermaid 图表源码。
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium text-foreground">验证</h3>
              <p className="mt-2 leading-6">
                页面会自动渲染并保留上一次有效图表，语法错误不会清空预览。
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium text-foreground">导出</h3>
              <p className="mt-2 leading-6">
                SVG 适合继续编辑或嵌入文档，PNG 适合分享截图和普通办公文档。
              </p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="flex h-[92vh] max-w-[96vw] grid-rows-[auto_minmax(0,1fr)_auto] flex-col overflow-hidden p-4 sm:rounded-lg sm:p-6">
            <DialogHeader>
              <DialogTitle>Mermaid 全屏预览</DialogTitle>
              <DialogDescription>
                使用 Esc 或右上角关闭按钮退出全屏预览。
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden">{preview}</div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                >
                  <ZoomOut className="mr-2 size-4" aria-hidden="true" />
                  缩小
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetZoom}
                >
                  {zoomLevel}%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                >
                  <ZoomIn className="mr-2 size-4" aria-hidden="true" />
                  放大
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSvg}
                  disabled={!canExport}
                >
                  下载 SVG
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDownloadPng}
                  disabled={!canExport}
                >
                  导出 PNG
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
