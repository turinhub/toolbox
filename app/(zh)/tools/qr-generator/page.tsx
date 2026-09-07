"use client";

import { useEffect, useState, useRef } from "react";
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
import { useLocale, useTranslations } from "next-intl";
import { englishLocale } from "@/i18n/config";
import {
  readQrImageFile,
  renderQrCode,
  type QrRenderOptions,
} from "@/lib/qr-generator";

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
  const t = useTranslations("qrGenerator");
  const [input, setInput] = useState("");
  const [qrDataURL, setQrDataURL] = useState("");
  const [size, setSize] = useState([256]);
  const [errorLevel, setErrorLevel] =
    useState<QrRenderOptions["errorCorrectionLevel"]>("M");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [centerImageType, setCenterImageType] = useState<"none" | "upload">(
    "none"
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [centerImageSize, setCenterImageSize] = useState([20]);
  const [contentError, setContentError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [resultInvalidated, setResultInvalidated] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);
  const generationRef = useRef<AbortController | null>(null);
  const uploadRef = useRef<AbortController | null>(null);
  const revisionRef = useRef(0);

  useEffect(
    () => () => {
      revisionRef.current += 1;
      generationRef.current?.abort();
      uploadRef.current?.abort();
      generationRef.current = null;
      uploadRef.current = null;
    },
    []
  );

  const invalidateResult = () => {
    revisionRef.current += 1;
    generationRef.current?.abort();
    uploadRef.current?.abort();
    generationRef.current = null;
    uploadRef.current = null;
    setIsGenerating(false);
    setIsUploading(false);
    setResultInvalidated(value => value || Boolean(qrDataURL) || isGenerating);
    setQrDataURL("");
    setContentError(null);
  };

  const updateInput = (value: string) => {
    invalidateResult();
    setInput(value);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    invalidateResult();
    setUploadedImage(null);
    setImageError(null);

    if (file.size > 5 * 1024 * 1024) {
      setImageError(t("imageTooLarge"));
      toast.error(t("imageTooLarge"));
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setImageError(t("imageInvalidType"));
      toast.error(t("imageInvalidType"));
      return;
    }

    const controller = new AbortController();
    uploadRef.current = controller;
    setIsUploading(true);
    try {
      const image = await readQrImageFile(file, controller.signal);
      if (controller.signal.aborted || uploadRef.current !== controller) return;
      setUploadedImage(image);
      toast.success(t("imageUploaded"));
    } catch {
      if (controller.signal.aborted || uploadRef.current !== controller) return;
      setImageError(t("imageReadFailed"));
      toast.error(t("imageReadFailed"));
    } finally {
      if (uploadRef.current === controller) {
        uploadRef.current = null;
        setIsUploading(false);
      }
    }
  };

  const generateQR = async () => {
    invalidateResult();
    if (!input.trim()) {
      setContentError(t("emptyInput"));
      inputRef.current?.focus();
      return;
    }
    if (centerImageType === "upload" && !uploadedImage) {
      setImageError(t("imageRequired"));
      imageButtonRef.current?.focus();
      return;
    }

    setImageError(null);
    const controller = new AbortController();
    generationRef.current = controller;
    setIsGenerating(true);
    try {
      const dataURL = await renderQrCode(
        {
          content: input,
          size: size[0],
          errorCorrectionLevel: errorLevel,
          centerImage: centerImageType === "upload" ? uploadedImage : null,
          centerImageSize: centerImageSize[0],
        },
        controller.signal
      );
      if (controller.signal.aborted || generationRef.current !== controller)
        return;
      setQrDataURL(dataURL);
      setResultInvalidated(false);
      toast.success(t("generated"));
    } catch {
      if (controller.signal.aborted || generationRef.current !== controller)
        return;
      setContentError(t("generationError"));
      toast.error(t("generationError"));
    } finally {
      if (generationRef.current === controller) {
        generationRef.current = null;
        setIsGenerating(false);
      }
    }
  };

  const downloadQR = () => {
    if (!qrDataURL) return;
    try {
      const link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = qrDataURL;
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
      toast.success(t("downloaded"));
    } catch {
      toast.error(t("downloadFailed"));
    }
  };

  const copyQRImage = async () => {
    if (!qrDataURL) return;
    const revision = revisionRef.current;
    try {
      const response = await fetch(qrDataURL);
      const blob = await response.blob();
      if (revision !== revisionRef.current) return;
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success(t("copied"));
    } catch {
      if (revision !== revisionRef.current) return;
      toast.error(t("copyFailed"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 输入区域 */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("inputTitle")}</CardTitle>
              <CardDescription>{t("inputDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="input">{t("content")}</Label>
                <Textarea
                  ref={inputRef}
                  id="input"
                  name="qr-content"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(contentError)}
                  aria-describedby={
                    contentError ? "qr-content-error" : undefined
                  }
                  placeholder={t("placeholder")}
                  value={input}
                  onChange={e => updateInput(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {contentError && (
                <p
                  id="qr-content-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {contentError}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={generateQR}
                  disabled={isGenerating || isUploading}
                  className="flex-1 min-h-[44px]"
                >
                  {isUploading
                    ? t("readingImage")
                    : isGenerating
                      ? t("generating")
                      : t("generate")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 设置选项 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settingsTitle")}</CardTitle>
              <CardDescription>{t("settingsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>{t("size", { size: size[0] })}</Label>
                <Slider
                  value={size}
                  onValueChange={value => {
                    invalidateResult();
                    setSize(value);
                  }}
                  max={512}
                  min={128}
                  step={32}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="error-level">{t("errorLevel")}</Label>
                <Select
                  value={errorLevel}
                  onValueChange={value => {
                    invalidateResult();
                    setErrorLevel(
                      value as QrRenderOptions["errorCorrectionLevel"]
                    );
                  }}
                >
                  <SelectTrigger id="error-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="L">L - {t("low")} (~7%)</SelectItem>
                      <SelectItem value="M">
                        M - {t("medium")} (~15%)
                      </SelectItem>
                      <SelectItem value="Q">Q - {t("high")} (~25%)</SelectItem>
                      <SelectItem value="H">
                        H - {t("highest")} (~30%)
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
              <CardTitle>{t("centerTitle")}</CardTitle>
              <CardDescription>{t("centerDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Tabs
                value={centerImageType}
                onValueChange={value => {
                  invalidateResult();
                  setImageError(null);
                  setCenterImageType(value as "none" | "upload");
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="none">{t("noImage")}</TabsTrigger>
                  <TabsTrigger value="upload">{t("uploadImage")}</TabsTrigger>
                </TabsList>

                <TabsContent value="none" className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    {t("noImageDescription")}
                  </p>
                </TabsContent>

                <TabsContent value="upload" className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="qr-center-image">{t("uploadImage")}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        id="qr-center-image"
                        name="qr-center-image"
                        type="file"
                        accept="image/png,image/jpeg"
                        aria-invalid={Boolean(imageError)}
                        aria-describedby={
                          imageError ? "qr-image-error" : undefined
                        }
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        ref={imageButtonRef}
                        variant="outline"
                        aria-describedby={
                          imageError ? "qr-image-error" : undefined
                        }
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload data-icon="inline-start" />
                        {t("chooseImage")}
                      </Button>
                    </div>
                    {isUploading && (
                      <p
                        role="status"
                        className="text-sm text-muted-foreground"
                      >
                        {t("readingImage")}
                      </p>
                    )}
                    {imageError && (
                      <p
                        id="qr-image-error"
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        {imageError}
                      </p>
                    )}
                    {uploadedImage && (
                      <div className="flex justify-center">
                        <Image
                          src={uploadedImage}
                          alt={t("imageAlt")}
                          width={64}
                          height={64}
                          className="object-cover rounded border"
                          unoptimized
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("imageHint")}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {centerImageType !== "none" && (
                <div className="flex flex-col gap-2">
                  <Label>{t("imageSize", { size: centerImageSize[0] })}</Label>
                  <Slider
                    value={centerImageSize}
                    onValueChange={value => {
                      invalidateResult();
                      setCenterImageSize(value);
                    }}
                    max={30}
                    min={10}
                    step={2}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("imageSizeHint")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 常用示例 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("examplesTitle")}</CardTitle>
              <CardDescription>{t("examplesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid min-w-0 gap-2">
                {qrExamples.map((example, index) => {
                  const IconComponent = example.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto min-h-[44px] w-full min-w-0 justify-start whitespace-normal p-3"
                      onClick={() => updateInput(example.content)}
                    >
                      <div className="flex w-full min-w-0 items-start gap-3">
                        <IconComponent
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1 break-words text-left">
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
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("resultTitle")}</CardTitle>
              <CardDescription>{t("resultDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* 显示二维码 */}
                <div className="flex justify-center">
                  {qrDataURL ? (
                    <div className="min-w-0 max-w-full rounded-lg border-2 border-dashed border-border p-3 sm:p-4">
                      <Image
                        src={qrDataURL}
                        alt={t("resultAlt")}
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
                      <p role="status" className="text-sm sm:text-base">
                        {isGenerating
                          ? t("generating")
                          : resultInvalidated
                            ? t("settingsChanged")
                            : t("emptyResult")}
                      </p>
                    </div>
                  )}
                </div>

                {qrDataURL && (
                  <p role="status" className="text-sm text-muted-foreground">
                    {t("resultReady")}
                  </p>
                )}
                {/* 操作按钮 */}
                {qrDataURL && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={downloadQR}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download data-icon="inline-start" />
                      {t("download")}
                    </Button>
                    <Button
                      onClick={copyQRImage}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy data-icon="inline-start" />
                      {t("copyImage")}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("helpTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col text-sm text-muted-foreground gap-3">
              <div>
                <strong>{t("supportedTypes")}</strong>
                <ul className="flex flex-col list-disc list-inside mt-1 gap-1">
                  {(t.raw("typeItems") as string[]).map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>{t("correctionTitle")}</strong>
                <ul className="flex flex-col list-disc list-inside mt-1 gap-1">
                  {(t.raw("correctionItems") as string[]).map(item => (
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
