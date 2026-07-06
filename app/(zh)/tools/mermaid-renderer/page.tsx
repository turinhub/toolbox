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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

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

const zhExamples: MermaidExample[] = [
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

const enExamples: MermaidExample[] = [
  {
    value: "flowchart",
    label: "Flowchart",
    code: `flowchart TD
    A[Receive request] --> B{Is context complete?}
    B -- Yes --> C[Create plan]
    B -- No --> D[Ask for details]
    D --> B
    C --> E[Deliver result]`,
  },
  {
    value: "sequence",
    label: "Sequence diagram",
    code: `sequenceDiagram
    participant User
    participant Frontend
    participant API
    User->>Frontend: Submit request
    Frontend->>API: Validate and send data
    API-->>Frontend: Return result
    Frontend-->>User: Show feedback`,
  },
  {
    value: "gantt",
    label: "Gantt chart",
    code: `gantt
    title Release plan
    dateFormat  YYYY-MM-DD
    section Design
    Interaction review :done,    des1, 2026-06-01, 3d
    Visual polish      :active,  des2, after des1, 4d
    section Development
    Implementation     :dev1, 2026-06-08, 5d
    Validation         :dev2, after dev1, 2d`,
  },
  {
    value: "class",
    label: "Class diagram",
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
    label: "State diagram",
    code: `stateDiagram-v2
    [*] --> Editing
    Editing --> Rendering: Input changes
    Rendering --> Ready: Render succeeds
    Rendering --> Error: Syntax error
    Error --> Editing: Fix code
    Ready --> Exporting: Download diagram
    Exporting --> Ready`,
  },
  {
    value: "er",
    label: "ER diagram",
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
    label: "User journey",
    code: `journey
    title Diagram export flow
    section Editing
      Paste Mermaid code: 5: User
      Fix syntax errors: 3: User
    section Preview
      Adjust theme: 4: User
      Zoom into details: 4: User
    section Delivery
      Download SVG: 5: User
      Export PNG: 5: User`,
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

function getMermaidExamples(isEnglish: boolean) {
  return isEnglish ? enExamples : zhExamples;
}

function getMermaidCopy(isEnglish: boolean) {
  return isEnglish
    ? {
        rendering: "Rendering...",
        syntaxNeedsFix: "Mermaid syntax needs a fix",
        location: "Location: line {line}{column}",
        column: ", column {column}",
        genericSyntaxHelp:
          "Check that the chart type, arrows, indentation, and quotes are complete.",
        previewLabel: "Mermaid render preview",
        emptyPreview: "Enter Mermaid code to show the diagram here.",
        copyFailed: "Copy failed. Check browser clipboard permissions.",
        sourceDownloaded: "Mermaid source downloaded",
        svgDownloaded: "SVG diagram downloaded",
        imagePngError: "SVG image could not be converted to PNG",
        canvasUnsupported: "This browser does not support Canvas export",
        pngExportFailed: "PNG export failed",
        pngDownloaded: "PNG diagram downloaded",
        pngErrorDescription: "Try exporting SVG instead.",
        restored: "Restored the last valid code",
        exampleLoaded: "{label} example loaded",
        workbench: "Diagram workbench",
        workbenchDescription:
          "Edit Mermaid code, preview live, and export SVG or PNG diagrams.",
        interactiveAllowed: "Interactive content allowed",
        safeMode: "Safe mode",
        exampleTemplate: "Example template",
        chooseExample: "Choose an example",
        renderTheme: "Render theme",
        followSystem: "Follow system",
        backgroundMode: "Background mode",
        pageBackground: "Page background",
        whiteExport: "White export",
        transparentExport: "Transparent export",
        allowLinks: "Allow diagram links",
        looseMode: "Uses Mermaid loose mode when enabled.",
        allowLinksAria: "Allow Mermaid diagram links and interactive content",
        codeLabel: "Mermaid code",
        codeDescription:
          "Supports Mermaid syntax such as flowcharts, sequence diagrams, Gantt charts, and class diagrams.",
        copySource: "Copy source",
        sourceCopied: "Mermaid source copied",
        downloadMmd: "Download MMD",
        editorAria: "Mermaid code editor",
        renderFailed: "Render failed",
        rerender: "Render again",
        restore: "Restore last valid code",
        valid: "Current diagram renders successfully",
        waiting: "Waiting for diagram render...",
        previewTitle: "Preview and export",
        previewDescription:
          "When rendering fails, the last successful diagram is kept for comparison.",
        zoomOut: "Zoom out",
        zoomIn: "Zoom in",
        fullscreen: "Open fullscreen preview",
        copySvg: "Copy SVG",
        renderedSvgCopied: "Rendered SVG copied",
        downloadSvg: "Download SVG",
        exportPng: "Export PNG",
        helpTitle: "How to use",
        helpDescription:
          "Start from an example template, then adjust nodes, relationships, and styles for your project.",
        helpCards: [
          {
            title: "Edit",
            text: "The editor supports line numbers and bracket matching for longer Mermaid source.",
          },
          {
            title: "Validate",
            text: "The page renders automatically and keeps the previous valid diagram when syntax errors occur.",
          },
          {
            title: "Export",
            text: "SVG is good for further editing or embedding. PNG is better for screenshots and office documents.",
          },
        ],
        fullscreenTitle: "Mermaid fullscreen preview",
        fullscreenDescription: "Press Esc or the close button to exit preview.",
      }
    : {
        rendering: "正在渲染…",
        syntaxNeedsFix: "Mermaid 语法需要修正",
        location: "定位：第 {line} 行{column}",
        column: "，第 {column} 列",
        genericSyntaxHelp: "请检查图表类型、箭头、缩进或引号是否完整。",
        previewLabel: "Mermaid 渲染预览",
        emptyPreview: "输入 Mermaid 代码后会在这里显示图表。",
        copyFailed: "复制失败，请检查浏览器剪贴板权限",
        sourceDownloaded: "Mermaid 源码已下载",
        svgDownloaded: "SVG 图表已下载",
        imagePngError: "SVG 图像无法转换为 PNG",
        canvasUnsupported: "当前浏览器不支持 Canvas 导出",
        pngExportFailed: "PNG 导出失败",
        pngDownloaded: "PNG 图表已下载",
        pngErrorDescription: "请尝试导出 SVG。",
        restored: "已恢复上次有效代码",
        exampleLoaded: "已载入{label}示例",
        workbench: "图表工作台",
        workbenchDescription:
          "编辑 Mermaid 代码，实时预览并导出 SVG 或 PNG 图表。",
        interactiveAllowed: "交互内容已允许",
        safeMode: "安全模式",
        exampleTemplate: "示例模板",
        chooseExample: "选择示例",
        renderTheme: "渲染主题",
        followSystem: "跟随系统",
        backgroundMode: "背景模式",
        pageBackground: "页面背景",
        whiteExport: "白底导出",
        transparentExport: "透明导出",
        allowLinks: "允许图表链接",
        looseMode: "开启后使用 Mermaid loose 模式。",
        allowLinksAria: "允许 Mermaid 图表链接和交互内容",
        codeLabel: "Mermaid 代码",
        codeDescription: "支持流程图、时序图、甘特图、类图等 Mermaid 语法。",
        copySource: "复制源码",
        sourceCopied: "Mermaid 源码已复制",
        downloadMmd: "下载 MMD",
        editorAria: "Mermaid 代码编辑器",
        renderFailed: "渲染失败",
        rerender: "重新渲染",
        restore: "恢复上次有效代码",
        valid: "当前图表可正常渲染",
        waiting: "正在等待图表渲染…",
        previewTitle: "预览与导出",
        previewDescription: "渲染失败时会保留上一次成功图表，方便对照修复。",
        zoomOut: "缩小预览",
        zoomIn: "放大预览",
        fullscreen: "打开全屏预览",
        copySvg: "复制 SVG",
        renderedSvgCopied: "渲染 SVG 已复制",
        downloadSvg: "下载 SVG",
        exportPng: "导出 PNG",
        helpTitle: "使用说明",
        helpDescription:
          "常用图表可以从示例模板开始，再按项目内容调整节点、关系和样式。",
        helpCards: [
          {
            title: "编辑",
            text: "左侧编辑器支持行号和括号匹配，适合粘贴较长的 Mermaid 图表源码。",
          },
          {
            title: "验证",
            text: "页面会自动渲染并保留上一次有效图表，语法错误不会清空预览。",
          },
          {
            title: "导出",
            text: "SVG 适合继续编辑或嵌入文档，PNG 适合分享截图和普通办公文档。",
          },
        ],
        fullscreenTitle: "Mermaid 全屏预览",
        fullscreenDescription: "使用 Esc 或右上角关闭按钮退出全屏预览。",
      };
}

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
  copy,
}: {
  svg: string;
  zoomLevel: number;
  backgroundMode: BackgroundMode;
  isRendering: boolean;
  error: RenderError | null;
  copy: ReturnType<typeof getMermaidCopy>;
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
          {copy.rendering}
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-x-3 top-3 z-10 rounded-md border border-destructive/30 bg-background/95 p-3 text-sm shadow-sm">
          <div className="flex items-center gap-2 font-medium text-destructive">
            <ShieldAlert className="size-4" aria-hidden="true" />
            {copy.syntaxNeedsFix}
          </div>
          <p className="mt-1 text-muted-foreground">
            {error.line
              ? copy.location
                  .replace("{line}", String(error.line))
                  .replace(
                    "{column}",
                    error.column
                      ? copy.column.replace("{column}", String(error.column))
                      : ""
                  )
              : copy.genericSyntaxHelp}
          </p>
        </div>
      ) : null}
      {svg ? (
        <div
          aria-label={copy.previewLabel}
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
          {copy.emptyPreview}
        </div>
      )}
    </div>
  );
}

export default function MermaidRendererPage() {
  const isEnglish = useLocale() === englishLocale;
  const copy = getMermaidCopy(isEnglish);
  const examples = getMermaidExamples(isEnglish);
  const defaultCode = examples[0].code;
  const [mermaidCode, setMermaidCode] = useState(defaultCode);
  const [lastValidCode, setLastValidCode] = useState(defaultCode);
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
      toast.error(copy.copyFailed);
    }
  };

  const handleDownloadSource = () => {
    downloadTextFile(
      mermaidCode,
      `${FILE_BASENAME}.mmd`,
      "text/plain;charset=utf-8"
    );
    toast.success(copy.sourceDownloaded);
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
    toast.success(copy.svgDownloaded);
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
        image.onerror = () => reject(new Error(copy.imagePngError));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width);
      canvas.height = Math.ceil(height);
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error(copy.canvasUnsupported);
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
            reject(new Error(copy.pngExportFailed));
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
      toast.success(copy.pngDownloaded);
    } catch (downloadError) {
      toast.error(copy.pngExportFailed, {
        description:
          downloadError instanceof Error
            ? downloadError.message
            : copy.pngErrorDescription,
      });
    }
  };

  const handleRestore = () => {
    setMermaidCode(lastValidCode);
    setError(null);
    renderMermaid(lastValidCode);
    toast.success(copy.restored);
  };

  const handleLoadExample = (value: string) => {
    const example = examples.find(item => item.value === value);
    if (!example) return;

    setMermaidCode(example.code);
    setZoomLevel(100);
    toast.success(copy.exampleLoaded.replace("{label}", example.label));
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
      copy={copy}
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
                  {copy.workbench}
                </CardTitle>
                <CardDescription>{copy.workbenchDescription}</CardDescription>
              </div>
              <Badge
                variant={allowInteractiveContent ? "destructive" : "secondary"}
                className="w-fit"
              >
                {allowInteractiveContent ? copy.interactiveAllowed : copy.safeMode}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <Label htmlFor="mermaid-example">{copy.exampleTemplate}</Label>
                <Select onValueChange={handleLoadExample}>
                  <SelectTrigger id="mermaid-example">
                    <SelectValue placeholder={copy.chooseExample} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {examples.map(example => (
                        <SelectItem key={example.value} value={example.value}>
                          {example.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mermaid-theme">{copy.renderTheme}</Label>
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
                      <SelectItem value="system">{copy.followSystem}</SelectItem>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="forest">Forest</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mermaid-background">{copy.backgroundMode}</Label>
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
                      <SelectItem value="page">{copy.pageBackground}</SelectItem>
                      <SelectItem value="white">{copy.whiteExport}</SelectItem>
                      <SelectItem value="transparent">
                        {copy.transparentExport}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-[220px] items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="mermaid-interactive" className="text-sm">
                    {copy.allowLinks}
                  </Label>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {copy.looseMode}
                  </p>
                </div>
                <Switch
                  id="mermaid-interactive"
                  checked={allowInteractiveContent}
                  onCheckedChange={setAllowInteractiveContent}
                  aria-label={copy.allowLinksAria}
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
                      {copy.codeLabel}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {copy.codeDescription}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy(mermaidCode, copy.sourceCopied)
                      }
                    >
                      <Copy className="mr-2 size-4" aria-hidden="true" />
                      {copy.copySource}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadSource}
                    >
                      <Download className="mr-2 size-4" aria-hidden="true" />
                      {copy.downloadMmd}
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
                    aria-label={copy.editorAria}
                  />
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
                  >
                    <div className="flex items-center gap-2 font-medium text-destructive">
                      <ShieldAlert className="size-4" aria-hidden="true" />
                      {copy.renderFailed}
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
                        {copy.rerender}
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
                          {copy.restore}
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
                    {copy.valid}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {copy.waiting}
                  </div>
                )}
              </section>

              <section className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">
                      {copy.previewTitle}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {copy.previewDescription}
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
                          aria-label={copy.zoomOut}
                        >
                          <ZoomOut className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copy.zoomOut}</TooltipContent>
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
                          aria-label={copy.zoomIn}
                        >
                          <ZoomIn className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copy.zoomIn}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-9"
                          onClick={() => setPreviewOpen(true)}
                          aria-label={copy.fullscreen}
                        >
                          <Maximize2 className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copy.fullscreen}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {preview}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopy(lastValidSvg, copy.renderedSvgCopied)}
                    disabled={!canExport}
                  >
                    <Copy className="mr-2 size-4" aria-hidden="true" />
                    {copy.copySvg}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadSvg}
                    disabled={!canExport}
                  >
                    <Download className="mr-2 size-4" aria-hidden="true" />
                    {copy.downloadSvg}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDownloadPng}
                    disabled={!canExport}
                  >
                    <ImageDown className="mr-2 size-4" aria-hidden="true" />
                    {copy.exportPng}
                  </Button>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.helpTitle}</CardTitle>
            <CardDescription>{copy.helpDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
            {copy.helpCards.map(item => (
              <div key={item.title} className="rounded-lg border p-4">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <p className="mt-2 leading-6">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="flex h-[92vh] max-w-[96vw] grid-rows-[auto_minmax(0,1fr)_auto] flex-col overflow-hidden p-4 sm:rounded-lg sm:p-6">
            <DialogHeader>
              <DialogTitle>{copy.fullscreenTitle}</DialogTitle>
              <DialogDescription>{copy.fullscreenDescription}</DialogDescription>
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
                  {copy.zoomOut}
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
                  {copy.zoomIn}
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
                  {copy.downloadSvg}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDownloadPng}
                  disabled={!canExport}
                >
                  {copy.exportPng}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
