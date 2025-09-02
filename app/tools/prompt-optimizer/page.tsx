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

  // 优化 Prompt（流式输出）
  const optimizePrompt = useCallback(async () => {
    if (!originalPrompt.trim()) {
      toast.error("请先输入要优化的 Prompt");
      return;
    }

    setIsOptimizing(true);
    setOptimizedPrompt(""); // 清空之前的结果

    try {
      const response = await fetch("/api/prompt-optimizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: originalPrompt }),
      });

      if (!response.ok) {
        throw new Error("优化请求失败");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("无法读取响应流");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // 保留最后一行（可能不完整）
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.content) {
                setOptimizedPrompt(prev => prev + data.content);
              }

              if (data.done) {
                toast.success("Prompt 优化完成！");
                return;
              }
            } catch (parseError) {
              console.warn("解析流数据失败:", parseError, "原始数据:", line);
            }
          }
        }
      }

      toast.success("Prompt 优化完成！");
    } catch (error) {
      console.error("Optimization error:", error);
      toast.error(error instanceof Error ? error.message : "优化失败，请重试");
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
                  isOptimizing
                    ? "正在生成优化后的 Prompt..."
                    : optimizedPrompt
                      ? ""
                      : "点击左侧'开始优化'按钮生成优化后的 Prompt"
                }
                className="min-h-[500px] font-mono text-sm"
                readOnly={isOptimizing || !optimizedPrompt}
              />

              <Button
                onClick={() =>
                  copyToClipboard(optimizedPrompt, "优化后的 Prompt")
                }
                className="w-full"
                disabled={!optimizedPrompt || isOptimizing}
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
