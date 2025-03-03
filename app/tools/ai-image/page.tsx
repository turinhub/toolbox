"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Download, RefreshCw, Image as ImageIcon, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TurnstileVerification } from "@/components/common/turnstile-verification";
import { getRemainingGenerationsClient } from "@/lib/cookies";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 图像风格选项
const styleOptions = [
  { value: "photorealistic", label: "写实照片" },
  { value: "digital art", label: "数字艺术" },
  { value: "anime", label: "动漫风格" },
  { value: "oil painting", label: "油画风格" },
];

export default function AIImageGeneratorPage() {
  // 状态
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("photorealistic");
  const [generationSteps, setGenerationSteps] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(5);

  // 加载剩余生成次数
  useEffect(() => {
    setRemainingGenerations(getRemainingGenerationsClient());
  }, []);

  // 生成图像
  const generateImage = async () => {
    if (!prompt) {
      toast.error("请输入图像描述");
      return;
    }

    // 检查剩余生成次数
    if (remainingGenerations <= 0) {
      toast.error("您今天的图像生成次数已达上限（5次/天），请明天再试");
      return;
    }

    // 如果没有验证令牌，显示验证对话框
    if (!turnstileToken) {
      setShowTurnstile(true);
      return;
    }

    setIsGenerating(true);

    try {
      // 构建完整的提示词
      let fullPrompt = prompt;
      if (imageStyle) {
        fullPrompt = `${imageStyle} style, ${fullPrompt}`;
      }
      if (negativePrompt) {
        fullPrompt = `${fullPrompt} | negative: ${negativePrompt}`;
      }

      // 调用图像生成 API
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          token: turnstileToken,
          steps: generationSteps, // FLUX 模型支持 1-4 步生成
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "图像生成失败");
      }

      const data = await response.json();
      setGeneratedImage(`data:image/png;base64,${data.image}`);
      
      // 更新剩余生成次数
      if (data.remainingGenerations !== undefined) {
        setRemainingGenerations(data.remainingGenerations);
      } else {
        // 如果 API 没有返回剩余次数，手动减少
        setRemainingGenerations(prev => Math.max(0, prev - 1));
      }
      
      toast.success("图像生成成功");
    } catch (error) {
      console.error("图像生成错误:", error);
      // 如果是验证失败，清除令牌并重新显示验证框
      if (error instanceof Error && 
          (error.message.includes("人机验证") || 
           error.message.includes("验证令牌"))) {
        setTurnstileToken(null);
        setShowTurnstile(true);
      } else if (error instanceof Error && error.message.includes("已达上限")) {
        // 如果是达到限制，更新剩余次数为 0
        setRemainingGenerations(0);
      }
      toast.error(error instanceof Error ? error.message : "图像生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载图像
  const downloadImage = () => {
    if (!generatedImage) return;

    // 创建一个临时的 a 标签来下载图像
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `ai-generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">AI 图像生成</h1>
        <p className="text-muted-foreground">
          使用 FLUX.1 模型生成高质量图像，只需输入文字描述
        </p>
      </div>

      {remainingGenerations <= 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>生成次数已达上限</AlertTitle>
          <AlertDescription>
            您今天的图像生成次数已达上限（5次/天），请明天再试
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 控制面板 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                生成选项
              </CardTitle>
              <Badge variant={remainingGenerations > 0 ? "outline" : "destructive"}>
                剩余: {remainingGenerations}/5
              </Badge>
            </div>
            <CardDescription>
              配置AI图像生成的各种参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 图像描述 */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="flex items-center gap-1">
                图像描述
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">详细描述你想要生成的图像内容，越具体越好</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Textarea
                id="prompt"
                placeholder="描述你想要生成的图像内容..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                例如：&ldquo;一只橙色的猫咪坐在窗台上，阳光照射进来，背景是城市景观&rdquo;
              </p>
            </div>

            {/* 负面提示词 */}
            <div className="space-y-2">
              <Label htmlFor="negative-prompt" className="flex items-center gap-1">
                负面提示词（可选）
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">描述你不希望出现在图像中的内容</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="negative-prompt"
                placeholder="描述你不希望出现在图像中的内容..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                例如：&ldquo;模糊，扭曲，低质量，不自然的姿势&rdquo;
              </p>
            </div>

            {/* 图像风格 */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-1">
                图像风格
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">选择图像的艺术风格</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Tabs
                value={imageStyle}
                onValueChange={(value) => setImageStyle(value)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  {styleOptions.slice(0, 2).map((style) => (
                    <TabsTrigger key={style.value} value={style.value}>
                      {style.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsList className="grid grid-cols-2 w-full mt-2">
                  {styleOptions.slice(2).map((style) => (
                    <TabsTrigger key={style.value} value={style.value}>
                      {style.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* 生成步数 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium flex items-center gap-1">
                  生成步数
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">FLUX 模型支持 1-4 步生成，步数越高质量越好但速度越慢</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm text-muted-foreground">{generationSteps}</div>
              </div>
              <Slider
                value={[generationSteps]}
                min={1}
                max={4}
                step={1}
                onValueChange={(value) => setGenerationSteps(value[0])}
              />
              <p className="text-xs text-muted-foreground">
                步数越高，生成质量越好，但耗时也越长
              </p>
            </div>

            {/* 生成按钮 */}
            <Button 
              onClick={generateImage} 
              className="w-full" 
              disabled={isGenerating || remainingGenerations <= 0}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : remainingGenerations <= 0 ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  今日次数已用完
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成图像
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 生成结果 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                生成结果
              </CardTitle>
              {generatedImage && (
                <Button variant="outline" size="sm" onClick={downloadImage}>
                  <Download className="h-4 w-4 mr-1" />
                  下载图像
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-md">
            {generatedImage ? (
              <img
                src={generatedImage}
                alt="AI 生成的图像"
                className="max-w-full max-h-[400px] object-contain"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>生成的图像将显示在这里</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用提示 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">关于 FLUX.1 模型</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <p>FLUX.1 是一个 12B 参数的文本到图像生成模型，具有以下特点：</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>高质量输出和出色的提示词跟随能力</li>
              <li>使用潜在对抗扩散蒸馏训练，可以在 1-4 步内生成高质量图像</li>
              <li>支持多种艺术风格和详细的文本描述</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              提示：使用详细的描述，包括场景、颜色、光线等细节，可以获得更好的生成效果。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 使用通用 Turnstile 验证组件 */}
      <TurnstileVerification
        open={showTurnstile}
        onOpenChange={setShowTurnstile}
        onVerify={(token) => {
          setTurnstileToken(token);
        }}
        onSuccess={generateImage}
      />
    </div>
  );
}