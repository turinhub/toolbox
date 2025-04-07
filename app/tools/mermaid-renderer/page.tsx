"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import mermaid from "mermaid";

export default function MermaidRendererPage() {
  const [mermaidCode, setMermaidCode] = useState<string>(`graph TD
    A[开始] --> B{判断?};
    B -- 是 --> C[操作1];
    B -- 否 --> D[操作2];
    C --> E[结束];
    D --> E;`);
  const [error, setError] = useState<string>("");
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [lastValidCode, setLastValidCode] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  // 初始化 mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });
    
    // 初始渲染
    if (mermaidCode) {
      renderMermaid(mermaidCode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 代码变化时渲染
  useEffect(() => {
    const timer = setTimeout(() => {
      renderMermaid(mermaidCode);
    }, 600);
    
    return () => clearTimeout(timer);
  }, [mermaidCode]);

  const renderMermaid = async (code: string) => {
    if (!mermaidRef.current) return;
    
    try {
      setError("");
      mermaidRef.current.innerHTML = ""; // 清空之前的渲染结果

      // 使用 mermaid 渲染图表
      const uniqueId = `mermaid-graph-${Date.now()}`;
      const { svg } = await mermaid.render(uniqueId, code);
      mermaidRef.current.innerHTML = svg;
      
      // 保存最后有效的代码
      setLastValidCode(code);
    } catch (e) {
      console.error("Mermaid 渲染失败:", e);
      
      // 格式化错误信息
      let errorMessage = e instanceof Error ? e.message : String(e);
      
      // 提取语法错误关键信息
      if (errorMessage.includes("Lexical error") || errorMessage.includes("Parse error")) {
        const lines = errorMessage.split('\n');
        if (lines.length >= 2) {
          errorMessage = `${lines[0]}\n${lines[1]}`;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleMermaidChange = (value: string) => {
    setMermaidCode(value);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mermaidCode);
    toast.success("Mermaid 代码已复制到剪贴板");
  };

  const handleRetry = () => {
    renderMermaid(mermaidCode);
  };

  // 恢复到最后有效的代码
  const handleRestore = () => {
    if (lastValidCode) {
      setMermaidCode(lastValidCode);
      setTimeout(() => renderMermaid(lastValidCode), 100);
    }
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  const toggleFullscreen = () => {
    setFullscreen(prev => !prev);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-2xl font-bold">Mermaid 渲染器</h1>
        <p className="text-muted-foreground">
          在线渲染 Mermaid 格式的图表，支持流程图、时序图、甘特图等多种图表类型
        </p>
      </div>
      
      <div className={`grid ${fullscreen ? "" : "md:grid-cols-2"} gap-6`}>
        <Card className={`p-4 ${fullscreen ? "hidden" : ""}`}>
          <h2 className="text-lg font-semibold mb-2">Mermaid 代码</h2>
          <div className="space-y-4">
            <Textarea
              value={mermaidCode}
              onChange={(e) => handleMermaidChange(e.target.value)}
              className="font-mono h-[300px]"
              placeholder="在此输入 Mermaid 代码..."
            />
            <div className="flex gap-2">
              <Button onClick={handleCopy} className="flex-1">
                复制 Mermaid 代码
              </Button>
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                重新渲染
              </Button>
              {error && lastValidCode && (
                <Button onClick={handleRestore} variant="secondary" className="flex-1">
                  恢复上次有效代码
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${fullscreen ? "w-full h-screen" : ""}`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">预览</h2>
            <div className="flex gap-2">
              <Button onClick={zoomOut} size="sm" variant="outline" className="h-8 w-8 p-0">
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">缩小</span>
              </Button>
              <Button onClick={resetZoom} size="sm" variant="outline" className="h-8">
                {zoomLevel}%
              </Button>
              <Button onClick={zoomIn} size="sm" variant="outline" className="h-8 w-8 p-0">
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">放大</span>
              </Button>
              <Button onClick={toggleFullscreen} size="sm" variant="outline" className="h-8 w-8 p-0">
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span className="sr-only">切换全屏</span>
              </Button>
            </div>
          </div>
          <div className={`border rounded-lg p-4 ${fullscreen ? "h-[calc(100vh-160px)]" : "h-[300px]"} flex items-center justify-center bg-white overflow-auto`}>
            {error ? (
              <div className="flex flex-col items-center justify-center space-y-2 w-full">
                <p className="text-destructive">渲染失败</p>
                <pre className="text-xs bg-gray-100 p-2 rounded w-full overflow-auto max-h-[200px]">
                  {error}
                </pre>
              </div>
            ) : (
              <div 
                ref={mermaidRef} 
                className="mermaid-container" 
                style={{ 
                  transform: `scale(${zoomLevel / 100})`, 
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease'
                }}
              />
            )}
          </div>
        </Card>
      </div>

      <div className={`mt-8 space-y-6 ${fullscreen ? "hidden" : ""}`}>
        <div>
          <h2 className="text-xl font-semibold mb-4">使用说明</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>在左侧文本框中输入或粘贴 Mermaid 格式的图表代码</li>
            <li>右侧区域会实时显示渲染后的图表</li>
            <li>支持流程图、时序图、甘特图、类图等多种图表类型</li>
            <li>点击&ldquo;复制 Mermaid 代码&rdquo;按钮可以复制当前的代码</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Mermaid 语法介绍</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">流程图 (Flowchart)</h3>
              <pre className="p-3 bg-gray-100 rounded-md text-xs overflow-auto">
{`graph TD
    A[开始] --> B{条件判断}
    B -->|是| C[处理1]
    B -->|否| D[处理2]
    C --> E[结束]
    D --> E`}
              </pre>
            </Card>
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">时序图 (Sequence)</h3>
              <pre className="p-3 bg-gray-100 rounded-md text-xs overflow-auto">
{`sequenceDiagram
    participant 客户端
    participant 服务器
    客户端->>服务器: 请求数据
    服务器-->>客户端: 响应数据`}
              </pre>
            </Card>
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">甘特图 (Gantt)</h3>
              <pre className="p-3 bg-gray-100 rounded-md text-xs overflow-auto">
{`gantt
    title 项目计划
    dateFormat YYYY-MM-DD
    section 阶段1
    任务1 :a1, 2023-01-01, 30d
    任务2 :after a1, 20d`}
              </pre>
            </Card>
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">类图 (Class)</h3>
              <pre className="p-3 bg-gray-100 rounded-md text-xs overflow-auto">
{`classDiagram
    class Animal {
        +name: string
        +move()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`}
              </pre>
            </Card>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>更多语法和示例请参考 <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noopener noreferrer" className="text-primary underline">Mermaid 官方文档</a></p>
          </div>
        </div>
      </div>
    </div>
  );
} 