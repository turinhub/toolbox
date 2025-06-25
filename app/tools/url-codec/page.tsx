"use client";

import { useState } from "react";
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
import { Copy, Link2, ArrowRight, Lock, Unlock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// 常见的 URL 编码示例
const urlExamples = [
  {
    title: "基本 URL",
    raw: "https://example.com/path?name=John Doe&age=25",
    encoded: "https://example.com/path?name=John%20Doe&age=25",
    description: "包含空格和基本参数的 URL",
  },
  {
    title: "特殊字符",
    raw: "https://example.com/search?q=C++ Programming&category=编程",
    encoded:
      "https://example.com/search?q=C%2B%2B%20Programming&category=%E7%BC%96%E7%A8%8B",
    description: "包含加号、空格和中文字符的 URL",
  },
  {
    title: "复杂查询参数",
    raw: 'https://example.com/api?filter={"name":"John","age":30}',
    encoded:
      "https://example.com/api?filter=%7B%22name%22%3A%22John%22%2C%22age%22%3A30%7D",
    description: "包含 JSON 数据的 URL",
  },
];

export default function UrlCodecPage() {
  // 状态
  const [encodeMode, setEncodeMode] = useState(true);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [encodeComponents, setEncodeComponents] = useState(true);
  const [preserveSpecialChars, setPreserveSpecialChars] = useState(true);

  // 编码 URL
  const encodeUrl = () => {
    if (!input.trim()) {
      toast.error("请输入要编码的 URL");
      return;
    }

    try {
      let encoded;
      if (encodeComponents) {
        // 使用 encodeURIComponent 编码整个字符串
        encoded = encodeURIComponent(input);

        // 如果需要保留特殊字符
        if (preserveSpecialChars) {
          // 还原一些特殊字符
          encoded = encoded
            .replace(/%3A/g, ":")
            .replace(/%2F/g, "/")
            .replace(/%3F/g, "?")
            .replace(/%3D/g, "=")
            .replace(/%26/g, "&")
            .replace(/%23/g, "#");
        }
      } else {
        // 使用 encodeURI 编码整个 URL
        encoded = encodeURI(input);
      }

      setOutput(encoded);
      toast.success("URL 编码成功");
    } catch (error) {
      console.error(error);
      toast.error(`URL 编码失败: ${(error as Error).message}`);
    }
  };

  // 解码 URL
  const decodeUrl = () => {
    if (!input.trim()) {
      toast.error("请输入要解码的 URL");
      return;
    }

    try {
      let decoded;
      if (encodeComponents) {
        // 使用 decodeURIComponent 解码
        decoded = decodeURIComponent(input);
      } else {
        // 使用 decodeURI 解码
        decoded = decodeURI(input);
      }

      setOutput(decoded);
      toast.success("URL 解码成功");
    } catch (error) {
      console.error(error);
      toast.error(`URL 解码失败: ${(error as Error).message}`);
    }
  };

  // 处理 URL
  const processUrl = () => {
    if (encodeMode) {
      encodeUrl();
    } else {
      decodeUrl();
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  // 使用示例
  const applyExample = (example: (typeof urlExamples)[0]) => {
    if (encodeMode) {
      setInput(example.raw);
      setOutput(example.encoded);
    } else {
      setInput(example.encoded);
      setOutput(example.raw);
    }
  };

  // 交换输入和输出
  const swapInputOutput = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
    toast.success("已交换输入和输出");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">URL 编解码工具</h1>
        <p className="text-muted-foreground">URL 编码和解码转换工具</p>
      </div>

      <div className="flex justify-center mb-4">
        <Tabs
          value={encodeMode ? "encode" : "decode"}
          onValueChange={value => {
            setEncodeMode(value === "encode");
            setInput("");
            setOutput("");
          }}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              编码
            </TabsTrigger>
            <TabsTrigger value="decode" className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              解码
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {encodeMode ? "原始 URL" : "编码后的 URL"}
              </CardTitle>
              <CardDescription>
                {encodeMode ? "输入要编码的 URL" : "输入要解码的 URL"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  encodeMode
                    ? "https://example.com/path?name=John Doe"
                    : "https://example.com/path?name=John%20Doe"
                }
                className="font-mono text-sm min-h-[150px]"
              />
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("")}
                  disabled={!input}
                >
                  清空
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(input)}
                  disabled={!input}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  复制
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>编码选项</CardTitle>
              <CardDescription>配置 URL 编解码的选项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="encode-components"
                  checked={encodeComponents}
                  onCheckedChange={setEncodeComponents}
                />
                <Label htmlFor="encode-components">
                  {encodeMode
                    ? "使用 encodeURIComponent"
                    : "使用 decodeURIComponent"}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {encodeComponents
                  ? "编码所有字符，包括 URL 分隔符（如 /, :, &）"
                  : "仅编码不允许在 URL 中出现的字符"}
              </p>

              {encodeMode && encodeComponents && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="preserve-special"
                    checked={preserveSpecialChars}
                    onCheckedChange={setPreserveSpecialChars}
                  />
                  <Label htmlFor="preserve-special">保留 URL 特殊字符</Label>
                </div>
              )}

              <Button onClick={processUrl} className="w-full">
                {encodeMode ? "编码 URL" : "解码 URL"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {encodeMode ? "编码后的 URL" : "解码后的 URL"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={swapInputOutput}
                  disabled={!output}
                  title="交换输入和输出"
                >
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </Button>
              </div>
              <CardDescription>
                {encodeMode ? "编码结果" : "解码结果"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={output}
                readOnly
                className="font-mono text-sm min-h-[150px] bg-muted"
              />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(output)}
                  disabled={!output}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  复制结果
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>常见示例</CardTitle>
              <CardDescription>点击使用预设的 URL 示例</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {urlExamples.map((example, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => applyExample(example)}
                  >
                    <div className="font-medium mb-1">{example.title}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {example.description}
                    </div>
                    <div className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                      {encodeMode ? example.raw : example.encoded}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
