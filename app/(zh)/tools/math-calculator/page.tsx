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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

type ConversionType = "storage" | "speed" | "compute" | "length" | "weight";

const conversionTypes: Record<
  "zh-CN" | "en",
  { value: ConversionType; label: string }[]
> = {
  "zh-CN": [
    { value: "storage", label: "存储容量" },
    { value: "speed", label: "网络速度" },
    { value: "compute", label: "AI 算力" },
    { value: "length", label: "长度距离" },
    { value: "weight", label: "重量质量" },
  ],
  en: [
    { value: "storage", label: "Storage" },
    { value: "speed", label: "Network speed" },
    { value: "compute", label: "AI compute" },
    { value: "length", label: "Length" },
    { value: "weight", label: "Weight" },
  ],
};

const zhUnits: Record<ConversionType, { value: string; label: string }[]> = {
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

const enUnits: Record<ConversionType, { value: string; label: string }[]> = {
  storage: [
    { value: "B", label: "Byte (B)" },
    { value: "KB", label: "Kilobyte (KB)" },
    { value: "MB", label: "Megabyte (MB)" },
    { value: "GB", label: "Gigabyte (GB)" },
    { value: "TB", label: "Terabyte (TB)" },
    { value: "PB", label: "Petabyte (PB)" },
  ],
  speed: [
    { value: "bps", label: "Bits per second (bps)" },
    { value: "Kbps", label: "Kilobits per second (Kbps)" },
    { value: "Mbps", label: "Megabits per second (Mbps)" },
    { value: "Gbps", label: "Gigabits per second (Gbps)" },
    { value: "B/s", label: "Bytes per second (B/s)" },
    { value: "KB/s", label: "Kilobytes per second (KB/s)" },
    { value: "MB/s", label: "Megabytes per second (MB/s)" },
    { value: "GB/s", label: "Gigabytes per second (GB/s)" },
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
    { value: "mm", label: "Millimeter (mm)" },
    { value: "cm", label: "Centimeter (cm)" },
    { value: "dm", label: "Decimeter (dm)" },
    { value: "m", label: "Meter (m)" },
    { value: "km", label: "Kilometer (km)" },
    { value: "in", label: "Inch (in)" },
    { value: "ft", label: "Foot (ft)" },
    { value: "yd", label: "Yard (yd)" },
    { value: "mi", label: "Mile (mi)" },
  ],
  weight: [
    { value: "mg", label: "Milligram (mg)" },
    { value: "g", label: "Gram (g)" },
    { value: "kg", label: "Kilogram (kg)" },
    { value: "t", label: "Metric ton (t)" },
    { value: "oz", label: "Ounce (oz)" },
    { value: "lb", label: "Pound (lb)" },
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
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 6,
  });
  const copy = isEnglish
    ? {
        invalidInput: "Invalid input",
        input: "Input",
        autoPlaceholder: "Use calculation result automatically",
        inputPlaceholder: "Enter value",
        selectUnit: "Select unit",
        swapUnits: "Swap units",
        result: "Result",
      }
    : {
        invalidInput: "无效输入",
        input: "输入",
        autoPlaceholder: "自动使用计算结果",
        inputPlaceholder: "输入值",
        selectUnit: "选择单位",
        swapUnits: "交换换算单位",
        result: "结果",
      };
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
      return copy.invalidInput;
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
    return numberFormatter.format(convertedValue);
  }, [
    copy.invalidInput,
    conversionType,
    fromUnit,
    inputValue,
    numberFormatter,
    toUnit,
  ]);

  const currentUnits = (isEnglish ? enUnits : zhUnits)[conversionType];

  const getUnitLabel = (unitValue: string) => {
    const unit = currentUnits.find(u => u.value === unitValue);
    return unit ? unit.label.split(" ")[0] : "";
  };

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={conversionType}
        onValueChange={value => setConversionType(value as ConversionType)}
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          {conversionTypes[isEnglish ? "en" : "zh-CN"].map(type => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={conversionType} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="from-value" className="text-sm font-medium">
                {copy.input}
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
                  placeholder={
                    autoMode ? copy.autoPlaceholder : copy.inputPlaceholder
                  }
                  className={autoMode ? "bg-muted" : ""}
                />
                <Select value={fromUnit} onValueChange={setFromUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder={copy.selectUnit} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {currentUnits.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="self-end hidden md:inline-flex"
              onClick={handleSwap}
              aria-label={copy.swapUnits}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div className="flex flex-col gap-2">
              <label htmlFor="to-value" className="text-sm font-medium">
                {copy.result}
              </label>
              <div className="flex gap-2">
                <Input
                  id="to-value"
                  readOnly
                  value={result}
                  placeholder={copy.result}
                  className="font-mono bg-muted"
                />
                <Select value={toUnit} onValueChange={setToUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder={copy.selectUnit} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {currentUnits.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
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
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        copied: "Copied to clipboard",
        expressionTitle: "Expression calculator",
        expressionDescription:
          "Supports basic operations such as addition, subtraction, multiplication, division, parentheses, and exponents.",
        expressionPlaceholder: "For example: (2 + 3) * 4 - 5 / 2",
        clearExpression: "Clear expression",
        useForConversion: "Use for conversion",
        unitTitle: "Unit converter",
        autoConvert: "Auto convert",
        unitDescription:
          "Convert storage, speed, AI compute, length, and weight units.",
        autoSuffix: " (automatically uses the expression result)",
      }
    : {
        copied: "已复制到剪贴板",
        expressionTitle: "表达式计算",
        expressionDescription: "支持加减乘除、括号、指数等基本运算",
        expressionPlaceholder: "例如：(2 + 3) * 4 - 5 / 2",
        clearExpression: "清空表达式",
        useForConversion: "用于换算",
        unitTitle: "单位换算",
        autoConvert: "自动换算",
        unitDescription:
          "支持存储、速度、模型参数、AI 算力、长度、重量等多种单位间的换算",
        autoSuffix: "（自动使用表达式计算结果）",
      };
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
    toast.success(copy.copied);
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{copy.expressionTitle}</CardTitle>
          <CardDescription>{copy.expressionDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder={copy.expressionPlaceholder}
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
                aria-label={copy.clearExpression}
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
                      {copy.useForConversion}
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
            <span>{copy.unitTitle}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal">{copy.autoConvert}</span>
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
            {copy.unitDescription}
            {autoConvert && copy.autoSuffix}
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
