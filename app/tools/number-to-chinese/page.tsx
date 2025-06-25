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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Banknote, DollarSign } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 数字转中文大写金额示例
const examples = [
  {
    number: "1234.56",
    chinese: "壹仟贰佰叁拾肆元伍角陆分",
    description: "基本金额示例",
  },
  {
    number: "100000000",
    chinese: "壹亿元整",
    description: "亿级金额",
  },
  {
    number: "0.01",
    chinese: "壹分",
    description: "小额金额",
  },
];

// 数字转中文大写函数
const numberToChinese = (
  num: number | string,
  withPrefix = false,
  simpleMode = false
): string => {
  // 数字映射
  const digits = simpleMode
    ? ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
    : ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];

  // 单位映射（金额单位）
  const units = simpleMode
    ? [
        "",
        "十",
        "百",
        "千",
        "万",
        "十",
        "百",
        "千",
        "亿",
        "十",
        "百",
        "千",
        "兆",
      ]
    : [
        "",
        "拾",
        "佰",
        "仟",
        "万",
        "拾",
        "佰",
        "仟",
        "亿",
        "拾",
        "佰",
        "仟",
        "兆",
      ];

  // 小数部分单位
  const decimalUnits = simpleMode ? ["角", "分"] : ["角", "分"];

  // 将输入转换为字符串
  const str = num.toString();

  // 验证输入格式
  if (!/^\d+(\.\d+)?$/.test(str)) {
    return "数字格式不正确";
  }

  // 处理前缀（金额前缀）
  const prefix = withPrefix ? (simpleMode ? "人民币" : "人民币") : "";

  // 分离整数和小数部分
  const parts = str.split(".");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1].substring(0, 2) : "";

  // 如果是0，直接返回
  if (parseFloat(str) === 0) {
    return prefix + (withPrefix ? "零元整" : "零");
  }

  // 处理整数部分
  let integerStr = "";
  const integerLen = integerPart.length;

  if (integerLen > 0 && parseInt(integerPart) > 0) {
    let zeroFlag = false;

    for (let i = 0; i < integerLen; i++) {
      const digit = parseInt(integerPart.charAt(i));
      const position = integerLen - i - 1;

      // 处理零
      if (digit === 0) {
        zeroFlag = true;
        // 如果是亿、万位处的0，且前面有数字，要加上单位
        if (position === 8 || position === 4) {
          if (integerStr.length > 0) {
            // 判断是否已经有了亿、万单位
            if (
              (position === 8 && !integerStr.includes("亿")) ||
              (position === 4 &&
                !integerStr.includes("万") &&
                parseInt(integerPart.substring(0, integerLen - 8)) === 0)
            ) {
              integerStr += units[position];
            }
          }
        }
        continue;
      }

      // 添加零
      if (zeroFlag) {
        integerStr += digits[0];
        zeroFlag = false;
      }

      // 添加数字和单位
      integerStr += digits[digit] + units[position];
    }

    // 添加"元"
    if (withPrefix) {
      integerStr += "元";
    }
  }

  // 处理小数部分
  let decimalStr = "";

  if (decimalPart.length > 0) {
    for (let i = 0; i < Math.min(decimalPart.length, 2); i++) {
      const digit = parseInt(decimalPart.charAt(i));
      if (digit !== 0) {
        decimalStr += digits[digit] + decimalUnits[i];
      } else if (digit === 0 && decimalStr.length > 0) {
        // 处理中间的零
        decimalStr += digits[0];
      }
    }
  }

  // 组合结果
  let result = prefix + integerStr + decimalStr;

  // 如果没有小数部分，且是金额形式，添加"整"
  if (withPrefix && decimalStr.length === 0 && integerStr.length > 0) {
    result += "整";
  }

  // 防止空结果
  if (result.length === 0) {
    return "零";
  }

  return result;
};

export default function NumberToChinesePage() {
  // 状态
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"currency" | "number">("currency");
  const [simpleMode, setSimpleMode] = useState(false);
  const [validInput, setValidInput] = useState(true);

  // 转换为中文大写
  const convertToChinese = () => {
    if (!input.trim()) {
      toast.error("请输入要转换的数字");
      return;
    }

    // 验证输入是否为有效数字
    if (!/^\d+(\.\d+)?$/.test(input)) {
      setValidInput(false);
      setOutput("");
      return;
    }

    setValidInput(true);

    try {
      const result = numberToChinese(input, mode === "currency", simpleMode);
      setOutput(result);
    } catch (error) {
      console.error(error);
      toast.error(`转换失败: ${(error as Error).message}`);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  // 使用示例
  const applyExample = (example: (typeof examples)[0]) => {
    setInput(example.number);
    setOutput(example.chinese);
    setMode("currency");
    setSimpleMode(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">数字转中文大写</h1>
        <p className="text-muted-foreground">
          将数字转换为中文大写格式，支持金额和普通数字两种模式
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <Tabs
          value={mode}
          onValueChange={value => {
            setMode(value as "currency" | "number");
            setInput("");
            setOutput("");
          }}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="currency" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              金额模式
            </TabsTrigger>
            <TabsTrigger value="number" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              数字模式
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>数字转中文大写</CardTitle>
          <CardDescription>
            {mode === "currency"
              ? "将阿拉伯数字金额转换为中文大写金额"
              : "将阿拉伯数字转换为中文大写数字"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="simple-mode"
              checked={simpleMode}
              onCheckedChange={setSimpleMode}
            />
            <Label htmlFor="simple-mode">
              使用简体字形（一二三 代替 壹贰叁）
            </Label>
          </div>

          <div className="flex flex-col space-y-4">
            <Input
              type="text"
              placeholder={
                mode === "currency"
                  ? "请输入数字金额，如：1234.56"
                  : "请输入数字，如：1234"
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              className={`font-mono ${!validInput ? "border-destructive" : ""}`}
            />

            {!validInput && (
              <Alert variant="destructive">
                <AlertDescription>
                  请输入有效的数字格式，如：123 或 123.45
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={convertToChinese}>转换为中文大写</Button>

            {output && (
              <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                <span className="font-medium">{output}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(output)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 使用示例 */}
      <Card>
        <CardHeader>
          <CardTitle>使用示例</CardTitle>
          <CardDescription>点击示例可以快速应用</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {examples.map((example, index) => (
              <div
                key={index}
                className="p-4 border rounded-md hover:bg-accent hover:cursor-pointer"
                onClick={() => applyExample(example)}
              >
                <div className="font-medium">
                  {example.number} → {example.chinese}
                </div>
                <div className="text-sm text-muted-foreground">
                  {example.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            -
            金额模式：适用于金额转换，例如发票、合同等场景，会添加“元”、“角”、“分”等单位
          </p>
          <p>- 数字模式：仅将数字转换为中文大写，不添加金额单位</p>
          <p>- 可以切换使用简体字形（一二三）或传统字形（壹贰叁）</p>
          <p>- 支持到兆级别的大数字转换</p>
        </CardContent>
      </Card>
    </div>
  );
}
