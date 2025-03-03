"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Download, RefreshCw, Image as ImageIcon, Info, AlertCircle, Copy, Share2, MoreHorizontal, RefreshCcw } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat] = useState("png");
  const imageRef = useRef<HTMLImageElement>(null);

  // 加载剩余生成次数
  useEffect(() => {
    // 定义一个函数来更新剩余次数
    const updateRemainingGenerations = () => {
      const remaining = getRemainingGenerationsClient();
      setRemainingGenerations(remaining);
    };

    // 初始加载时更新
    updateRemainingGenerations();

    // 添加事件监听器，在页面可见性变化时更新
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateRemainingGenerations();
      }
    };

    // 添加事件监听器，在页面获得焦点时更新
    const handleFocus = () => {
      updateRemainingGenerations();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // 清理函数
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 更新剩余生成次数的函数
  const updateRemainingCount = () => {
    const remaining = getRemainingGenerationsClient();
    setRemainingGenerations(remaining);
  };

  // 生成图像
  const generateImage = async (verificationToken?: string | null) => {
    if (!prompt) {
      toast.error("请输入图像描述");
      return;
    }

    // 检查剩余生成次数
    if (remainingGenerations <= 0) {
      toast.error("您今天的图像生成次数已达上限（5次/天），请明天再试");
      return;
    }

    // 使用传入的验证令牌或已存储的令牌
    const token = verificationToken || turnstileToken;
    
    // 如果没有验证令牌，显示验证对话框
    if (!token) {
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
          token: token, // 使用传入的令牌或已存储的令牌
          steps: generationSteps,
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
      
      // 确保从 cookie 获取最新的剩余次数
      setTimeout(updateRemainingCount, 500);
      setTimeout(updateRemainingCount, 1000);
      setTimeout(updateRemainingCount, 2000);
      
      toast.success("图像生成成功");
    } catch (error) {
      console.error("图像生成错误:", error);
      // 如果是验证失败，清除所有令牌并重新显示验证框
      if (error instanceof Error && 
          (error.message.includes("人机验证") || 
           error.message.includes("验证令牌"))) {
        setTurnstileToken(null);
        document.cookie = 'cf-turnstile-valid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
  const downloadImage = (format = downloadFormat) => {
    if (!generatedImage) return;
    
    setIsDownloading(true);
    toast.loading("准备下载图像...");

    try {
      // 创建一个临时的 canvas 元素
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // 如果有图像引用，使用它的尺寸
      if (imageRef.current) {
        const img = imageRef.current;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // 绘制图像到 canvas
        ctx?.drawImage(img, 0, 0);
        
        // 根据格式确定 MIME 类型和文件名
        const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
        const fileName = `ai-generated-image-${Date.now()}.${format}`;
        
        // 将 canvas 转换为 blob
        canvas.toBlob((blob) => {
          if (blob) {
            // 创建一个临时的 URL
            const url = URL.createObjectURL(blob);
            
            // 创建一个临时的 a 标签来下载图像
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 释放 URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            toast.success(`图像已下载为 ${format.toUpperCase()} 格式`);
          } else {
            throw new Error("无法创建图像文件");
          }
          setIsDownloading(false);
        }, mimeType, 0.9);
      } else {
        // 如果没有图像引用，使用原始的下载方法
        const link = document.createElement("a");
        link.href = generatedImage;
        link.download = `ai-generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("图像已下载");
        setIsDownloading(false);
      }
    } catch (error) {
      console.error("下载图像时出错:", error);
      toast.error("下载图像失败，请重试");
      setIsDownloading(false);
    }
  };

  // 复制图像到剪贴板
  const copyImageToClipboard = async () => {
    if (!generatedImage) return;
    
    try {
      // 从 base64 数据创建 blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      
      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      toast.success("图像已复制到剪贴板");
    } catch (error) {
      console.error("复制图像时出错:", error);
      toast.error("复制图像失败，请重试");
    }
  };

  // 分享图像
  const shareImage = async () => {
    if (!generatedImage || !navigator.share) return;
    
    try {
      // 从 base64 数据创建 blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], "ai-generated-image.png", { type: "image/png" });
      
      // 使用 Web Share API 分享
      await navigator.share({
        title: "AI 生成的图像",
        text: "查看我用 AI 生成的图像",
        files: [file]
      });
      
      toast.success("分享成功");
    } catch (error) {
      // 用户取消分享不显示错误
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("分享图像时出错:", error);
        toast.error("分享图像失败");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI 图像生成</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          使用 FLUX.1 模型生成高质量图像，只需输入文字描述即可创建令人惊艳的视觉作品
        </p>
      </div>

      {remainingGenerations <= 0 && (
        <Alert variant="destructive" className="animate-in fade-in-50 duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>生成次数已达上限</AlertTitle>
          <AlertDescription>
            您今天的图像生成次数已达上限（5次/天），请明天再试
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 控制面板 */}
        <Card className="lg:col-span-1 shadow-sm border-muted/60 h-fit">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                生成选项
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={remainingGenerations > 0 ? "outline" : "destructive"} className="transition-all">
                  今日剩余: {remainingGenerations}/5
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={updateRemainingCount}
                  title="刷新剩余次数"
                >
                  <RefreshCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardDescription>
              配置AI图像生成的各种参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 图像描述 */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="flex items-center gap-1 text-sm font-medium">
                图像描述
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>详细描述你想要生成的图像内容，越具体越好。请使用英文输入以获得更好的效果。</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Textarea
                id="prompt"
                placeholder="请使用英文描述你想要生成的图像内容..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-y focus-visible:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground italic">
                例如：&ldquo;An orange cat sitting on a windowsill, sunlight streaming in, with a city landscape in the background&rdquo;
              </p>
            </div>

            {/* 负面提示词 */}
            <div className="space-y-2">
              <Label htmlFor="negative-prompt" className="flex items-center gap-1 text-sm font-medium">
                负面提示词（可选）
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>描述你不希望出现在图像中的内容。请使用英文输入。</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="negative-prompt"
                placeholder="请使用英文描述你不希望出现在图像中的内容..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="focus-visible:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground italic">
                例如：&ldquo;blurry, distorted, low quality, unnatural pose&rdquo;
              </p>
            </div>

            {/* 图像风格 */}
            <div className="space-y-3">
              <div className="text-sm font-medium flex items-center gap-1">
                图像风格
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>选择图像的艺术风格</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Tabs
                value={imageStyle}
                onValueChange={(value) => setImageStyle(value)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 w-full">
                  {styleOptions.map((style) => (
                    <TabsTrigger key={style.value} value={style.value} className="text-xs sm:text-sm">
                      {style.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* 生成步数 */}
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium flex items-center gap-1">
                  生成步数
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>支持 4-8 步生成，步数越高质量越好但速度越慢</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm font-medium text-primary">{generationSteps}</div>
              </div>
              <Slider
                value={[generationSteps]}
                min={4}
                max={8}
                step={1}
                onValueChange={(value) => setGenerationSteps(value[0])}
                className="py-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>速度优先</span>
                <span>质量优先</span>
              </div>
            </div>

            {/* 生成按钮 */}
            <Button 
              onClick={() => generateImage()} 
              className="w-full h-11 mt-2 transition-all"
              size="lg"
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
        <Card className="lg:col-span-2 shadow-sm border-muted/60 h-fit">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ImageIcon className="h-5 w-5 text-primary" />
                生成结果
              </CardTitle>
              {generatedImage && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyImageToClipboard()}
                    className="hidden sm:flex items-center gap-1.5"
                  >
                    <Copy className="h-4 w-4" />
                    复制
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadImage('png')}
                    disabled={isDownloading}
                    className="hidden sm:flex items-center gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    {isDownloading ? "下载中..." : "下载"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">更多选项</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>图像选项</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="sm:hidden" onClick={() => copyImageToClipboard()}>
                        <Copy className="h-4 w-4 mr-2" />
                        复制到剪贴板
                      </DropdownMenuItem>
                      <DropdownMenuItem className="sm:hidden" onClick={() => downloadImage('png')}>
                        <Download className="h-4 w-4 mr-2" />
                        下载图像
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadImage('png')}>
                        <Download className="h-4 w-4 mr-2" />
                        下载为 PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadImage('jpg')}>
                        <Download className="h-4 w-4 mr-2" />
                        下载为 JPG
                      </DropdownMenuItem>
                      {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <DropdownMenuItem onClick={shareImage}>
                          <Share2 className="h-4 w-4 mr-2" />
                          分享图像
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[450px] bg-muted/30 rounded-md p-4 transition-all">
            {generatedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={generatedImage}
                  alt="AI 生成的图像"
                  className="max-w-full max-h-[450px] object-contain rounded-sm shadow-md"
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground animate-pulse">
                <ImageIcon className="h-16 w-16 mx-auto mb-3 opacity-40" />
                <p className="text-sm">生成的图像将显示在这里</p>
                <p className="text-xs mt-2 max-w-md mx-auto">填写左侧表单并点击生成图像按钮开始创作</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用提示 */}
      <Card className="shadow-sm border-muted/60 mt-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            关于 FLUX.1 模型
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-2">
                    <p>FLUX.1 是一个 12B 参数的文本到图像生成模型，具有以下特点：</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>高质量输出和出色的提示词跟随能力</li>
                      <li>使用潜在对抗扩散蒸馏训练，可以在 4-8 步内生成高质量图像</li>
                      <li>支持多种艺术风格和详细的文本描述</li>
                    </ul>
                    <p>提示：使用详细的英文描述，包括场景、颜色、光线等细节，可以获得更好的生成效果。</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-medium">提示词技巧</h3>
              <p>使用英文提示词可以获得更好的生成效果。提示词越详细，生成的图像质量越高。</p>
              <p className="text-muted-foreground text-xs">
                在描述中包含场景、颜色、光线、材质等细节，可以让 AI 更好地理解你想要的效果。
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">最佳实践</h3>
              <p>尝试不同的风格和生成步数，找到最适合你需求的组合。</p>
              <p className="text-muted-foreground text-xs">
                负面提示词可以帮助避免不需要的元素出现在图像中，提高生成质量。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用通用 Turnstile 验证组件 */}
      <TurnstileVerification
        open={showTurnstile}
        onOpenChange={setShowTurnstile}
        onVerify={(token) => {
          // 立即使用令牌生成图像，而不是等待状态更新
          setTurnstileToken(token);
          // 关闭验证对话框
          setShowTurnstile(false);
          // 直接使用令牌调用生成函数
          setTimeout(() => {
            generateImage(token);
          }, 100);
        }}
        // 不再需要 onSuccess，因为我们在 onVerify 中直接处理
        autoClose={false}
      />
    </div>
  );
}
