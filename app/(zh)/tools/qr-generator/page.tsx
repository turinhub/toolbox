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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

// 二维码示例
function getQrExamples(isEnglish: boolean) {
  return [
    {
      title: isEnglish ? "Website link" : "网站链接",
      content: "https://www.example.com",
      description: isEnglish
        ? "Generate a QR code for a website URL"
        : "生成网站链接的二维码",
      icon: Link,
    },
    {
      title: isEnglish ? "Wi-Fi connection" : "WiFi 连接",
      content: "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;",
      description: isEnglish
        ? "Generate a QR code for Wi-Fi connection details"
        : "生成 WiFi 连接信息的二维码",
      icon: Wifi,
    },
    {
      title: isEnglish ? "Email address" : "邮箱地址",
      content: "mailto:example@email.com",
      description: isEnglish
        ? "Generate a QR code for an email address"
        : "生成邮箱地址的二维码",
      icon: Mail,
    },
    {
      title: isEnglish ? "Phone number" : "电话号码",
      content: "tel:+1-415-555-0138",
      description: isEnglish
        ? "Generate a QR code for a phone number"
        : "生成电话号码的二维码",
      icon: Smartphone,
    },
  ];
}

export default function QRGeneratorPage() {
  const isEnglish = useLocale() === englishLocale;
  const qrExamples = getQrExamples(isEnglish);
  const copy = isEnglish
    ? {
        imageTooLarge: "Image size must be 5 MB or less.",
        emptyInput: "Enter content for the QR code.",
        canvasMissing: "Canvas element not found.",
        generated: "QR code generated.",
        generateFailed: "QR generation failed: {message}",
        generateFirst: "Generate a QR code first.",
        downloaded: "QR code downloaded.",
        copied: "QR image copied to clipboard.",
        copyFailed: "Copy failed. Save the image manually.",
        inputTitle: "Input content",
        inputDescription: "Enter a link or text content for the QR code.",
        content: "Content",
        placeholder:
          "Enter a link or text, for example: https://www.example.com",
        generating: "Generating...",
        generate: "Generate QR code",
        settingsTitle: "Generation settings",
        settingsDescription:
          "Customize the QR code size and error correction level.",
        size: "Size: {size}px",
        errorLevel: "Error correction level",
        low: "Low",
        medium: "Medium",
        high: "High",
        highest: "Highest",
        centerTitle: "Center image",
        centerDescription: "Add a center image or icon to the QR code.",
        noImage: "No image",
        uploadImage: "Upload image",
        noImageDescription: "Generate a plain QR code without a center image.",
        chooseImage: "Choose image",
        imageHint: "Supports JPG and PNG files up to 5 MB.",
        imageSize: "Image size: {size}%",
        imageSizeHint:
          "Recommended size is 10-25%. Larger images may reduce scan reliability.",
        examplesTitle: "Common examples",
        examplesDescription: "Click a common QR content format to use it.",
        resultTitle: "Generated result",
        resultDescription: "Generated QR code image.",
        emptyResult: "Enter content and generate a QR code.",
        download: "Download",
        copyImage: "Copy image",
        helpTitle: "How to use",
        supportedTypes: "Supported content types:",
        typeItems: [
          "Website links (http:// or https://)",
          "Wi-Fi connection details",
          "Email addresses (mailto:)",
          "Phone numbers (tel:)",
          "Plain text content",
        ],
        correctionTitle: "Error correction levels:",
        correctionItems: [
          "L - low correction for clean environments",
          "M - medium correction, recommended for most cases",
          "Q - high correction for possible occlusion",
          "H - highest correction for harsh environments",
        ],
      }
    : {
        imageTooLarge: "图片大小不能超过 5MB",
        emptyInput: "请输入要生成二维码的内容",
        canvasMissing: "Canvas 元素未找到",
        generated: "二维码生成成功",
        generateFailed: "二维码生成失败: {message}",
        generateFirst: "请先生成二维码",
        downloaded: "二维码已下载",
        copied: "二维码图片已复制到剪贴板",
        copyFailed: "复制失败，请手动保存图片",
        inputTitle: "输入内容",
        inputDescription: "输入要生成二维码的链接或文本内容",
        content: "内容",
        placeholder: "请输入链接或文本内容，例如：https://www.example.com",
        generating: "生成中…",
        generate: "生成二维码",
        settingsTitle: "生成设置",
        settingsDescription: "自定义二维码的大小和容错级别",
        size: "尺寸: {size}px",
        errorLevel: "容错级别",
        low: "低",
        medium: "中",
        high: "高",
        highest: "最高",
        centerTitle: "中心图片",
        centerDescription: "为二维码添加中心图片或图标",
        noImage: "无图片",
        uploadImage: "上传图片",
        noImageDescription: "不添加中心图片，生成纯二维码",
        chooseImage: "选择图片",
        imageHint: "支持 JPG、PNG 格式，文件大小不超过 5MB",
        imageSize: "图片大小: {size}%",
        imageSizeHint: "建议大小为 10-25%，过大可能影响二维码识别",
        examplesTitle: "常用示例",
        examplesDescription: "点击使用常见的二维码内容格式",
        resultTitle: "生成结果",
        resultDescription: "生成的二维码图片",
        emptyResult: "请输入内容并生成二维码",
        download: "下载",
        copyImage: "复制图片",
        helpTitle: "使用说明",
        supportedTypes: "支持的内容类型：",
        typeItems: [
          "网站链接 (http:// 或 https://)",
          "WiFi 连接信息",
          "邮箱地址 (mailto:)",
          "电话号码 (tel:)",
          "纯文本内容",
        ],
        correctionTitle: "容错级别说明：",
        correctionItems: [
          "L - 低容错，适合清晰环境",
          "M - 中等容错，推荐使用",
          "Q - 高容错，适合可能有遮挡的情况",
          "H - 最高容错，适合恶劣环境",
        ],
      };
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
        toast.error(copy.imageTooLarge);
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
      toast.error(copy.emptyInput);
      return;
    }

    setIsGenerating(true);

    try {
      // 动态导入 qrcode 库
      const QRCode = (await import("qrcode")).default;

      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error(copy.canvasMissing);
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
          const centerImg = new window.Image();
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

      toast.success(copy.generated);
    } catch (error) {
      console.error(error);
      toast.error(
        copy.generateFailed.replace("{message}", (error as Error).message)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载二维码
  const downloadQR = () => {
    if (!qrDataURL) {
      toast.error(copy.generateFirst);
      return;
    }

    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = qrDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(copy.downloaded);
  };

  // 复制二维码图片
  const copyQRImage = async () => {
    if (!qrDataURL) {
      toast.error(copy.generateFirst);
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

      toast.success(copy.copied);
    } catch (error) {
      console.error(error);
      toast.error(copy.copyFailed);
    }
  };

  // 使用示例
  const handleUseExample = (content: string) => {
    setInput(content);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 输入区域 */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{copy.inputTitle}</CardTitle>
              <CardDescription>{copy.inputDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="input">{copy.content}</Label>
                <Textarea
                  id="input"
                  placeholder={copy.placeholder}
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
                  className="flex-1 min-h-[44px]"
                >
                  {isGenerating ? copy.generating : copy.generate}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 设置选项 */}
          <Card>
            <CardHeader>
              <CardTitle>{copy.settingsTitle}</CardTitle>
              <CardDescription>{copy.settingsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>{copy.size.replace("{size}", String(size[0]))}</Label>
                <Slider
                  value={size}
                  onValueChange={setSize}
                  max={512}
                  min={128}
                  step={32}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="error-level">{copy.errorLevel}</Label>
                <Select value={errorLevel} onValueChange={setErrorLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="L">L - {copy.low} (~7%)</SelectItem>
                      <SelectItem value="M">
                        M - {copy.medium} (~15%)
                      </SelectItem>
                      <SelectItem value="Q">Q - {copy.high} (~25%)</SelectItem>
                      <SelectItem value="H">
                        H - {copy.highest} (~30%)
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 中心图片设置 */}
          <Card>
            <CardHeader>
              <CardTitle>{copy.centerTitle}</CardTitle>
              <CardDescription>{copy.centerDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Tabs
                value={centerImageType}
                onValueChange={value =>
                  setCenterImageType(value as "none" | "upload")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="none">{copy.noImage}</TabsTrigger>
                  <TabsTrigger value="upload">{copy.uploadImage}</TabsTrigger>
                </TabsList>

                <TabsContent value="none" className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    {copy.noImageDescription}
                  </p>
                </TabsContent>

                <TabsContent value="upload" className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>{copy.uploadImage}</Label>
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
                        <Upload data-icon="inline-start" />
                        {copy.chooseImage}
                      </Button>
                    </div>
                    {uploadedImage && (
                      <div className="flex justify-center">
                        <Image
                          src={uploadedImage}
                          alt="Uploaded preview"
                          width={64}
                          height={64}
                          className="object-cover rounded border"
                          unoptimized
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {copy.imageHint}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {centerImageType !== "none" && (
                <div className="flex flex-col gap-2">
                  <Label>
                    {copy.imageSize.replace(
                      "{size}",
                      String(centerImageSize[0])
                    )}
                  </Label>
                  <Slider
                    value={centerImageSize}
                    onValueChange={setCenterImageSize}
                    max={30}
                    min={10}
                    step={2}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {copy.imageSizeHint}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 常用示例 */}
          <Card>
            <CardHeader>
              <CardTitle>{copy.examplesTitle}</CardTitle>
              <CardDescription>{copy.examplesDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {qrExamples.map((example, index) => {
                  const IconComponent = example.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3 min-h-[44px]"
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
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{copy.resultTitle}</CardTitle>
              <CardDescription>{copy.resultDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Canvas 用于生成二维码 */}
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* 显示二维码 */}
                <div className="flex justify-center">
                  {qrDataURL ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-3 sm:p-4">
                      <Image
                        src={qrDataURL}
                        alt="Generated QR Code"
                        width={size[0]}
                        height={size[0]}
                        className="max-w-full h-auto"
                        style={{ imageRendering: "pixelated" }}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 text-center text-muted-foreground">
                      <QrCode className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">
                        {copy.emptyResult}
                      </p>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                {qrDataURL && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={downloadQR}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download data-icon="inline-start" />
                      {copy.download}
                    </Button>
                    <Button
                      onClick={copyQRImage}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy data-icon="inline-start" />
                      {copy.copyImage}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <CardTitle>{copy.helpTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col text-sm text-muted-foreground gap-3">
              <div>
                <strong>{copy.supportedTypes}</strong>
                <ul className="flex flex-col list-disc list-inside mt-1 gap-1">
                  {copy.typeItems.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>{copy.correctionTitle}</strong>
                <ul className="flex flex-col list-disc list-inside mt-1 gap-1">
                  {copy.correctionItems.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
