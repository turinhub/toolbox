"use client";

import { useState, useRef, ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileUp, Download, Trash2, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

export default function ImageToIcoPage() {
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  });
  const copy = isEnglish
    ? {
        invalidType: "Select a valid image file (PNG, JPEG, GIF, WEBP, BMP).",
        tooLarge: "File size must be 5 MB or less.",
        selectFirst: "Select an image file first.",
        canvasError: "Could not create a Canvas context.",
        imageLoadError: "Image failed to load.",
        blobError: "Could not create a Blob.",
        converted: "Image converted to ICO format.",
        failed: "Conversion failed: {message}",
        selectTitle: "Select image",
        selectDescription:
          "Supports PNG, JPEG, GIF, WEBP, and BMP files up to 5 MB.",
        clickUpload: "Click to upload",
        dragDrop: "or drag and drop",
        fileHint: "PNG, JPG, GIF, WEBP, BMP (max 5 MB)",
        clearFile: "Clear file",
        iconSize: "Icon size: {size}x{size}px",
        converting: "Converting...",
        convert: "Convert to ICO",
        previewTitle: "Preview",
        previewDescription: "Preview and download the converted ICO icon.",
        previewAlt: "Preview",
        originalImage: "Original image",
        noPreview: "No preview yet",
        download: "Download ICO file",
        aboutTitle: "About ICO format",
        aboutDescription:
          "ICO is the icon file format used by Windows, commonly for website favicons and application icons.",
        commonSizes:
          "Common sizes: 16x16, 32x32, 48x48, 64x64, 128x128, and 256x256 pixels.",
      }
    : {
        invalidType: "请选择有效的图片文件（PNG、JPEG、GIF、WEBP、BMP）",
        tooLarge: "文件大小不能超过 5MB",
        selectFirst: "请先选择一个图片文件",
        canvasError: "无法创建 Canvas 上下文",
        imageLoadError: "图像加载失败",
        blobError: "无法创建 Blob",
        converted: "图片已成功转换为 ICO 格式",
        failed: "转换失败: {message}",
        selectTitle: "选择图片",
        selectDescription: "支持 PNG、JPEG、GIF、WEBP、BMP 格式，最大 5MB",
        clickUpload: "点击上传",
        dragDrop: "或拖放",
        fileHint: "PNG, JPG, GIF, WEBP, BMP (最大 5MB)",
        clearFile: "清除文件",
        iconSize: "图标尺寸: {size}x{size}px",
        converting: "转换中…",
        convert: "转换为 ICO",
        previewTitle: "预览",
        previewDescription: "预览和下载转换后的 ICO 图标",
        previewAlt: "预览",
        originalImage: "原始图片",
        noPreview: "暂无预览",
        download: "下载 ICO 文件",
        aboutTitle: "关于 ICO 格式",
        aboutDescription:
          "ICO 是 Windows 系统使用的图标文件格式，通常用于网站 favicon 和应用程序图标。",
        commonSizes:
          "常见尺寸：16x16, 32x32, 48x48, 64x64, 128x128, 256x256 像素。",
      };
  // 状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [iconSize, setIconSize] = useState<number>(32);
  const [isConverting, setIsConverting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "image/bmp",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error(copy.invalidType);
      return;
    }

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error(copy.tooLarge);
      return;
    }

    setSelectedFile(file);

    // 创建预览
    const reader = new FileReader();
    reader.onload = e => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 清除之前的结果
    setResultUrl(null);
  };

  // 清除选择的文件
  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 转换图片为ICO
  const convertToIco = async () => {
    if (!selectedFile) {
      toast.error(copy.selectFirst);
      return;
    }

    setIsConverting(true);

    try {
      // 创建一个canvas元素来处理图像
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error(copy.canvasError);
      }

      // 设置canvas大小为选择的图标尺寸
      canvas.width = iconSize;
      canvas.height = iconSize;

      // 创建图像对象
      const img = document.createElement("img");

      // 等待图像加载
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(copy.imageLoadError));
        img.src = previewUrl as string;
      });

      // 在canvas上绘制调整大小的图像
      ctx.drawImage(img, 0, 0, iconSize, iconSize);

      // 将canvas转换为Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error(copy.blobError));
          }
        }, "image/png");
      });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

      toast.success(copy.converted);
    } catch (error) {
      console.error(error);
      toast.error(copy.failed.replace("{message}", (error as Error).message));
    } finally {
      setIsConverting(false);
    }
  };

  // 下载转换后的ICO文件
  const downloadIco = () => {
    if (!resultUrl) return;

    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${selectedFile?.name.split(".")[0] || "icon"}.ico`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col container mx-auto py-6 gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 上传区域 */}
        <Card>
          <CardHeader>
            <CardTitle>{copy.selectTitle}</CardTitle>
            <CardDescription>{copy.selectDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-center w-full">
              <Label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 hover:border-muted-foreground/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">{copy.clickUpload}</span>{" "}
                    {copy.dragDrop}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {copy.fileHint}
                  </p>
                </div>
                {selectedFile && (
                  <div className="text-center mt-2">
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {numberFormatter.format(selectedFile.size / 1024)} KB
                    </p>
                  </div>
                )}
                <Input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".png,.jpg,.jpeg,.gif,.webp,.bmp"
                />
              </Label>
            </div>

            {selectedFile && (
              <div className="flex justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearFile}
                  className="mt-2"
                >
                  <Trash2 data-icon="inline-start" />
                  {copy.clearFile}
                </Button>
              </div>
            )}

            <div className="flex flex-col mt-4 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="icon-size">
                  {copy.iconSize.replaceAll("{size}", String(iconSize))}
                </Label>
                <Slider
                  id="icon-size"
                  min={16}
                  max={256}
                  step={16}
                  value={[iconSize]}
                  onValueChange={value => setIconSize(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>16px</span>
                  <span>256px</span>
                </div>
              </div>

              <Button
                onClick={convertToIco}
                disabled={!selectedFile || isConverting}
                className="w-full"
              >
                {isConverting ? copy.converting : copy.convert}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 预览和下载区域 */}
        <Card>
          <CardHeader>
            <CardTitle>{copy.previewTitle}</CardTitle>
            <CardDescription>{copy.previewDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-grid-pattern overflow-hidden">
              {previewUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Image
                      src={resultUrl || previewUrl || ""}
                      alt={copy.previewAlt}
                      width={resultUrl ? iconSize : 160}
                      height={resultUrl ? iconSize : 160}
                      className="object-contain max-h-40"
                      unoptimized
                    />
                    {resultUrl && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full px-2 py-1">
                        ICO
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {resultUrl
                        ? `${iconSize}x${iconSize}px`
                        : copy.originalImage}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-10 h-10 mb-3" />
                  <p className="text-sm">{copy.noPreview}</p>
                </div>
              )}
            </div>

            {resultUrl && (
              <Button
                onClick={downloadIco}
                className="w-full"
                variant="outline"
              >
                <Download data-icon="inline-start" />
                {copy.download}
              </Button>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              <h3 className="font-medium mb-2">{copy.aboutTitle}</h3>
              <p>{copy.aboutDescription}</p>
              <p className="mt-2">{copy.commonSizes}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
