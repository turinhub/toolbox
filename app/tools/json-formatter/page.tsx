"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, FileJson, Check, X, Download, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JsonFormatterPage() {
  // JSON 状态
  const [jsonInput, setJsonInput] = useState("");
  const [formattedJson, setFormattedJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [indentSize, setIndentSize] = useState(2);

  // 格式化 JSON
  const formatJson = () => {
    try {
      if (!jsonInput.trim()) {
        setFormattedJson("");
        setJsonError(null);
        return;
      }

      const parsedJson = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsedJson, null, indentSize);
      setFormattedJson(formatted);
      setJsonError(null);
      toast.success("JSON 格式化成功");
    } catch (error) {
      setJsonError((error as Error).message);
      setFormattedJson("");
      toast.error("JSON 格式错误");
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
      description: '内容已成功复制到剪贴板'
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
  };

  // 上传 JSON 文件
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">JSON 格式化工具</h1>
        <p className="text-muted-foreground">
          格式化、验证和美化 JSON 数据
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            JSON 格式化
          </CardTitle>
          <CardDescription>
            粘贴 JSON 数据进行格式化、验证和美化
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
                className={`min-h-[300px] font-mono text-sm ${
                  jsonError ? "border-destructive" : ""
                }`}
              />
              {jsonError && (
                <div className="text-destructive text-sm flex items-center gap-1">
                  <X className="h-4 w-4" />
                  {jsonError}
                </div>
              )}
            </div>

            {/* 输出区域 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">格式化结果</div>
                <div className="flex space-x-2">
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
              <Textarea
                value={formattedJson}
                readOnly
                className="min-h-[300px] font-mono text-sm bg-muted"
              />
              {!jsonError && formattedJson && (
                <div className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  JSON 格式有效
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm">缩进大小:</span>
              <Tabs
                value={indentSize.toString()}
                onValueChange={(value) => setIndentSize(parseInt(value))}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="2">2</TabsTrigger>
                  <TabsTrigger value="4">4</TabsTrigger>
                  <TabsTrigger value="8">8</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button onClick={formatJson} className="min-w-[120px]">
              格式化
            </Button>
            <Button onClick={minifyJson} variant="outline" className="min-w-[120px]">
              压缩
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
