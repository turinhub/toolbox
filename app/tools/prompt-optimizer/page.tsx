"use client";

import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Select components removed as they are not used
import { toast } from "sonner";
import { Copy, Wand2, RefreshCw } from "lucide-react";
import {
  StructuredData,
  generateToolStructuredData,
} from "@/components/structured-data";

// Removed PROMPT_TEMPLATES as they are no longer needed

export default function PromptOptimizerPage() {
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  // Removed selectedTemplate state as templates are no longer used

  const [isOptimizing, setIsOptimizing] = useState(false);
  // Removed realTimeAnalysis state as it's no longer used

  // Removed analyzeRealTime function as it's no longer used

  // 优化 Prompt
  const optimizePrompt = useCallback(async () => {
    if (!originalPrompt.trim()) {
      toast.error("请先输入要优化的 Prompt");
      return;
    }

    setIsOptimizing(true);

    try {
      const response = await fetch("/api/prompt-optimizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: originalPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "优化失败");
      }

      const result = await response.json();

      if (result.success) {
        setOptimizedPrompt(result.optimizedPrompt);
        toast.success("Prompt 优化完成！");
      } else {
        throw new Error(result.error || "优化失败");
      }
    } catch (error) {
      console.error("Optimization error:", error);
      toast.error(error instanceof Error ? error.message : "优化失败，请重试");

      // 基本优化逻辑作为备选
      let optimized = originalPrompt;
      if (
        !originalPrompt.toLowerCase().includes("你是") &&
        !originalPrompt.toLowerCase().includes("扮演")
      ) {
        optimized = `你是一位专业的助手，${optimized}`;
      }
      if (
        !originalPrompt.includes("请确保") &&
        !originalPrompt.includes("要求")
      ) {
        optimized += "\n\n请确保回答准确、详细且有用。";
      }
      if (
        !originalPrompt.includes("格式") &&
        !originalPrompt.includes("步骤")
      ) {
        optimized +=
          "\n\n请按以下格式回答：\n1. 主要内容\n2. 详细说明\n3. 总结建议";
      }
      setOptimizedPrompt(optimized);
    } finally {
      setIsOptimizing(false);
    }
  }, [originalPrompt]);

  // Removed applyTemplate function as templates are no longer used

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`已复制${type}到剪贴板`);
    } catch {
      toast.error("复制失败，请手动复制");
    }
  }, []);

  // 清空内容
  const clearAll = useCallback(() => {
    setOriginalPrompt("");
    setOptimizedPrompt("");
    toast.success("已清空所有内容");
  }, []);

  // Removed real-time analysis useEffect as it's no longer used

  return (
    <div className="flex flex-col gap-8">
      <StructuredData
        data={generateToolStructuredData({
          name: "Prompt 优化工具",
          description: "优化和改进 AI 提示词，提升 AI 对话效果和准确性",
          url: "https://turinhub.com/tools/prompt-optimizer",
          category: "文本工具",
        })}
      />

      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Prompt 优化工具</h1>
        <p className="text-muted-foreground">
          优化和改进 AI 提示词，提升 AI 对话效果和准确性
        </p>
      </div>

      <div className="space-y-6">
        {/* 原始 Prompt 和优化后的 Prompt */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 左侧：原始 Prompt 输入 */}
          <Card>
            <CardHeader>
              <CardTitle>原始 Prompt</CardTitle>
              <CardDescription>输入您要优化的原始提示词</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="请输入您要优化的 Prompt..."
                value={originalPrompt}
                onChange={e => setOriginalPrompt(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button
                  onClick={optimizePrompt}
                  disabled={!originalPrompt.trim() || isOptimizing}
                  className="flex-1"
                >
                  {isOptimizing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  {isOptimizing ? "优化中..." : "开始优化"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(originalPrompt, "原始 Prompt")}
                  disabled={!originalPrompt.trim()}
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button variant="outline" onClick={clearAll}>
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：优化后的 Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>优化后的 Prompt</CardTitle>
              <CardDescription>优化后的提示词，可直接复制使用</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={optimizedPrompt}
                onChange={e => setOptimizedPrompt(e.target.value)}
                placeholder={
                  optimizedPrompt
                    ? ""
                    : "点击左侧'开始优化'按钮生成优化后的 Prompt"
                }
                className="min-h-[500px] font-mono text-sm"
                readOnly={!optimizedPrompt}
              />

              <Button
                onClick={() =>
                  copyToClipboard(optimizedPrompt, "优化后的 Prompt")
                }
                className="w-full"
                disabled={!optimizedPrompt}
              >
                <Copy className="h-4 w-4 mr-2" />
                复制优化后的 Prompt
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
