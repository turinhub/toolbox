"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import vkbeautify from "vkbeautify";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?><note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don&apos;t forget me this weekend!</body></note>`;

export default function XMLFormatter() {
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        input: "Input",
        output: "Output",
        placeholder: "Enter XML to format...",
        format: "Format",
        minify: "Minify",
        clear: "Clear",
        copyResult: "Copy result",
        helpTitle: "How to use",
        help: [
          "Paste XML code into the input area on the left.",
          'Click "Format" to make the XML easier to read.',
          'Click "Minify" to remove whitespace and compact the XML.',
          'Click "Copy result" to copy the formatted or minified result.',
          "Invalid XML input will show an error message.",
        ],
        formatSuccess: "XML formatted",
        minifySuccess: "XML minified",
        invalid: "Invalid XML. Check the input.",
        copied: "Copied to clipboard",
        cleared: "Content cleared",
      }
    : {
        input: "输入",
        output: "输出",
        placeholder: "请输入需要格式化的 XML…",
        format: "格式化",
        minify: "压缩",
        clear: "清空",
        copyResult: "复制结果",
        helpTitle: "使用说明",
        help: [
          "在左侧输入框中粘贴需要格式化的 XML 代码",
          '点击"格式化"按钮将自动格式化 XML，使其更易读',
          '点击"压缩"按钮将移除所有空白字符，使 XML 更紧凑',
          '点击"复制结果"按钮可以复制格式化或压缩后的结果',
          "如果输入的 XML 格式有误，将显示错误提示",
        ],
        formatSuccess: "XML 格式化成功",
        minifySuccess: "XML 压缩成功",
        invalid: "XML 格式错误，请检查输入",
        copied: "已复制到剪贴板",
        cleared: "已清空内容",
      };
  const [input, setInput] = useState<string>(sampleXml);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");

  const formatXML = () => {
    try {
      const formatted = vkbeautify.xml(input);
      setOutput(formatted);
      setError("");
      toast.success(copy.formatSuccess);
    } catch {
      setError(copy.invalid);
      toast.error(copy.invalid);
    }
  };

  const minifyXML = () => {
    try {
      const minified = vkbeautify.xmlmin(input);
      setOutput(minified);
      setError("");
      toast.success(copy.minifySuccess);
    } catch {
      setError(copy.invalid);
      toast.error(copy.invalid);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output || input);
    toast.success(copy.copied);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
    toast.success(copy.cleared);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">{copy.input}</h2>
          <div className="flex flex-col gap-4">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              className="font-mono h-[300px]"
              placeholder={copy.placeholder}
            />
            <div className="flex gap-2">
              <Button onClick={formatXML} className="flex-1">
                {copy.format}
              </Button>
              <Button onClick={minifyXML} variant="outline" className="flex-1">
                {copy.minify}
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1"
              >
                {copy.clear}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">{copy.output}</h2>
          <div className="flex flex-col gap-4">
            <Textarea
              value={error || output || input}
              readOnly
              className={`font-mono h-[300px] ${error ? "text-destructive" : ""}`}
            />
            <Button onClick={handleCopy} className="w-full">
              {copy.copyResult}
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{copy.helpTitle}</h2>
        <ul className="flex flex-col list-disc list-inside text-muted-foreground gap-2">
          {copy.help.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
