"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  Send,
  Copy,
  Download,
  Trash2,
  Bot,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

// 定义消息类型
type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  isError?: boolean;
};

// 快捷回复选项
const quickReplies = [
  "解释一下这个概念",
  "给我一个例子",
  "有什么建议？",
  "详细说明",
  "总结一下",
  "换个角度思考",
];

export default function AIChatPage() {
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substring(2, 15);

  // 从本地存储加载对话历史
  useEffect(() => {
    const savedMessages = localStorage.getItem("ai-chat-messages");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error("加载对话历史失败:", error);
      }
    }
  }, []);

  // 保存对话历史到本地存储
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("ai-chat-messages", JSON.stringify(messages));
    }
  }, [messages]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息
  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowQuickReplies(false);

    // 创建一个临时的AI消息用于流式更新
    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);

    try {
      // 准备发送到API的消息
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

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

      // 检查是否支持流式输出
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        // 处理流式输出
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    // 更新AI消息内容
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: msg.content + parsed.content }
                          : msg
                      )
                    );
                  } else if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch (parseError) {
                  console.error("解析流式数据失败:", parseError);
                }
              }
            }
          }
        }
      } else {
        // 兼容非流式响应
        const data = await response.json();
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: data.content }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("对话请求失败:", error);

      // 更新为错误消息
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "抱歉，我现在无法回应您的消息。请稍后再试。",
                isError: true,
              }
            : msg
        )
      );
      toast.error("对话请求失败，请稍后再试");
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  // 复制消息内容
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("消息已复制到剪贴板");
    } catch (error) {
      console.error("复制失败:", error);
      toast.error("复制失败");
    }
  };

  // 删除单条消息
  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast.success("消息已删除");
  };

  // 重置对话
  const handleResetChat = () => {
    setMessages([]);
    setShowQuickReplies(true);
    localStorage.removeItem("ai-chat-messages");
    toast.success("对话已重置");
  };

  // 导出对话
  const exportChat = () => {
    const chatText = messages
      .map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const role = msg.role === "user" ? "用户" : "AI助手";
        return `[${timestamp}] ${role}: ${msg.content}`;
      })
      .join("\n\n");

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AI对话记录_${new Date().toLocaleString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("对话记录已导出");
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "刚刚";
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return date.toLocaleDateString();
  };

  // 渲染消息内容（支持 Markdown）
  const renderMessageContent = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义代码块样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pre: ({ children, ...props }: any) => (
            <pre
              {...props}
              className="bg-muted p-3 rounded-md overflow-x-auto my-3 text-sm"
            >
              {children}
            </pre>
          ),
          // 自定义内联代码样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: ({ children, className, ...props }: any) => {
            const isInline = !className?.includes("language-");
            if (isInline) {
              return (
                <code
                  {...props}
                  className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                >
                  {children}
                </code>
              );
            }
            return (
              <code {...props} className="font-mono text-sm">
                {children}
              </code>
            );
          },
          // 自定义表格样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          table: ({ children, ...props }: any) => (
            <div className="overflow-x-auto my-3">
              <table
                {...props}
                className="min-w-full border border-muted rounded-md"
              >
                {children}
              </table>
            </div>
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          thead: ({ children, ...props }: any) => (
            <thead {...props} className="bg-muted/50">
              {children}
            </thead>
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          th: ({ children, ...props }: any) => (
            <th
              {...props}
              className="border border-muted px-3 py-2 text-left font-medium"
            >
              {children}
            </th>
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          td: ({ children, ...props }: any) => (
            <td {...props} className="border border-muted px-3 py-2">
              {children}
            </td>
          ),
          // 自定义引用块样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          blockquote: ({ children, ...props }: any) => (
            <blockquote
              {...props}
              className="border-l-4 border-primary pl-4 py-2 my-3 bg-muted/30 rounded-r-md"
            >
              {children}
            </blockquote>
          ),
          // 自定义列表样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ul: ({ children, ...props }: any) => (
            <ul {...props} className="list-disc list-inside my-3">
              {children}
            </ul>
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ol: ({ children, ...props }: any) => (
            <ol {...props} className="list-decimal list-inside my-3">
              {children}
            </ol>
          ),
          // 自定义列表项样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          li: ({ children, ...props }: any) => (
            <li {...props} className="mb-1">
              {children}
            </li>
          ),
          // 自定义链接样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          a: ({ children, ...props }: any) => (
            <a
              {...props}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // 自定义标题样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          h1: ({ children, ...props }: any) => (
            <h1 {...props} className="text-2xl font-bold mt-6 mb-3 first:mt-0">
              {children}
            </h1>
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          h2: ({ children, ...props }: any) => (
            <h2
              {...props}
              className="text-xl font-semibold mt-5 mb-2 first:mt-0"
            >
              {children}
            </h2>
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          h3: ({ children, ...props }: any) => (
            <h3 {...props} className="text-lg font-medium mt-4 mb-2 first:mt-0">
              {children}
            </h3>
          ),
          // 自定义段落样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          p: ({ children, ...props }: any) => (
            <p {...props} className="mb-3 leading-relaxed last:mb-0">
              {children}
            </p>
          ),
          // 自定义分隔线样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hr: ({ children, ...props }: any) => (
            <hr {...props} className="my-4 border-muted">
              {children}
            </hr>
          ),
          // 自定义强调文本样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          strong: ({ children, ...props }: any) => (
            <strong {...props} className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          // 自定义斜体文本样式
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          em: ({ children, ...props }: any) => (
            <em {...props} className="italic text-foreground">
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Bot className="h-8 w-8 text-primary" />
                AI 对话助手
              </CardTitle>
              <CardDescription>
                使用 @cf/qwen/qwen1.5-14b-chat-awq 模型 · 智能对话体验
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {messages.length} 条消息
              </Badge>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportChat}
                  className="hidden sm:flex"
                >
                  <Download className="h-4 w-4 mr-1" />
                  导出
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[600px] w-full pr-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      您好！我是您的AI助手
                    </h3>
                    <p className="text-muted-foreground">
                      我可以帮助您回答问题、提供建议、解释概念等。请随时与我对话！
                    </p>
                  </div>

                  {showQuickReplies && (
                    <div className="pt-6">
                      <p className="text-sm text-muted-foreground mb-3">
                        快速开始：
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {quickReplies.map((reply, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendMessage(reply)}
                            className="text-sm"
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={cn(
                        "group flex gap-3 p-4 rounded-xl transition-all duration-200",
                        message.role === "user"
                          ? "bg-primary/5 hover:bg-primary/10 border border-primary/10"
                          : message.isError
                            ? "bg-destructive/5 hover:bg-destructive/10 border border-destructive/10"
                            : "bg-muted/50 hover:bg-muted/70 border border-muted"
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback
                          className={cn(
                            "text-sm font-medium",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : message.isError
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-muted-foreground text-muted"
                          )}
                        >
                          {message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : message.isError ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.role === "user" ? "用户" : "AI助手"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.isError && (
                            <Badge variant="destructive" className="text-xs">
                              错误
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm leading-relaxed">
                          {message.content ? (
                            <>
                              {renderMessageContent(message.content)}
                              {streamingMessageId === message.id && (
                                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                              )}
                            </>
                          ) : streamingMessageId === message.id ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>正在生成回复...</span>
                            </div>
                          ) : (
                            renderMessageContent(message.content)
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMessage(message.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {isLoading && !streamingMessageId && (
                    <div className="flex gap-3 p-4 rounded-xl bg-muted/50 border border-muted">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-muted-foreground text-muted">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">AI助手</span>
                          <span className="text-xs text-muted-foreground">
                            正在思考...
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>正在生成回复...</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          <div
                            className="w-2 h-2 bg-primary rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-primary rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="mt-4 space-y-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="请输入您的问题（Shift + Enter 换行，Enter 发送）..."
                className="flex-1 resize-none min-h-[60px] max-h-[120px]"
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                size="lg"
                className="px-6"
              >
                <Send className="h-4 w-4 mr-2" />
                发送
              </Button>
            </div>

            {/* 快捷回复 - 仅在有对话时显示 */}
            {messages.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center">
                  快捷回复：
                </span>
                {quickReplies.slice(0, 4).map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(reply)}
                    className="text-xs h-7"
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleResetChat}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重置对话
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>对话已自动保存</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
