"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  QrCode,
  Download,
  Copy,
  Link,
  Smartphone,
  Wifi,
  Mail,
  Upload,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 二维码示例
const qrExamples = [
  {
    title: "网站链接",
    content: "https://www.example.com",
    description: "生成网站链接的二维码",
    icon: Link,
  },
  {
    title: "WiFi 连接",
    content: "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;",
    description: "生成 WiFi 连接信息的二维码",
    icon: Wifi,
  },
  {
    title: "邮箱地址",
    content: "mailto:example@email.com",
    description: "生成邮箱地址的二维码",
    icon: Mail,
  },
  {
    title: "电话号码",
    content: "tel:+86-138-0013-8000",
    description: "生成电话号码的二维码",
    icon: Smartphone,
  },
];

export default function QRGeneratorPage() {
  const [input, setInput] = useState("");
  const [qrDataURL, setQrDataURL] = useState("");
  const [size, setSize] = useState([256]);
  const [errorLevel, setErrorLevel] = useState("M");
  const [isGenerating, setIsGenerating] = useState(false);
  const [centerImageType, setCenterImageType] = useState<"none" | "upload">(
    "none"
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [centerImageSize, setCenterImageSize] = useState([20]); // 中心图片大小百分比
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片上传
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB 限制
        toast.error("图片大小不能超过 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        setUploadedImage(e.target?.result as string);
        setCenterImageType("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  // 生成二维码
  const generateQR = async () => {
    if (!input.trim()) {
      toast.error("请输入要生成二维码的内容");
      return;
    }

    setIsGenerating(true);

    try {
      // 动态导入 qrcode 库
      const QRCode = (await import("qrcode")).default;

      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas 元素未找到");
      }

      // 生成二维码到 canvas
      await QRCode.toCanvas(canvas, input, {
        width: size[0],
        errorCorrectionLevel: errorLevel as "L" | "M" | "Q" | "H",
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // 如果需要添加中心图片
      if (centerImageType !== "none") {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const centerImg = new Image();
          centerImg.crossOrigin = "anonymous";

          centerImg.onload = () => {
            const qrSize = size[0];
            const imgSize = (qrSize * centerImageSize[0]) / 100;
            const x = (qrSize - imgSize) / 2;
            const y = (qrSize - imgSize) / 2;

            // 绘制白色背景方形
            ctx.fillStyle = "white";
            const padding = 12;
            ctx.fillRect(
              qrSize / 2 - imgSize / 2 - padding,
              qrSize / 2 - imgSize / 2 - padding,
              imgSize + padding * 2,
              imgSize + padding * 2
            );

            // 绘制图片
            ctx.drawImage(centerImg, x, y, imgSize, imgSize);

            // 更新 DataURL
            const dataURL = canvas.toDataURL("image/png");
            setQrDataURL(dataURL);
          };

          // 设置图片源
          if (centerImageType === "upload" && uploadedImage) {
            centerImg.src = uploadedImage;
          }
        }
      } else {
        // 获取 DataURL
        const dataURL = canvas.toDataURL("image/png");
        setQrDataURL(dataURL);
      }

      toast.success("二维码生成成功");
    } catch (error) {
      console.error(error);
      toast.error(`二维码生成失败: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载二维码
  const downloadQR = () => {
    if (!qrDataURL) {
      toast.error("请先生成二维码");
      return;
    }

    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = qrDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("二维码已下载");
  };

  // 复制二维码图片
  const copyQRImage = async () => {
    if (!qrDataURL) {
      toast.error("请先生成二维码");
      return;
    }

    try {
      // 将 DataURL 转换为 Blob
      const response = await fetch(qrDataURL);
      const blob = await response.blob();

      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      toast.success("二维码图片已复制到剪贴板");
    } catch (error) {
      console.error(error);
      toast.error("复制失败，请手动保存图片");
    }
  };

  // 使用示例
  const handleUseExample = (content: string) => {
    setInput(content);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <QrCode className="h-8 w-8 text-primary" />
          二维码生成器
        </h1>
        <p className="text-muted-foreground">
          根据链接或文本内容生成二维码，支持多种格式和自定义设置
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 输入区域 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>输入内容</CardTitle>
              <CardDescription>
                输入要生成二维码的链接或文本内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input">内容</Label>
                <Textarea
                  id="input"
                  placeholder="请输入链接或文本内容，例如：https://www.example.com"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateQR}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? "生成中..." : "生成二维码"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 设置选项 */}
          <Card>
            <CardHeader>
              <CardTitle>生成设置</CardTitle>
              <CardDescription>自定义二维码的大小和容错级别</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>尺寸: {size[0]}px</Label>
                <Slider
                  value={size}
                  onValueChange={setSize}
                  max={512}
                  min={128}
                  step={32}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="error-level">容错级别</Label>
                <Select value={errorLevel} onValueChange={setErrorLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L - 低 (~7%)</SelectItem>
                    <SelectItem value="M">M - 中 (~15%)</SelectItem>
                    <SelectItem value="Q">Q - 高 (~25%)</SelectItem>
                    <SelectItem value="H">H - 最高 (~30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 中心图片设置 */}
          <Card>
            <CardHeader>
              <CardTitle>中心图片</CardTitle>
              <CardDescription>为二维码添加中心图片或图标</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={centerImageType}
                onValueChange={value =>
                  setCenterImageType(value as "none" | "upload")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="none">无图片</TabsTrigger>
                  <TabsTrigger value="upload">上传图片</TabsTrigger>
                </TabsList>

                <TabsContent value="none" className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    不添加中心图片，生成纯二维码
                  </p>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-2">
                    <Label>上传图片</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        选择图片
                      </Button>
                    </div>
                    {uploadedImage && (
                      <div className="flex justify-center">
                        <img
                          src={uploadedImage}
                          alt="Uploaded preview"
                          className="h-16 w-16 object-cover rounded border"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      支持 JPG、PNG 格式，文件大小不超过 5MB
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {centerImageType !== "none" && (
                <div className="space-y-2">
                  <Label>图片大小: {centerImageSize[0]}%</Label>
                  <Slider
                    value={centerImageSize}
                    onValueChange={setCenterImageSize}
                    max={30}
                    min={10}
                    step={2}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    建议大小为 10-25%，过大可能影响二维码识别
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 常用示例 */}
          <Card>
            <CardHeader>
              <CardTitle>常用示例</CardTitle>
              <CardDescription>点击使用常见的二维码内容格式</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {qrExamples.map((example, index) => {
                  const IconComponent = example.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3"
                      onClick={() => handleUseExample(example.content)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <div className="text-left flex-1">
                          <div className="font-medium text-sm">
                            {example.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {example.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 输出区域 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>生成结果</CardTitle>
              <CardDescription>生成的二维码图片</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Canvas 用于生成二维码 */}
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* 显示二维码 */}
                <div className="flex justify-center">
                  {qrDataURL ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      <img
                        src={qrDataURL}
                        alt="Generated QR Code"
                        className="max-w-full h-auto"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                      <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>请输入内容并生成二维码</p>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                {qrDataURL && (
                  <div className="flex gap-2">
                    <Button
                      onClick={downloadQR}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下载
                    </Button>
                    <Button
                      onClick={copyQRImage}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      复制图片
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <strong>支持的内容类型：</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>网站链接 (http:// 或 https://)</li>
                  <li>WiFi 连接信息</li>
                  <li>邮箱地址 (mailto:)</li>
                  <li>电话号码 (tel:)</li>
                  <li>纯文本内容</li>
                </ul>
              </div>
              <div>
                <strong>容错级别说明：</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>L - 低容错，适合清晰环境</li>
                  <li>M - 中等容错，推荐使用</li>
                  <li>Q - 高容错，适合可能有遮挡的情况</li>
                  <li>H - 最高容错，适合恶劣环境</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
