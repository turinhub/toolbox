"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileUp, Download, Trash2, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";

export default function ImageToIcoPage() {
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
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      toast.error("请选择有效的图片文件（PNG、JPEG、GIF、WEBP、BMP）");
      return;
    }

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error("文件大小不能超过5MB");
      return;
    }

    setSelectedFile(file);
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
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
      fileInputRef.current.value = '';
    }
  };

  // 转换图片为ICO
  const convertToIco = async () => {
    if (!selectedFile) {
      toast.error("请先选择一个图片文件");
      return;
    }

    setIsConverting(true);

    try {
      // 创建一个canvas元素来处理图像
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("无法创建Canvas上下文");
      }
      
      // 设置canvas大小为选择的图标尺寸
      canvas.width = iconSize;
      canvas.height = iconSize;
      
      // 创建图像对象
      const img = document.createElement('img');
      
      // 等待图像加载
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("图像加载失败"));
        img.src = previewUrl as string;
      });
      
      // 在canvas上绘制调整大小的图像
      ctx.drawImage(img, 0, 0, iconSize, iconSize);
      
      // 将canvas转换为Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error("无法创建Blob"));
          }
        }, 'image/png');
      });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      
      toast.success("图片已成功转换为ICO格式");
    } catch (error) {
      console.error(error);
      toast.error(`转换失败: ${(error as Error).message}`);
    } finally {
      setIsConverting(false);
    }
  };

  // 下载转换后的ICO文件
  const downloadIco = () => {
    if (!resultUrl) return;
    
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${selectedFile?.name.split('.')[0] || 'icon'}.ico`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">图片转ICO</h1>
        <p className="text-muted-foreground">
          将PNG、JPEG、GIF等图片格式转换为ICO图标文件
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 上传区域 */}
        <Card>
          <CardHeader>
            <CardTitle>选择图片</CardTitle>
            <CardDescription>
              支持PNG、JPEG、GIF、WEBP、BMP格式，最大5MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <Label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">点击上传</span> 或拖放
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF, WEBP, BMP (最大 5MB)
                  </p>
                </div>
                {selectedFile && (
                  <div className="text-center mt-2">
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
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
                  <Trash2 className="mr-2 h-4 w-4" />
                  清除文件
                </Button>
              </div>
            )}

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="icon-size">图标尺寸: {iconSize}x{iconSize}px</Label>
                <Slider
                  id="icon-size"
                  min={16}
                  max={256}
                  step={16}
                  value={[iconSize]}
                  onValueChange={(value) => setIconSize(value[0])}
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
                {isConverting ? "转换中..." : "转换为ICO"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 预览和下载区域 */}
        <Card>
          <CardHeader>
            <CardTitle>预览</CardTitle>
            <CardDescription>
              预览和下载转换后的ICO图标
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-gray-50 dark:bg-gray-700">
              {previewUrl ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Image
                      src={resultUrl || previewUrl || ""}
                      alt="预览"
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
                    <p className="text-sm text-gray-500">
                      {resultUrl ? `${iconSize}x${iconSize}px` : '原始图片'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-10 h-10 mb-3" />
                  <p className="text-sm">暂无预览</p>
                </div>
              )}
            </div>

            {resultUrl && (
              <Button
                onClick={downloadIco}
                className="w-full"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                下载ICO文件
              </Button>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              <h3 className="font-medium mb-2">关于ICO格式</h3>
              <p>ICO是Windows系统使用的图标文件格式，通常用于网站favicon和应用程序图标。</p>
              <p className="mt-2">常见尺寸：16x16, 32x32, 48x48, 64x64, 128x128, 256x256像素。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 