"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import vkbeautify from "vkbeautify";

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?><note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don&apos;t forget me this weekend!</body></note>`;

export default function XMLFormatter() {
  const [input, setInput] = useState<string>(sampleXml);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");

  const formatXML = () => {
    try {
      const formatted = vkbeautify.xml(input);
      setOutput(formatted);
      setError("");
      toast.success("XML 格式化成功");
    } catch {
      setError("XML 格式错误，请检查输入");
      toast.error("XML 格式错误，请检查输入");
    }
  };

  const minifyXML = () => {
    try {
      const minified = vkbeautify.xmlmin(input);
      setOutput(minified);
      setError("");
      toast.success("XML 压缩成功");
    } catch {
      setError("XML 格式错误，请检查输入");
      toast.error("XML 格式错误，请检查输入");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output || input);
    toast.success("已复制到剪贴板");
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
    toast.success("已清空内容");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">XML 格式化</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">输入</h2>
          <div className="space-y-4">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              className="font-mono h-[300px]"
              placeholder="请输入需要格式化的 XML..."
            />
            <div className="flex gap-2">
              <Button onClick={formatXML} className="flex-1">
                格式化
              </Button>
              <Button onClick={minifyXML} variant="outline" className="flex-1">
                压缩
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1"
              >
                清空
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">输出</h2>
          <div className="space-y-4">
            <Textarea
              value={error || output || input}
              readOnly
              className={`font-mono h-[300px] ${error ? "text-destructive" : ""}`}
            />
            <Button onClick={handleCopy} className="w-full">
              复制结果
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">使用说明</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>在左侧输入框中粘贴需要格式化的 XML 代码</li>
          <li>点击&quot;格式化&quot;按钮将自动格式化 XML，使其更易读</li>
          <li>点击&quot;压缩&quot;按钮将移除所有空白字符，使 XML 更紧凑</li>
          <li>点击&quot;复制结果&quot;按钮可以复制格式化或压缩后的结果</li>
          <li>如果输入的 XML 格式有误，将显示错误提示</li>
        </ul>
      </div>
    </div>
  );
}
