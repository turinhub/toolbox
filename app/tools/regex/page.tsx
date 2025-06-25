"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 常用正则表达式列表
const commonRegexPatterns = [
  {
    name: "电子邮件",
    pattern: "^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$",
    description: "匹配标准电子邮件地址格式",
    example: "example@domain.com",
  },
  {
    name: "手机号码",
    pattern: "^1[3-9]\\d{9}$",
    description: "匹配中国大陆手机号码",
    example: "13812345678",
  },
  {
    name: "URL",
    pattern: "^(https?|ftp)://[^\\s/$.?#].[^\\s]*$",
    description: "匹配标准URL地址",
    example: "https://example.com",
  },
  {
    name: "IP地址",
    pattern:
      "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
    description: "匹配IPv4地址",
    example: "192.168.1.1",
  },
  {
    name: "日期 (YYYY-MM-DD)",
    pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$",
    description: "匹配YYYY-MM-DD格式的日期",
    example: "2023-01-31",
  },
  {
    name: "中文字符",
    pattern: "^[\\u4e00-\\u9fa5]+$",
    description: "匹配中文字符",
    example: "你好世界",
  },
  {
    name: "身份证号",
    pattern:
      "^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])\\d{3}[0-9X]$",
    description: "匹配18位身份证号码",
    example: "110101199001011234",
  },
  {
    name: "邮政编码",
    pattern: "^[1-9]\\d{5}$",
    description: "匹配中国邮政编码",
    example: "100000",
  },
];

export default function RegexPage() {
  // 测试正则表达式状态
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [testResults, setTestResults] = useState<{
    matches: string[];
    isValid: boolean;
    error?: string;
  }>({
    matches: [],
    isValid: true,
  });

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  // 测试正则表达式
  const testRegex = (
    patternStr = pattern,
    flagsStr = flags,
    testStr = testString
  ) => {
    try {
      if (!patternStr) {
        setTestResults({
          matches: [],
          isValid: true,
        });
        return;
      }

      const regex = new RegExp(patternStr, flagsStr);
      const matches: string[] = [];
      let match;

      if (flagsStr.includes("g")) {
        while ((match = regex.exec(testStr)) !== null) {
          matches.push(match[0]);
        }
      } else {
        match = regex.exec(testStr);
        if (match) {
          matches.push(match[0]);
        }
      }

      setTestResults({
        matches,
        isValid: true,
      });
    } catch (error) {
      setTestResults({
        matches: [],
        isValid: false,
        error: (error as Error).message,
      });
    }
  };

  // 高亮匹配结果
  const highlightMatches = () => {
    if (!testResults.isValid || !pattern || testResults.matches.length === 0) {
      return testString;
    }

    try {
      const regex = new RegExp(
        pattern,
        flags.includes("g") ? flags : flags + "g"
      );
      return testString.replace(
        regex,
        match =>
          `<span class="bg-yellow-200 dark:bg-yellow-800">${match}</span>`
      );
    } catch {
      return testString;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">正则表达式工具</h1>
        <p className="text-muted-foreground">
          提供常用正则表达式，并支持在线测试正则表达式
        </p>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">正则表达式测试</TabsTrigger>
          <TabsTrigger value="common">常用正则表达式</TabsTrigger>
        </TabsList>

        {/* 正则表达式测试 */}
        <TabsContent value="test" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>正则表达式测试</CardTitle>
              <CardDescription>
                输入正则表达式和测试文本，查看匹配结果
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 正则表达式输入 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">正则表达式</div>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="输入正则表达式，例如：\d+"
                      value={pattern}
                      onChange={e => {
                        setPattern(e.target.value);
                        testRegex(e.target.value, flags, testString);
                      }}
                      className={`font-mono ${
                        !testResults.isValid ? "border-destructive" : ""
                      }`}
                    />
                    {!testResults.isValid && (
                      <p className="text-destructive text-sm mt-1">
                        {testResults.error}
                      </p>
                    )}
                  </div>
                  <div className="w-24">
                    <Input
                      placeholder="标志"
                      value={flags}
                      onChange={e => {
                        setFlags(e.target.value);
                        testRegex(pattern, e.target.value, testString);
                      }}
                      className="font-mono text-center"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  标志：g (全局), i (忽略大小写), m (多行), s (点匹配所有), u
                  (Unicode), y (粘性)
                </div>
              </div>

              {/* 测试文本输入 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">测试文本</div>
                <Textarea
                  placeholder="输入要测试的文本"
                  value={testString}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setTestString(e.target.value);
                    testRegex(pattern, flags, e.target.value);
                  }}
                  className="min-h-[120px]"
                />
              </div>

              {/* 匹配结果 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">匹配结果</div>
                  <div className="text-sm text-muted-foreground">
                    找到 {testResults.matches.length} 个匹配
                  </div>
                </div>
                {testString && pattern && testResults.isValid && (
                  <div
                    className="p-4 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap break-all"
                    dangerouslySetInnerHTML={{ __html: highlightMatches() }}
                  />
                )}
                {testResults.matches.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">匹配列表</div>
                    <div className="bg-muted rounded-md p-2 max-h-[200px] overflow-y-auto">
                      {testResults.matches.map((match, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 hover:bg-muted/80 rounded"
                        >
                          <span className="font-mono">{match}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(match)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 常用正则表达式 */}
        <TabsContent value="common" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>常用正则表达式</CardTitle>
              <CardDescription>
                常见场景的正则表达式，点击使用按钮将其应用到测试工具
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commonRegexPatterns.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(item.pattern)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          复制
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setPattern(item.pattern);
                            testRegex(item.pattern, flags, testString);
                            document
                              .querySelector('[value="test"]')
                              ?.dispatchEvent(
                                new MouseEvent("click", { bubbles: true })
                              );
                          }}
                        >
                          <Search className="h-4 w-4 mr-1" />
                          使用
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                    <div className="bg-muted p-2 rounded font-mono text-sm break-all">
                      {item.pattern}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">示例：</span>
                      {item.example}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
