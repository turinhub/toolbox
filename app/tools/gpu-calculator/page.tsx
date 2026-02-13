"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Cpu, Info } from "lucide-react";

interface GPURecommendation {
  name: string;
  vram: number;
}

interface CalculationResult {
  modelSize: number;
  kvCacheSize: number;
  totalMemory: number;
  recommendedGPUs: GPURecommendation[];
}

const GPU_LIST: GPURecommendation[] = [
  { name: "GTX 1650", vram: 4 },
  { name: "RTX 2060", vram: 6 },
  { name: "RTX 3070", vram: 8 },
  { name: "RTX 3080", vram: 10 },
  { name: "RTX 2080 Ti", vram: 11 },
  { name: "RTX 3060", vram: 12 },
  { name: "RTX 4070", vram: 12 },
  { name: "RTX 4080", vram: 16 },
  { name: "RTX 3090", vram: 24 },
  { name: "RTX 4090", vram: 24 },
  { name: "A100", vram: 40 },
  { name: "A100", vram: 80 },
  { name: "H100", vram: 80 },
];

export default function GPUCalculatorPage() {
  const [parameters, setParameters] = useState({
    modelSize: "7",
    dataType: "2",
    layers: "32",
    hiddenSize: "4096",
    sequenceLength: "2048",
    batchSize: "1",
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  const calculateGPUMemory = () => {
    const P = parseFloat(parameters.modelSize);
    const D = parseInt(parameters.dataType);
    const L = parseInt(parameters.layers);
    const H = parseInt(parameters.hiddenSize);
    const S = parseInt(parameters.sequenceLength);
    const B = parseInt(parameters.batchSize);

    if (!P || !D || !L || !H || !S || !B) {
      return;
    }

    // 将B单位转换为实际参数数量
    const actualParameterCount = P * 1e9;

    // 计算模型大小 (GB)
    const modelSize = (actualParameterCount * D) / 1e9;

    // 计算键值缓存大小 (GB)
    const kvCacheSize = (B * S * L * 2 * H * D) / 1e9;

    // 计算总显存需求 (加20%缓冲)
    const totalMemory = (modelSize + kvCacheSize) * 1.2;

    // 推荐GPU
    const recommendedGPUs = GPU_LIST.filter(gpu => gpu.vram >= totalMemory);

    setResult({
      modelSize: Math.round(modelSize * 100) / 100,
      kvCacheSize: Math.round(kvCacheSize * 1000) / 1000,
      totalMemory: Math.round(totalMemory * 100) / 100,
      recommendedGPUs,
    });
  };

  const loadExample = (type: "7B" | "0.5B") => {
    if (type === "7B") {
      setParameters({
        modelSize: "7",
        dataType: "2",
        layers: "32",
        hiddenSize: "4096",
        sequenceLength: "2048",
        batchSize: "1",
      });
    } else {
      setParameters({
        modelSize: "0.5",
        dataType: "2",
        layers: "8",
        hiddenSize: "2304",
        sequenceLength: "2048",
        batchSize: "1",
      });
    }
    setResult(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          GPU显存需求计算器
        </h1>
        <p className="text-muted-foreground">
          计算大型语言模型部署所需的GPU显存，并推荐合适的显卡型号。参数数量以B(十亿)为单位，支持小数输入。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 参数输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              模型参数配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modelSize">模型参数数量 (B)</Label>
              <Input
                id="modelSize"
                type="number"
                step="0.1"
                placeholder="例如：7.0 (7B) 或 0.5 (0.5B)"
                value={parameters.modelSize}
                onChange={e =>
                  setParameters({ ...parameters, modelSize: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataType">数据类型</Label>
              <Select
                value={parameters.dataType}
                onValueChange={value =>
                  setParameters({ ...parameters, dataType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择数据类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">INT8 (1字节)</SelectItem>
                  <SelectItem value="2">FP16/BF16 (2字节)</SelectItem>
                  <SelectItem value="4">FP32 (4字节)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="layers">模型层数</Label>
                <Input
                  id="layers"
                  type="number"
                  placeholder="例如：32"
                  value={parameters.layers}
                  onChange={e =>
                    setParameters({ ...parameters, layers: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hiddenSize">隐藏层大小</Label>
                <Input
                  id="hiddenSize"
                  type="number"
                  placeholder="例如：4096"
                  value={parameters.hiddenSize}
                  onChange={e =>
                    setParameters({ ...parameters, hiddenSize: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sequenceLength">序列长度</Label>
                <Input
                  id="sequenceLength"
                  type="number"
                  placeholder="例如：2048"
                  value={parameters.sequenceLength}
                  onChange={e =>
                    setParameters({
                      ...parameters,
                      sequenceLength: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchSize">批量大小</Label>
                <Input
                  id="batchSize"
                  type="number"
                  placeholder="例如：1"
                  value={parameters.batchSize}
                  onChange={e =>
                    setParameters({ ...parameters, batchSize: e.target.value })
                  }
                />
              </div>
            </div>

            <Button onClick={calculateGPUMemory} className="w-full">
              计算显存需求
            </Button>

            <Separator />

            <div className="space-y-2">
              <Label>快速加载示例</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadExample("7B")}
                >
                  7B模型示例
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadExample("0.5B")}
                >
                  0.5B模型示例
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 计算结果区域 */}
        <Card>
          <CardHeader>
            <CardTitle>计算结果</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                      模型大小
                    </h3>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {result.modelSize} GB
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-300">
                      键值缓存大小
                    </h3>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {result.kvCacheSize} GB
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-300">
                      总显存需求
                    </h3>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {result.totalMemory} GB
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                      已包含20%缓冲
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-3">推荐显卡配置</h3>
                  <div className="space-y-2">
                    {GPU_LIST.map((gpu, index) => {
                      const sufficient = gpu.vram >= result.totalMemory;
                      return (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="font-medium">{gpu.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">
                              {gpu.vram}GB
                            </span>
                            <span
                              className={
                                sufficient
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              {sufficient ? "足够" : "不足"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>请输入模型参数并点击“计算显存需求”</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 计算公式说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowExamples(!showExamples)}
          >
            <Info className="h-5 w-5" />
            计算公式说明
            <Badge variant="outline" className="ml-auto">
              {showExamples ? "隐藏" : "显示"}
            </Badge>
          </CardTitle>
        </CardHeader>
        {showExamples && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">1. 模型大小计算</h4>
              <p className="text-sm text-muted-foreground">
                模型大小(GB) = 参数数量(B) × 10^9 × 数据类型大小(字节) ÷ 10^9
              </p>
              <p className="text-sm text-muted-foreground">
                简化为：模型大小(GB) = 参数数量(B) × 数据类型大小(字节)
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. 键值缓存大小计算</h4>
              <p className="text-sm text-muted-foreground">
                键值缓存大小(GB) = 批量大小 × 序列长度 × 层数 × 2 × 隐藏层大小 ×
                数据类型大小(字节) ÷ 10^9
              </p>
              <p className="text-sm text-muted-foreground">
                注：此计算与模型参数数量单位无关
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. 总显存需求计算</h4>
              <p className="text-sm text-muted-foreground">
                总显存需求(GB) = (模型大小 + 键值缓存大小) × 1.2
              </p>
              <p className="text-sm text-muted-foreground">
                其中1.2倍系数用于预留20%缓冲，覆盖框架开销和内存碎片
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
