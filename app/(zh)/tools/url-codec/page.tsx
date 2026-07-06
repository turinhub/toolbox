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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

function getUrlExamples(isEnglish: boolean) {
  return isEnglish
    ? [
        {
          title: "Basic URL",
          raw: "https://example.com/path?name=John Doe&age=25",
          encoded: "https://example.com/path?name=John%20Doe&age=25",
          description: "A URL with spaces and basic parameters",
        },
        {
          title: "Special characters",
          raw: "https://example.com/search?q=C++ Programming&category=dev tools",
          encoded:
            "https://example.com/search?q=C%2B%2B%20Programming&category=dev%20tools",
          description: "A URL with plus signs, spaces, and special characters",
        },
        {
          title: "Complex query parameter",
          raw: 'https://example.com/api?filter={"name":"John","age":30}',
          encoded:
            "https://example.com/api?filter=%7B%22name%22%3A%22John%22%2C%22age%22%3A30%7D",
          description: "A URL that contains JSON data",
        },
      ]
    : [
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
}

export default function UrlCodecPage() {
  const isEnglish = useLocale() === englishLocale;
  const urlExamples = getUrlExamples(isEnglish);
  const copy = isEnglish
    ? {
        encode: "Encode",
        decode: "Decode",
        rawUrl: "Original URL",
        encodedUrl: "Encoded URL",
        decodedUrl: "Decoded URL",
        inputEncode: "Enter a URL to encode",
        inputDecode: "Enter a URL to decode",
        clear: "Clear",
        copy: "Copy",
        copyResult: "Copy result",
        options: "Encoding options",
        optionsDescription: "Configure URL encoding and decoding options",
        preserve: "Preserve URL special characters",
        multiple: "Repeated decoding",
        encodeAll:
          "Encode every character, including URL separators like /, :, &",
        encodeBasic: "Only encode characters that are not allowed in URLs",
        decodeAll: "Decode every character, including URL separators",
        decodeBasic: "Only decode basic URL characters",
        repeated:
          "Decode repeatedly until no encoded characters remain. Useful for URLs encoded more than once.",
        once: "Decode only once",
        encodeUrl: "Encode URL",
        decodeUrl: "Decode URL",
        outputEncode: "Encoded result",
        outputDecode: "Decoded result",
        swap: "Swap input and output",
        examples: "Common examples",
        examplesDescription: "Click a preset URL example to use it.",
        emptyEncode: "Enter a URL to encode",
        emptyDecode: "Enter a URL to decode",
        encodeSuccess: "URL encoded",
        decodeSuccess: "URL decoded",
        encodeFailed: "URL encoding failed",
        decodeFailed: "URL decoding failed",
        copied: "Copied to clipboard",
        swapped: "Input and output swapped",
      }
    : {
        encode: "编码",
        decode: "解码",
        rawUrl: "原始 URL",
        encodedUrl: "编码后的 URL",
        decodedUrl: "解码后的 URL",
        inputEncode: "输入要编码的 URL",
        inputDecode: "输入要解码的 URL",
        clear: "清空",
        copy: "复制",
        copyResult: "复制结果",
        options: "编码选项",
        optionsDescription: "配置 URL 编解码的选项",
        preserve: "保留 URL 特殊字符",
        multiple: "多重解码",
        encodeAll: "编码所有字符，包括 URL 分隔符（如 /, :, &）",
        encodeBasic: "仅编码不允许在 URL 中出现的字符",
        decodeAll: "解码所有字符，包括 URL 分隔符",
        decodeBasic: "仅解码基本的 URL 字符",
        repeated: "循环解码直到没有更多编码字符（适用于多次编码的 URL）",
        once: "仅解码一次",
        encodeUrl: "编码 URL",
        decodeUrl: "解码 URL",
        outputEncode: "编码结果",
        outputDecode: "解码结果",
        swap: "交换输入和输出",
        examples: "常见示例",
        examplesDescription: "点击使用预设的 URL 示例",
        emptyEncode: "请输入要编码的 URL",
        emptyDecode: "请输入要解码的 URL",
        encodeSuccess: "URL 编码成功",
        decodeSuccess: "URL 解码成功",
        encodeFailed: "URL 编码失败",
        decodeFailed: "URL 解码失败",
        copied: "已复制到剪贴板",
        swapped: "已交换输入和输出",
      };
  // 状态
  const [encodeMode, setEncodeMode] = useState(true);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [encodeComponents, setEncodeComponents] = useState(true);
  const [preserveSpecialChars, setPreserveSpecialChars] = useState(true);
  const [multipleDecoding, setMultipleDecoding] = useState(false);

  // 编码 URL
  const encodeUrl = () => {
    if (!input.trim()) {
      toast.error(copy.emptyEncode);
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
      toast.success(copy.encodeSuccess);
    } catch (error) {
      console.error(error);
      toast.error(`${copy.encodeFailed}: ${(error as Error).message}`);
    }
  };

  // 解码 URL
  const decodeUrl = () => {
    if (!input.trim()) {
      toast.error(copy.emptyDecode);
      return;
    }

    try {
      let decoded = input;

      if (multipleDecoding) {
        // 多重解码：循环解码直到没有更多编码字符
        let previousDecoded = "";
        while (decoded !== previousDecoded) {
          previousDecoded = decoded;
          try {
            if (encodeComponents) {
              decoded = decodeURIComponent(decoded);
            } else {
              decoded = decodeURI(decoded);
            }
          } catch {
            // 如果解码失败，停止循环
            break;
          }
        }
      } else {
        // 单次解码
        if (encodeComponents) {
          decoded = decodeURIComponent(decoded);
        } else {
          decoded = decodeURI(decoded);
        }
      }

      setOutput(decoded);
      toast.success(copy.decodeSuccess);
    } catch (error) {
      console.error(error);
      toast.error(`${copy.decodeFailed}: ${(error as Error).message}`);
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
    toast.success(copy.copied);
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
    toast.success(copy.swapped);
  };

  return (
    <div className="flex flex-col gap-8">
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
              {copy.encode}
            </TabsTrigger>
            <TabsTrigger value="decode" className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              {copy.decode}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {encodeMode ? copy.rawUrl : copy.encodedUrl}
              </CardTitle>
              <CardDescription>
                {encodeMode ? copy.inputEncode : copy.inputDecode}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                  {copy.clear}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(input)}
                  disabled={!input}
                >
                  <Copy data-icon="inline-start" />
                  {copy.copy}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.options}</CardTitle>
              <CardDescription>{copy.optionsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
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
                {encodeMode
                  ? encodeComponents
                    ? copy.encodeAll
                    : copy.encodeBasic
                  : encodeComponents
                    ? copy.decodeAll
                    : copy.decodeBasic}
              </p>

              {encodeMode && encodeComponents && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="preserve-special"
                    checked={preserveSpecialChars}
                    onCheckedChange={setPreserveSpecialChars}
                  />
                  <Label htmlFor="preserve-special">{copy.preserve}</Label>
                </div>
              )}

              {!encodeMode && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="multiple-decoding"
                    checked={multipleDecoding}
                    onCheckedChange={setMultipleDecoding}
                  />
                  <Label htmlFor="multiple-decoding">{copy.multiple}</Label>
                </div>
              )}

              {!encodeMode && (
                <p className="text-xs text-muted-foreground">
                  {multipleDecoding ? copy.repeated : copy.once}
                </p>
              )}

              <Button onClick={processUrl} className="w-full">
                {encodeMode ? copy.encodeUrl : copy.decodeUrl}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {encodeMode ? copy.encodedUrl : copy.decodedUrl}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={swapInputOutput}
                  disabled={!output}
                  aria-label={copy.swap}
                >
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </Button>
              </div>
              <CardDescription>
                {encodeMode ? copy.outputEncode : copy.outputDecode}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                  <Copy data-icon="inline-start" />
                  {copy.copyResult}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.examples}</CardTitle>
              <CardDescription>{copy.examplesDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
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
