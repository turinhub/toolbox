"use client";

import { useState, useRef, ChangeEvent } from "react";
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
  FileText,
  ArrowRight,
  Lock,
  Unlock,
  Upload,
  Download,
  FileUp,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocale, useTranslations } from "next-intl";
import { englishLocale } from "@/i18n/config";

function getBase64Examples(locale: string) {
  if (locale === englishLocale) {
    return [
      {
        title: "Basic text",
        raw: "Hello, World!",
        encoded: "SGVsbG8sIFdvcmxkIQ==",
        description: "A simple English text string",
      },
      {
        title: "Unicode text",
        raw: "Hello, 世界!",
        encoded: "SGVsbG8sIOS4lueVjCE=",
        description: "Text that includes Unicode characters",
      },
      {
        title: "JSON data",
        raw: '{"name":"Alex","age":30,"city":"San Francisco"}',
        encoded:
          "eyJuYW1lIjoiQWxleCIsImFnZSI6MzAsImNpdHkiOiJTYW4gRnJhbmNpc2NvIn0=",
        description: "A JSON data payload",
      },
    ];
  }

  return [
    {
      title: "基本文本",
      raw: "Hello, World!",
      encoded: "SGVsbG8sIFdvcmxkIQ==",
      description: "简单的英文文本",
    },
    {
      title: "中文文本",
      raw: "你好，世界！",
      encoded: "5L2g5aW977yM5LiW55WM77yB",
      description: "包含中文字符的文本",
    },
    {
      title: "JSON 数据",
      raw: '{"name":"张三","age":30,"city":"北京"}',
      encoded: "eyJuYW1lIjoi5byg5LiJIiwiYWdlIjozMCwiY2l0eSI6IuWMl+S6rCJ9",
      description: "JSON 格式的数据",
    },
  ];
}

export default function Base64Page() {
  const t = useTranslations("base64");
  const locale = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  });
  const base64Examples = getBase64Examples(locale);
  // 状态
  const [encodeMode, setEncodeMode] = useState(true);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 编码文本
  const encodeBase64 = () => {
    if (!input.trim()) {
      toast.error(t("emptyEncode"));
      return;
    }

    try {
      // 将文本转换为 Base64
      const encoded = window.btoa(unescape(encodeURIComponent(input)));

      // 如果需要 URL 安全的 Base64
      const result = urlSafe
        ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
        : encoded;

      setOutput(result);
      toast.success(t("encodeSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("encodeFailed", { message: (error as Error).message }));
    }
  };

  // 解码 Base64
  const decodeBase64 = () => {
    if (!input.trim()) {
      toast.error(t("emptyDecode"));
      return;
    }

    try {
      // 如果是 URL 安全的 Base64，先转换回标准 Base64
      let base64 = input;
      if (urlSafe) {
        base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
        // 添加回等号填充
        while (base64.length % 4) {
          base64 += "=";
        }
      }

      // 解码 Base64
      const decoded = decodeURIComponent(escape(window.atob(base64)));
      setOutput(decoded);
      toast.success(t("decodeSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("decodeFailed", { message: (error as Error).message }));
    }
  };

  // 处理 Base64
  const processBase64 = () => {
    if (encodeMode) {
      encodeBase64();
    } else {
      decodeBase64();
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copySuccess"));
  };

  // 使用示例
  const applyExample = (example: (typeof base64Examples)[0]) => {
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
    toast.success(t("swapped"));
  };

  // 处理文件上传
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || t("unknownType"));

    const reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        // 获取 Base64 字符串，去掉前缀 (data:image/jpeg;base64,)
        const base64String = (event.target.result as string).split(",")[1];

        if (encodeMode) {
          setOutput(
            urlSafe
              ? base64String
                  .replace(/\+/g, "-")
                  .replace(/\//g, "_")
                  .replace(/=+$/, "")
              : base64String
          );
        }

        toast.success(t("fileConverted"));
      }
    };
    reader.onerror = () => {
      toast.error(t("fileReadFailed"));
    };
    reader.readAsDataURL(file);
  };

  // 下载 Base64 解码后的文件
  const downloadDecodedFile = () => {
    if (!input.trim()) {
      toast.error(t("emptyDecode"));
      return;
    }

    try {
      // 如果是 URL 安全的 Base64，先转换回标准 Base64
      let base64 = input;
      if (urlSafe) {
        base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
        // 添加回等号填充
        while (base64.length % 4) {
          base64 += "=";
        }
      }

      // 创建 Blob 对象
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "decoded_file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("fileDownloaded"));
    } catch (error) {
      console.error(error);
      toast.error(t("decodeFailed", { message: (error as Error).message }));
    }
  };

  // 清空文件
  const clearFile = () => {
    setFileName("");
    setFileSize(0);
    setFileType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            clearFile();
          }}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="encode"
              className="flex items-center gap-2 min-h-[44px]"
            >
              <Lock className="h-4 w-4" />
              {t("encode")}
            </TabsTrigger>
            <TabsTrigger
              value="decode"
              className="flex items-center gap-2 min-h-[44px]"
            >
              <Unlock className="h-4 w-4" />
              {t("decode")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {encodeMode ? t("sourceText") : t("encodedText")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    title={
                      showFileUpload ? t("switchToText") : t("switchToFile")
                    }
                    className="min-h-[44px] min-w-[44px]"
                  >
                    {showFileUpload ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <FileUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <CardDescription>
                {encodeMode
                  ? showFileUpload
                    ? t("uploadEncodeFile")
                    : t("inputEncodeText")
                  : showFileUpload
                    ? t("uploadDecodeFile")
                    : t("inputDecodeText")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {showFileUpload ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50"
                    >
                      <div className="flex flex-col items-center justify-center pt-4 pb-3 sm:pt-5 sm:pb-6">
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-muted-foreground" />
                        <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-muted-foreground">
                          <span className="font-semibold">
                            {t("clickUpload")}
                          </span>{" "}
                          {t("dragDrop")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {encodeMode ? t("anyFile") : t("base64TextFile")}
                        </p>
                      </div>
                      <Input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>

                  {fileName && (
                    <div className="p-3 border rounded-md bg-muted/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {fileType} ·{" "}
                            {numberFormatter.format(fileSize / 1024)} KB
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearFile}>
                          {t("clear")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={
                      encodeMode ? t("inputEncodeText") : t("inputDecodeText")
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
                      {t("clearInput")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(input)}
                      disabled={!input}
                    >
                      <Copy data-icon="inline-start" />
                      {t("copy")}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("encodeOptions")}</CardTitle>
              <CardDescription>{t("optionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="url-safe"
                  checked={urlSafe}
                  onCheckedChange={setUrlSafe}
                />
                <Label htmlFor="url-safe">{t("urlSafe")}</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("urlSafeDescription")}
              </p>

              <div className="flex gap-2">
                <Button onClick={processBase64} className="flex-1">
                  {encodeMode ? t("encode") : t("decode")}
                </Button>

                {!encodeMode && !showFileUpload && (
                  <Button
                    variant="outline"
                    onClick={downloadDecodedFile}
                    disabled={!input}
                    title={t("downloadDecoded")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {encodeMode ? t("encodedText") : t("decodedResult")}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={swapInputOutput}
                  disabled={!output || showFileUpload}
                  aria-label={t("swapped")}
                >
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </Button>
              </div>
              <CardDescription>
                {encodeMode ? t("resultDescription") : t("decodedResult")}
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
                  {t("copyResult")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("examplesTitle")}</CardTitle>
              <CardDescription>{t("examplesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {base64Examples.map((example, index) => (
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
