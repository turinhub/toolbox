"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Copy,
  FileJson,
  Check,
  X,
  Download,
  Upload,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function JsonFormatterPage() {
  // JSON 状态
  const [jsonInput, setJsonInput] = useState("");
  const [formattedJson, setFormattedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [indentSize, setIndentSize] = useState(2);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"raw" | "tree">("raw");
  const [parsedData, setParsedData] = useState<unknown>(null);

  // 实时格式化
  useEffect(() => {
    if (isRealTimeEnabled && jsonInput.trim()) {
      const timeoutId = setTimeout(() => {
        formatJson(false);
      }, 500); // 500ms 防抖

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonInput, indentSize, isRealTimeEnabled]);

  // 格式化 JSON
  const formatJson = (showToast = true) => {
    try {
      if (!jsonInput.trim()) {
        setFormattedJson("");
        setJsonError(null);
        setParsedData(null);
        return;
      }

      const parsedJson = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsedJson, null, indentSize);
      setFormattedJson(formatted);
      setParsedData(parsedJson);
      setJsonError(null);
      if (showToast) {
        toast.success("JSON 格式化成功");
      }
    } catch (error) {
      setJsonError((error as Error).message);
      setFormattedJson("");
      setParsedData(null);
      if (showToast) {
        toast.error("JSON 格式错误");
      }
    }
  };

  // 压缩 JSON
  const minifyJson = () => {
    try {
      if (!jsonInput.trim()) {
        setFormattedJson("");
        setJsonError(null);
        return;
      }

      const parsedJson = JSON.parse(jsonInput);
      const minified = JSON.stringify(parsedJson);
      setFormattedJson(minified);
      setJsonError(null);
      toast.success("JSON 压缩成功");
    } catch (error) {
      setJsonError((error as Error).message);
      setFormattedJson("");
      toast.error("JSON 格式错误");
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板", {
      description: "内容已成功复制到剪贴板",
    });
  };

  // 下载 JSON 文件
  const downloadJson = () => {
    if (!formattedJson) return;

    const blob = new Blob([formattedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("文件下载成功");
  };

  // 上传 JSON 文件
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setJsonInput(content);
      toast.success("文件上传成功");
    };
    reader.readAsText(file);
  };

  // 重置编辑器
  const resetEditor = () => {
    setJsonInput("");
    setFormattedJson("");
    setJsonError(null);
    setParsedData(null);
    toast.success("编辑器已重置");
  };

  // 渲染树形视图
  const renderTreeView = (data: unknown, level = 0): React.ReactNode => {
    if (data === null) return <span className="text-gray-500">null</span>;
    if (data === undefined)
      return <span className="text-gray-500">undefined</span>;

    if (typeof data === "string") {
      return <span className="text-green-600">&quot;{data}&quot;</span>;
    }

    if (typeof data === "number") {
      return <span className="text-blue-600">{data}</span>;
    }

    if (typeof data === "boolean") {
      return <span className="text-purple-600">{data.toString()}</span>;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return <span>[]</span>;

      return (
        <div>
          <span>[</span>
          <div className="ml-4">
            {data.map((item, index) => (
              <div key={index} className="font-mono text-sm">
                {renderTreeView(item, level + 1)}
                {index < data.length - 1 && <span>,</span>}
              </div>
            ))}
          </div>
          <span>]</span>
        </div>
      );
    }

    if (typeof data === "object" && data !== null) {
      const keys = Object.keys(data as Record<string, unknown>);
      if (keys.length === 0) return <span>{"{}"}</span>;

      return (
        <div>
          <span>{"{"}</span>
          <div className="ml-4">
            {keys.map((key, index) => (
              <div key={key} className="font-mono text-sm">
                <span className="text-red-600">&quot;{key}&quot;</span>
                <span>: </span>
                {renderTreeView(
                  (data as Record<string, unknown>)[key],
                  level + 1
                )}
                {index < keys.length - 1 && <span>,</span>}
              </div>
            ))}
          </div>
          <span>{"}"}</span>
        </div>
      );
    }

    return <span>{String(data)}</span>;
  };

  // 示例 JSON 数据
  const loadExample = () => {
    const exampleJson = {
      name: "张三",
      age: 30,
      isActive: true,
      address: {
        street: "北京市朝阳区",
        city: "北京",
        zipCode: "100000",
      },
      hobbies: ["阅读", "游泳", "编程"],
      contact: {
        email: "zhangsan@example.com",
        phone: "+86 138-0013-8000",
      },
      metadata: null,
    };

    setJsonInput(JSON.stringify(exampleJson, null, 2));
    toast.success("示例数据已加载");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">JSON 格式化工具</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          格式化、验证和美化 JSON 数据，支持实时渲染和树形视图
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            JSON 格式化与编辑器
          </CardTitle>
          <CardDescription>
            粘贴 JSON 数据进行格式化、验证和美化，支持实时预览和树形视图
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 控制面板 */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="realtime"
                checked={isRealTimeEnabled}
                onCheckedChange={setIsRealTimeEnabled}
              />
              <Label htmlFor="realtime" className="text-xs sm:text-sm">
                实时渲染
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm">缩进大小:</span>
              <Tabs
                value={indentSize.toString()}
                onValueChange={value => setIndentSize(parseInt(value))}
                className="w-auto"
              >
                <TabsList className="h-8 sm:h-9">
                  <TabsTrigger
                    value="2"
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    2
                  </TabsTrigger>
                  <TabsTrigger
                    value="4"
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    4
                  </TabsTrigger>
                  <TabsTrigger
                    value="8"
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    8
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Button
              onClick={loadExample}
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              加载示例
            </Button>

            <Button
              onClick={resetEditor}
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              <RotateCcw className="h-3 h-3 sm:h-4 sm:w-4 mr-1" />
              重置
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* 输入区域 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">输入 JSON</div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setJsonInput("");
                      setFormattedJson("");
                      setJsonError(null);
                      setParsedData(null);
                    }}
                  >
                    清空
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-1" />
                      上传
                    </Button>
                  </div>
                </div>
              </div>
              <Textarea
                placeholder="在此粘贴 JSON 数据..."
                value={jsonInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setJsonInput(e.target.value)
                }
                className={`min-h-[400px] font-mono text-sm ${
                  jsonError ? "border-destructive" : ""
                }`}
              />
              {jsonError && (
                <div className="text-destructive text-sm flex items-center gap-1">
                  <X className="h-4 w-4" />
                  {jsonError}
                </div>
              )}
              {!jsonError && parsedData !== null && (
                <div className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  JSON 格式有效
                </div>
              )}
            </div>

            {/* 输出区域 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">格式化结果</div>
                <div className="flex space-x-2">
                  <Tabs
                    value={viewMode}
                    onValueChange={(value: string) =>
                      setViewMode(value as "raw" | "tree")
                    }
                    className="w-auto"
                  >
                    <TabsList>
                      <TabsTrigger value="raw">
                        <EyeOff className="h-4 w-4 mr-1" />
                        原始
                      </TabsTrigger>
                      <TabsTrigger value="tree">
                        <Eye className="h-4 w-4 mr-1" />
                        树形
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {formattedJson && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formattedJson)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadJson}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        下载
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="min-h-[400px] p-4 border rounded-md bg-muted/50">
                {viewMode === "tree" && parsedData !== null ? (
                  <div className="font-mono text-sm overflow-auto">
                    {renderTreeView(parsedData)}
                  </div>
                ) : viewMode === "raw" && formattedJson ? (
                  <pre className="font-mono text-sm overflow-auto whitespace-pre-wrap">
                    {formattedJson}
                  </pre>
                ) : (
                  <div className="text-muted-foreground text-center py-20">
                    {jsonError
                      ? "JSON 格式错误，请检查输入"
                      : "在左侧输入 JSON 数据以查看预览"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => formatJson(true)}
              className="min-w-[120px]"
              disabled={isRealTimeEnabled}
            >
              <Save className="h-4 w-4 mr-1" />
              格式化
            </Button>
            <Button
              onClick={minifyJson}
              variant="outline"
              className="min-w-[120px]"
            >
              压缩
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
