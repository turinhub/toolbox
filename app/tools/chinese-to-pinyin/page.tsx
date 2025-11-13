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

type ToneStyle = "marks" | "numbers" | "none";

export default function ChineseToPinyinPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [toneStyle, setToneStyle] = useState<ToneStyle>("marks");
  const [separator, setSeparator] = useState(" ");
  const [capitalize, setCapitalize] = useState(false);
  const [heteronym, setHeteronym] = useState(false);

  const convert = async () => {
    if (!text.trim()) {
      toast.error("请输入要转换的中文文本");
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
        throw new Error(data?.error || "转换失败");
      }
      const data = await res.json();
      setResult(data?.pinyin || "");
      toast.success("转换成功");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    toast.success("已复制到剪贴板");
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
    toast.success("设置已重置");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">汉字转拼音</h1>
        <p className="text-muted-foreground">
          将中文文本转换为拼音，支持音调样式、分隔符、首字母大写与多音字
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            文本转换
          </CardTitle>
          <CardDescription>输入中文文本并选择转换选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">输入中文</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadExample}>
                    示例
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetAll}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    重置
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="在此粘贴或输入中文文本，例如：我爱学习中文。"
                value={text}
                onChange={e => setText(e.target.value)}
                className="min-h-[240px]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <div className="text-sm font-medium">转换选项</div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm">音调样式</span>
                <Tabs
                  value={toneStyle}
                  onValueChange={v => setToneStyle(v as ToneStyle)}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="marks">标注音调</TabsTrigger>
                    <TabsTrigger value="numbers">数字音调</TabsTrigger>
                    <TabsTrigger value="none">无音调</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="separator" className="text-sm">
                  分隔符
                </Label>
                <Input
                  id="separator"
                  value={separator}
                  onChange={e => setSeparator(e.target.value)}
                  placeholder="默认空格"
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
                    首字母大写
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="heteronym"
                    checked={heteronym}
                    onCheckedChange={setHeteronym}
                  />
                  <Label htmlFor="heteronym" className="text-sm">
                    显示多音字
                  </Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={convert} className="min-w-[120px]">
                  转换
                </Button>
                {result && (
                  <Button
                    variant="outline"
                    onClick={copy}
                    className="min-w-[120px]"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    复制结果
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">转换结果</div>
            <div className="min-h-[120px] p-4 border rounded-md bg-muted/50 flex items-start justify-between">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words mr-2">
                {result || "暂无结果"}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
