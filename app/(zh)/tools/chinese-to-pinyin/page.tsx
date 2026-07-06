"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Languages, Settings, RotateCcw } from "lucide-react";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

type ToneStyle = "marks" | "numbers" | "none";

export default function ChineseToPinyinPage() {
  const isEnglish = useLocale() === englishLocale;
  const textCopy = isEnglish
    ? {
        empty: "Enter Chinese text to convert.",
        failed: "Conversion failed",
        success: "Conversion complete",
        copied: "Copied to clipboard",
        reset: "Settings reset",
        title: "Text conversion",
        description: "Enter Chinese text and choose conversion options.",
        inputTitle: "Input Chinese",
        example: "Example",
        resetButton: "Reset",
        placeholder:
          "Paste or enter Chinese text, for example: 我爱学习中文。",
        options: "Conversion options",
        toneStyle: "Tone style",
        marks: "Tone marks",
        numbers: "Tone numbers",
        none: "No tones",
        separator: "Separator",
        separatorPlaceholder: "Default space",
        capitalize: "Capitalize first letter",
        heteronym: "Show heteronyms",
        convert: "Convert",
        copyResult: "Copy result",
        result: "Conversion result",
        noResult: "No result yet",
      }
    : {
        empty: "请输入要转换的中文文本",
        failed: "转换失败",
        success: "转换成功",
        copied: "已复制到剪贴板",
        reset: "设置已重置",
        title: "文本转换",
        description: "输入中文文本并选择转换选项",
        inputTitle: "输入中文",
        example: "示例",
        resetButton: "重置",
        placeholder: "在此粘贴或输入中文文本，例如：我爱学习中文。",
        options: "转换选项",
        toneStyle: "音调样式",
        marks: "标注音调",
        numbers: "数字音调",
        none: "无音调",
        separator: "分隔符",
        separatorPlaceholder: "默认空格",
        capitalize: "首字母大写",
        heteronym: "显示多音字",
        convert: "转换",
        copyResult: "复制结果",
        result: "转换结果",
        noResult: "暂无结果",
      };
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [toneStyle, setToneStyle] = useState<ToneStyle>("marks");
  const [separator, setSeparator] = useState(" ");
  const [capitalize, setCapitalize] = useState(false);
  const [heteronym, setHeteronym] = useState(false);

  const convert = async () => {
    if (!text.trim()) {
      toast.error(textCopy.empty);
      return;
    }
    try {
      const res = await fetch("/api/chinese-to-pinyin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          options: { toneStyle, separator, capitalize, heteronym },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || textCopy.failed);
      }
      const data = await res.json();
      setResult(data?.pinyin || "");
      toast.success(textCopy.success);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    toast.success(textCopy.copied);
  };

  const loadExample = () => {
    const ex = "重庆火锅很好吃！我爱北京天安门，汉字转拼音测试。";
    setText(ex);
    setResult("");
  };

  const resetAll = () => {
    setText("");
    setResult("");
    setToneStyle("marks");
    setSeparator(" ");
    setCapitalize(false);
    setHeteronym(false);
    toast.success(textCopy.reset);
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {textCopy.title}
          </CardTitle>
          <CardDescription>{textCopy.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">{textCopy.inputTitle}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadExample}>
                    {textCopy.example}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetAll}>
                    <RotateCcw data-icon="inline-start" />
                    {textCopy.resetButton}
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder={textCopy.placeholder}
                value={text}
                onChange={e => setText(e.target.value)}
                className="min-h-[240px]"
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <div className="text-sm font-medium">{textCopy.options}</div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm">{textCopy.toneStyle}</span>
                <Tabs
                  value={toneStyle}
                  onValueChange={v => setToneStyle(v as ToneStyle)}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="marks">{textCopy.marks}</TabsTrigger>
                    <TabsTrigger value="numbers">{textCopy.numbers}</TabsTrigger>
                    <TabsTrigger value="none">{textCopy.none}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="separator" className="text-sm">
                  {textCopy.separator}
                </Label>
                <Input
                  id="separator"
                  value={separator}
                  onChange={e => setSeparator(e.target.value)}
                  placeholder={textCopy.separatorPlaceholder}
                  className="max-w-[180px]"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="capitalize"
                    checked={capitalize}
                    onCheckedChange={setCapitalize}
                  />
                  <Label htmlFor="capitalize" className="text-sm">
                    {textCopy.capitalize}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="heteronym"
                    checked={heteronym}
                    onCheckedChange={setHeteronym}
                  />
                  <Label htmlFor="heteronym" className="text-sm">
                    {textCopy.heteronym}
                  </Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={convert} className="min-w-[120px]">
                  {textCopy.convert}
                </Button>
                {result && (
                  <Button
                    variant="outline"
                    onClick={copyResult}
                    className="min-w-[120px]"
                  >
                    <Copy data-icon="inline-start" />
                    {textCopy.copyResult}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">{textCopy.result}</div>
            <div className="min-h-[120px] p-4 border rounded-md bg-muted/50 flex items-start justify-between">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words mr-2">
                {result || textCopy.noResult}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
