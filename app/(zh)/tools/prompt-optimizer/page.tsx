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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

// Removed PROMPT_TEMPLATES as they are no longer needed

export default function PromptOptimizerPage() {
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const copy = isEnglish
    ? {
        inputRequired: "Enter a Prompt to optimize first.",
        requestFailed: "Optimization request failed.",
        streamUnavailable: "Could not read the response stream.",
        complete: "Prompt optimization complete.",
        parseFailed: "Failed to parse stream data:",
        rawData: "Raw data:",
        fallbackError: "Optimization failed. Try again.",
        copied: "Copied {type} to clipboard.",
        copyFailed: "Copy failed. Copy manually.",
        cleared: "Cleared all content.",
        originalTitle: "Original Prompt",
        originalDesc: "Enter the prompt you want to optimize.",
        originalPlaceholder: "Enter the Prompt you want to optimize...",
        optimizing: "Optimizing...",
        start: "Start optimization",
        originalType: "original Prompt",
        clear: "Clear",
        optimizedTitle: "Optimized Prompt",
        optimizedDesc: "The optimized prompt is ready to copy and use.",
        generatingPlaceholder: "Generating optimized Prompt...",
        emptyPlaceholder:
          "Click Start optimization on the left to generate an optimized Prompt.",
        optimizedType: "optimized Prompt",
        copyOptimized: "Copy optimized Prompt",
      }
    : {
        inputRequired: "请先输入要优化的 Prompt",
        requestFailed: "优化请求失败",
        streamUnavailable: "无法读取响应流",
        complete: "Prompt 优化完成！",
        parseFailed: "解析流数据失败:",
        rawData: "原始数据:",
        fallbackError: "优化失败，请重试",
        copied: "已复制{type}到剪贴板",
        copyFailed: "复制失败，请手动复制",
        cleared: "已清空所有内容",
        originalTitle: "原始 Prompt",
        originalDesc: "输入您要优化的原始提示词",
        originalPlaceholder: "请输入您要优化的 Prompt…",
        optimizing: "优化中…",
        start: "开始优化",
        originalType: "原始 Prompt",
        clear: "清空",
        optimizedTitle: "优化后的 Prompt",
        optimizedDesc: "优化后的提示词，可直接复制使用",
        generatingPlaceholder: "正在生成优化后的 Prompt…",
        emptyPlaceholder: "点击左侧'开始优化'按钮生成优化后的 Prompt",
        optimizedType: "优化后的 Prompt",
        copyOptimized: "复制优化后的 Prompt",
      };
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  // Removed selectedTemplate state as templates are no longer used

  const [isOptimizing, setIsOptimizing] = useState(false);
  // Removed realTimeAnalysis state as it's no longer used

  // Removed analyzeRealTime function as it's no longer used

  // 优化 Prompt（流式输出）
  const optimizePrompt = useCallback(async () => {
    if (!originalPrompt.trim()) {
      toast.error(copy.inputRequired);
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
        throw new Error(copy.requestFailed);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error(copy.streamUnavailable);
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
                toast.success(copy.complete);
                return;
              }
            } catch (parseError) {
              console.warn(copy.parseFailed, parseError, copy.rawData, line);
            }
          }
        }
      }

      toast.success(copy.complete);
    } catch (error) {
      console.error("Optimization error:", error);
      toast.error(error instanceof Error ? error.message : copy.fallbackError);
    } finally {
      setIsOptimizing(false);
    }
  }, [copy, originalPrompt]);

  // Removed applyTemplate function as templates are no longer used

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(copy.copied.replace("{type}", type));
    } catch {
      toast.error(copy.copyFailed);
    }
  }, [copy]);

  // 清空内容
  const clearAll = useCallback(() => {
    setOriginalPrompt("");
    setOptimizedPrompt("");
    toast.success(copy.cleared);
  }, [copy]);

  // Removed real-time analysis useEffect as it's no longer used

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        {/* 原始 Prompt 和优化后的 Prompt */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 左侧：原始 Prompt 输入 */}
          <Card>
            <CardHeader>
              <CardTitle>{copy.originalTitle}</CardTitle>
              <CardDescription>{copy.originalDesc}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                placeholder={copy.originalPlaceholder}
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
                    <RefreshCw
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <Wand2 data-icon="inline-start" />
                  )}
                  {isOptimizing ? copy.optimizing : copy.start}
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(originalPrompt, copy.originalType)
                  }
                  disabled={!originalPrompt.trim()}
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button variant="outline" onClick={clearAll}>
                  {copy.clear}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：优化后的 Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>{copy.optimizedTitle}</CardTitle>
              <CardDescription>{copy.optimizedDesc}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                value={optimizedPrompt}
                onChange={e => setOptimizedPrompt(e.target.value)}
                placeholder={
                  isOptimizing
                    ? copy.generatingPlaceholder
                    : optimizedPrompt
                      ? ""
                      : copy.emptyPlaceholder
                }
                className="min-h-[500px] font-mono text-sm"
                readOnly={isOptimizing || !optimizedPrompt}
              />

              <Button
                onClick={() =>
                  copyToClipboard(optimizedPrompt, copy.optimizedType)
                }
                className="w-full"
                disabled={!optimizedPrompt || isOptimizing}
              >
                <Copy data-icon="inline-start" />
                {copy.copyOptimized}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
