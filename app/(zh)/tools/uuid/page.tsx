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
import { toast } from "sonner";
import { Copy, RefreshCw, Settings, Fingerprint } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

// UUID 版本选项
const uuidVersions = [
  { value: "v4", label: "UUID v4 (随机)" },
  { value: "v1", label: "UUID v1 (时间戳)" },
  { value: "custom", label: "自定义随机 ID" },
];

// 自定义 ID 字符集选项
const charsetOptions = [
  {
    value: "alphanumeric",
    label: "字母数字 (a-z, A-Z, 0-9)",
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  },
  {
    value: "alpha",
    label: "仅字母 (a-z, A-Z)",
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  },
  {
    value: "lowercase",
    label: "小写字母 (a-z)",
    chars: "abcdefghijklmnopqrstuvwxyz",
  },
  {
    value: "uppercase",
    label: "大写字母 (A-Z)",
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  },
  { value: "numeric", label: "仅数字 (0-9)", chars: "0123456789" },
  { value: "hex", label: "十六进制 (0-9, a-f)", chars: "0123456789abcdef" },
  {
    value: "base58",
    label: "Base58 (比特币格式)",
    chars: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  },
];

// 格式化选项
const formatOptions = [
  {
    value: "standard",
    label: "标准格式",
    example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  },
  {
    value: "compact",
    label: "紧凑格式",
    example: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  {
    value: "braces",
    label: "带括号",
    example: "{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}",
  },
  { value: "base64", label: "Base64", example: "Base64 编码的 UUID" },
];

export default function UuidGeneratorPage() {
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        optionsTitle: "Generation options",
        optionsDescription: "Configure UUID and random ID generation options.",
        type: "UUID type",
        outputFormat: "Output format",
        example: "Example:",
        quantity: "Quantity",
        length: "ID length",
        charset: "Character set",
        special: "Include special characters",
        autoRefresh: "Auto refresh every 5 seconds",
        generate: "Generate",
        ids: "IDs",
        resultTitle: "Generated results",
        copyAll: "Copy all",
        empty: "Click Generate to create IDs",
        randomId: "random ID",
        generated: "Generated {count} {type}",
        toastGenerated: "Generated {count} IDs",
        copied: "Copied to clipboard",
        copiedAll: "Copied all IDs to clipboard",
        versions: [
          { value: "v4", label: "UUID v4 (random)" },
          { value: "v1", label: "UUID v1 (timestamp)" },
          { value: "custom", label: "Custom random ID" },
        ],
        charsets: [
          {
            value: "alphanumeric",
            label: "Alphanumeric (a-z, A-Z, 0-9)",
          },
          { value: "alpha", label: "Letters only (a-z, A-Z)" },
          { value: "lowercase", label: "Lowercase letters (a-z)" },
          { value: "uppercase", label: "Uppercase letters (A-Z)" },
          { value: "numeric", label: "Numbers only (0-9)" },
          { value: "hex", label: "Hexadecimal (0-9, a-f)" },
          { value: "base58", label: "Base58 (Bitcoin style)" },
        ],
        formats: [
          {
            value: "standard",
            label: "Standard",
            example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
          },
          {
            value: "compact",
            label: "Compact",
            example: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          },
          {
            value: "braces",
            label: "With braces",
            example: "{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}",
          },
          { value: "base64", label: "Base64", example: "Base64 encoded UUID" },
        ],
      }
    : {
        optionsTitle: "生成选项",
        optionsDescription: "配置 UUID 生成的各种选项",
        type: "UUID 类型",
        outputFormat: "输出格式",
        example: "示例:",
        quantity: "生成数量",
        length: "ID 长度",
        charset: "字符集",
        special: "包含特殊字符",
        autoRefresh: "每 5 秒自动刷新",
        generate: "生成",
        ids: "个",
        resultTitle: "生成结果",
        copyAll: "复制全部",
        empty: "点击生成按钮创建 ID",
        randomId: "随机 ID",
        generated: "已生成 {count} 个 {type}",
        toastGenerated: "已生成 {count} 个 ID",
        copied: "已复制到剪贴板",
        copiedAll: "已复制所有 ID 到剪贴板",
        versions: uuidVersions,
        charsets: charsetOptions.map(({ value, label }) => ({ value, label })),
        formats: formatOptions,
      };
  // 状态
  const [uuidVersion, setUuidVersion] = useState("v4");
  const [format, setFormat] = useState("standard");
  const [quantity, setQuantity] = useState(1);
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [customLength, setCustomLength] = useState(16);
  const [selectedCharset, setSelectedCharset] = useState("alphanumeric");
  const [includeSpecialChars, setIncludeSpecialChars] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 生成 UUID v4
  const generateUUIDv4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // 生成 UUID v1 (基于时间戳的简化版本)
  const generateUUIDv1 = () => {
    const now = new Date();
    const timestamp = now.getTime();
    const timeLow = timestamp & 0xffffffff;
    const timeMid = (timestamp >> 32) & 0xffff;
    const timeHigh = ((timestamp >> 48) & 0x0fff) | 0x1000;

    const clockSeq = (Math.random() * 0x3fff) | 0x8000;
    const node = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256)
    )
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return [
      timeLow.toString(16).padStart(8, "0"),
      timeMid.toString(16).padStart(4, "0"),
      timeHigh.toString(16).padStart(4, "0"),
      clockSeq.toString(16).padStart(4, "0"),
      node,
    ].join("-");
  };

  // 生成自定义随机 ID
  const generateCustomId = (length: number, charset: string) => {
    let chars = charset;
    if (includeSpecialChars) {
      chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    }

    let result = "";
    const charactersLength = chars.length;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  // 格式化 UUID
  const formatUUID = (uuid: string, formatType: string) => {
    const compact = uuid.replace(/-/g, "");

    switch (formatType) {
      case "standard":
        return uuid;
      case "compact":
        return compact;
      case "braces":
        return `{${uuid}}`;
      case "base64":
        return btoa(compact);
      default:
        return uuid;
    }
  };

  // 生成 UUID
  const generateIds = (showToast = true) => {
    const newIds = [];

    for (let i = 0; i < quantity; i++) {
      let rawId = "";

      if (uuidVersion === "v4") {
        rawId = generateUUIDv4();
      } else if (uuidVersion === "v1") {
        rawId = generateUUIDv1();
      } else if (uuidVersion === "custom") {
        const charset =
          charsetOptions.find(opt => opt.value === selectedCharset)?.chars ||
          "";
        rawId = generateCustomId(customLength, charset);
      }

      newIds.push(formatUUID(rawId, format));
    }

    setGeneratedIds(newIds);
    if (newIds.length > 0 && showToast) {
      toast.success(
        copy.toastGenerated.replace("{count}", String(newIds.length))
      );
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(copy.copied);
  };

  // 复制所有 ID
  const copyAllIds = () => {
    const allText = generatedIds.join("\n");
    navigator.clipboard.writeText(allText);
    toast.success(copy.copiedAll);
  };

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(generateIds, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoRefresh,
    uuidVersion,
    format,
    quantity,
    customLength,
    selectedCharset,
    includeSpecialChars,
  ]);

  // 初始生成
  useEffect(() => {
    generateIds(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 控制面板 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {copy.optionsTitle}
            </CardTitle>
            <CardDescription>{copy.optionsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* UUID 版本选择 */}
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">{copy.type}</div>
              <Tabs
                value={uuidVersion}
                onValueChange={(value: string) => setUuidVersion(value)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full">
                  {copy.versions.map(version => (
                    <TabsTrigger key={version.value} value={version.value}>
                      {version.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* 格式选择 */}
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">{copy.outputFormat}</div>
              <Tabs
                value={format}
                onValueChange={(value: string) => setFormat(value)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  {copy.formats.slice(0, 2).map(option => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsList className="grid grid-cols-2 w-full mt-2">
                  {copy.formats.slice(2).map(option => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="text-xs text-muted-foreground mt-1">
                {copy.example}{" "}
                {copy.formats.find(opt => opt.value === format)?.example}
              </div>
            </div>

            {/* 数量选择 */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">{copy.quantity}</div>
                <div className="text-sm text-muted-foreground">{quantity}</div>
              </div>
              <Slider
                value={[quantity]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value: number[]) => setQuantity(value[0])}
              />
            </div>

            {/* 自定义 ID 选项 */}
            {uuidVersion === "custom" && (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">{copy.length}</div>
                    <div className="text-sm text-muted-foreground">
                      {customLength}
                    </div>
                  </div>
                  <Slider
                    value={[customLength]}
                    min={4}
                    max={64}
                    step={1}
                    onValueChange={(value: number[]) =>
                      setCustomLength(value[0])
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">{copy.charset}</div>
                  <select
                    value={selectedCharset}
                    onChange={e => setSelectedCharset(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  >
                    {copy.charsets.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="special-chars"
                    checked={includeSpecialChars}
                    onCheckedChange={setIncludeSpecialChars}
                  />
                  <Label htmlFor="special-chars">{copy.special}</Label>
                </div>
              </>
            )}

            {/* 自动刷新 */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh">{copy.autoRefresh}</Label>
            </div>

            {/* 生成按钮 */}
            <Button onClick={() => generateIds()} className="w-full">
              <RefreshCw data-icon="inline-start" />
              {copy.generate}{" "}
              {quantity > 1
                ? isEnglish
                  ? `${quantity} ${copy.ids}`
                  : `${quantity} ${copy.ids}`
                : ""}{" "}
              ID
            </Button>
          </CardContent>
        </Card>

        {/* 生成结果 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                {copy.resultTitle}
              </CardTitle>
              {generatedIds.length > 0 && (
                <Button variant="outline" size="sm" onClick={copyAllIds}>
                  <Copy data-icon="inline-start" />
                  {copy.copyAll}
                </Button>
              )}
            </div>
            <CardDescription>
              {generatedIds.length > 0
                ? copy.generated
                    .replace("{count}", String(generatedIds.length))
                    .replace(
                      "{type}",
                      uuidVersion === "v4"
                        ? "UUID v4"
                        : uuidVersion === "v1"
                          ? "UUID v1"
                          : copy.randomId
                    )
                : copy.empty}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col max-h-[500px] overflow-y-auto gap-2">
              {generatedIds.map((id, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-muted/50 rounded-md hover:bg-muted"
                >
                  <code className="font-mono text-sm break-all">{id}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
