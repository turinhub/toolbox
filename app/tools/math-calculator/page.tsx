"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, ArrowLeftRight, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ConversionType = "storage" | "speed" | "compute" | "length" | "weight";

const conversionTypes = [
  { value: "storage", label: "存储容量" },
  { value: "speed", label: "网络速度" },
  { value: "compute", label: "AI 算力" },
  { value: "length", label: "长度距离" },
  { value: "weight", label: "重量质量" },
];

const units: Record<ConversionType, { value: string; label: string }[]> = {
  storage: [
    { value: "B", label: "字节 (B)" },
    { value: "KB", label: "千字节 (KB)" },
    { value: "MB", label: "兆字节 (MB)" },
    { value: "GB", label: "吉字节 (GB)" },
    { value: "TB", label: "太字节 (TB)" },
    { value: "PB", label: "拍字节 (PB)" },
  ],
  speed: [
    { value: "bps", label: "比特每秒 (bps)" },
    { value: "Kbps", label: "千比特每秒 (Kbps)" },
    { value: "Mbps", label: "兆比特每秒 (Mbps)" },
    { value: "Gbps", label: "吉比特每秒 (Gbps)" },
    { value: "B/s", label: "字节每秒 (B/s)" },
    { value: "KB/s", label: "千字节每秒 (KB/s)" },
    { value: "MB/s", label: "兆字节每秒 (MB/s)" },
    { value: "GB/s", label: "吉字节每秒 (GB/s)" },
  ],

  compute: [
    { value: "FLOPS", label: "FLOPS" },
    { value: "kFLOPS", label: "kFLOPS" },
    { value: "MFLOPS", label: "MFLOPS" },
    { value: "GFLOPS", label: "GFLOPS" },
    { value: "TFLOPS", label: "TFLOPS" },
    { value: "PFLOPS", label: "PFLOPS" },
    { value: "EFLOPS", label: "EFLOPS" },
  ],
  length: [
    { value: "mm", label: "毫米 (mm)" },
    { value: "cm", label: "厘米 (cm)" },
    { value: "dm", label: "分米 (dm)" },
    { value: "m", label: "米 (m)" },
    { value: "km", label: "千米 (km)" },
    { value: "in", label: "英寸 (in)" },
    { value: "ft", label: "英尺 (ft)" },
    { value: "yd", label: "码 (yd)" },
    { value: "mi", label: "英里 (mi)" },
  ],
  weight: [
    { value: "mg", label: "毫克 (mg)" },
    { value: "g", label: "克 (g)" },
    { value: "kg", label: "千克 (kg)" },
    { value: "t", label: "吨 (t)" },
    { value: "oz", label: "盎司 (oz)" },
    { value: "lb", label: "磅 (lb)" },
  ],
};

const conversionFactors: Record<ConversionType, Record<string, number>> = {
  storage: {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
    PB: 1024 ** 5,
  },
  speed: {
    bps: 1,
    Kbps: 1000,
    Mbps: 1000 ** 2,
    Gbps: 1000 ** 3,
    "B/s": 8,
    "KB/s": 8 * 1024,
    "MB/s": 8 * 1024 ** 2,
    "GB/s": 8 * 1024 ** 3,
  },

  compute: {
    FLOPS: 1,
    kFLOPS: 1e3,
    MFLOPS: 1e6,
    GFLOPS: 1e9,
    TFLOPS: 1e12,
    PFLOPS: 1e15,
    EFLOPS: 1e18,
  },
  length: {
    mm: 1,
    cm: 10,
    dm: 100,
    m: 1000,
    km: 1000000,
    in: 25.4,
    ft: 304.8,
    yd: 914.4,
    mi: 1609344,
  },
  weight: {
    mg: 0.001,
    g: 1,
    kg: 1000,
    t: 1000000,
    oz: 28.3495,
    lb: 453.592,
  },
};

const UnitConverter = ({
  externalInputValue,
  onInputValueChange,
  autoMode = false,
}: {
  externalInputValue?: string;
  onInputValueChange?: (value: string) => void;
  autoMode?: boolean;
}) => {
  const [conversionType, setConversionType] =
    useState<ConversionType>("storage");
  const [inputValue, setInputValue] = useState(externalInputValue || "1024");
  const [fromUnit, setFromUnit] = useState("MB");
  const [toUnit, setToUnit] = useState("GB");

  useEffect(() => {
    if (conversionType === "storage") {
      setFromUnit("MB");
      setToUnit("GB");
      if (!externalInputValue) setInputValue("1024");
    } else if (conversionType === "speed") {
      setFromUnit("Mbps");
      setToUnit("MB/s");
      if (!externalInputValue) setInputValue("100");
    } else if (conversionType === "compute") {
      setFromUnit("TFLOPS");
      setToUnit("GFLOPS");
      if (!externalInputValue) setInputValue("1");
    } else if (conversionType === "length") {
      setFromUnit("m");
      setToUnit("cm");
      if (!externalInputValue) setInputValue("1");
    } else if (conversionType === "weight") {
      setFromUnit("kg");
      setToUnit("g");
      if (!externalInputValue) setInputValue("1");
    }
  }, [conversionType, externalInputValue]);

  useEffect(() => {
    if (externalInputValue) {
      setInputValue(externalInputValue);
    }
  }, [externalInputValue]);

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const result = useMemo(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      return "无效输入";
    }

    const factors = conversionFactors[conversionType];
    const fromFactor = factors[fromUnit];
    const toFactor = factors[toUnit];

    if (fromFactor === undefined || toFactor === undefined) {
      return "";
    }

    const baseValue = value * fromFactor;
    const convertedValue = baseValue / toFactor;

    if (convertedValue < 0.000001 && convertedValue > 0) {
      return convertedValue.toExponential(4);
    }
    return Number(convertedValue.toFixed(6)).toString();
  }, [inputValue, fromUnit, toUnit, conversionType]);

  const currentUnits = units[conversionType];

  const getUnitLabel = (unitValue: string) => {
    const unit = currentUnits.find(u => u.value === unitValue);
    return unit ? unit.label.split(" ")[0] : "";
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={conversionType}
        onValueChange={value => setConversionType(value as ConversionType)}
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          {conversionTypes.map(type => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={conversionType} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="space-y-2">
              <label htmlFor="from-value" className="text-sm font-medium">
                输入
              </label>
              <div className="flex gap-2">
                <Input
                  id="from-value"
                  type="number"
                  value={inputValue}
                  onChange={e => {
                    const value = e.target.value;
                    setInputValue(value);
                    onInputValueChange?.(value);
                  }}
                  placeholder={autoMode ? "自动使用计算结果" : "输入值"}
                  className={autoMode ? "bg-muted" : ""}
                />
                <Select value={fromUnit} onValueChange={setFromUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUnits.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="self-end hidden md:inline-flex"
              onClick={handleSwap}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div className="space-y-2">
              <label htmlFor="to-value" className="text-sm font-medium">
                结果
              </label>
              <div className="flex gap-2">
                <Input
                  id="to-value"
                  readOnly
                  value={result}
                  placeholder="结果"
                  className="font-mono bg-muted"
                />
                <Select value={toUnit} onValueChange={setToUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUnits.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {result && (
            <div className="p-4 bg-muted rounded-md flex justify-center items-center mt-4">
              <span className="font-mono font-medium text-lg text-center">
                {inputValue} {getUnitLabel(fromUnit)} = {result}{" "}
                {getUnitLabel(toUnit)}
              </span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function MathCalculatorPage() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [unitInputValue, setUnitInputValue] = useState("1024");
  const [autoConvert, setAutoConvert] = useState(false);

  // 计算表达式结果
  const calculate = (expr: string) => {
    if (!expr.trim()) {
      setResult(null);
      return;
    }

    try {
      // 使用 Function 计算表达式，避免直接使用 eval
      const value = Function(`"use strict"; return (${expr})`)();
      setResult(value.toString());
    } catch (error) {
      console.error(error);
      setResult(null);
    }
  };

  // 防抖自动计算
  useEffect(() => {
    const timer = setTimeout(() => {
      calculate(expression);
    }, 1000);

    return () => clearTimeout(timer);
  }, [expression]);

  // 自动换算模式下，当计算结果更新时自动更新单位换算输入
  useEffect(() => {
    if (autoConvert && result) {
      setUnitInputValue(result);
    }
  }, [result, autoConvert]);

  // 复制结果到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">数学计算器</h1>
        <p className="text-muted-foreground">
          数学表达式计算和多种单位换算工具
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>表达式计算</CardTitle>
          <CardDescription>支持加减乘除、括号、指数等基本运算</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="例如：(2 + 3) * 4 - 5 / 2"
                value={expression}
                onChange={e => setExpression(e.target.value)}
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setExpression("");
                  setResult(null);
                }}
                disabled={!expression}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            {result !== null && (
              <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                <span className="font-mono font-medium">{result}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!autoConvert && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnitInputValue(result)}
                    >
                      用于换算
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>单位换算</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-normal">自动换算</span>
              <Switch
                checked={autoConvert}
                onCheckedChange={checked => {
                  setAutoConvert(checked);
                  if (checked && result) {
                    setUnitInputValue(result);
                  }
                }}
              />
            </div>
          </CardTitle>
          <CardDescription>
            支持存储、速度、模型参数、AI算力、长度、重量等多种单位间的换算
            {autoConvert && "（自动使用表达式计算结果）"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnitConverter
            externalInputValue={
              autoConvert ? result || unitInputValue : unitInputValue
            }
            onInputValueChange={setUnitInputValue}
            autoMode={autoConvert}
          />
        </CardContent>
      </Card>
    </div>
  );
}
