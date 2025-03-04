"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

// 定义消息类型
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default function AIChatPage() {
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 准备发送到API的消息
      const apiMessages = [...messages, userMessage];
      
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error("API请求失败");
      }

      const data = await response.json();
      
      // 添加AI回复
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      console.error("对话请求失败:", error);
      toast.error("对话请求失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 重置对话
  const handleResetChat = () => {
    setMessages([]);
    toast.success("对话已重置");
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">AI 对话</CardTitle>
          <CardDescription>使用 deepseek-r1-distill-qwen-32b 模型。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-4 h-[500px] overflow-y-auto p-4 border rounded-md">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 space-y-2">
                <p className="text-lg">您好！我是您的智能助手</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto hover:bg-primary/90"
                      : "bg-muted mr-auto hover:bg-muted/80"
                  } max-w-[80%] transition-colors`}
                >
                  {message.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="bg-primary/10 p-4 rounded-xl mr-auto max-w-[80%] animate-pulse">
                <div className="flex items-center space-x-2 text-primary">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>正在思考中...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请输入您的问题（Shift + Enter 换行）..."
              className="flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4 transform transition-transform hover:translate-x-0.5" />
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleResetChat}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重置对话
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
