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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

// 常用正则表达式列表
function getCommonRegexPatterns(isEnglish: boolean) {
  return isEnglish
    ? [
        {
          name: "Email",
          pattern: "^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$",
          description: "Matches standard email addresses",
          example: "example@domain.com",
        },
        {
          name: "Phone number",
          pattern: "^\\+?[1-9]\\d{7,14}$",
          description: "Matches international phone numbers",
          example: "+14155550138",
        },
        {
          name: "URL",
          pattern: "^(https?|ftp)://[^\\s/$.?#].[^\\s]*$",
          description: "Matches standard URL addresses",
          example: "https://example.com",
        },
        {
          name: "IP address",
          pattern:
            "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
          description: "Matches IPv4 addresses",
          example: "192.168.1.1",
        },
        {
          name: "Date (YYYY-MM-DD)",
          pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$",
          description: "Matches dates in YYYY-MM-DD format",
          example: "2023-01-31",
        },
      ]
    : [
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
}

export default function RegexPage() {
  const isEnglish = useLocale() === englishLocale;
  const commonRegexPatterns = getCommonRegexPatterns(isEnglish);
  const copy = isEnglish
    ? {
        testTab: "Regex test",
        commonTab: "Common regex",
        title: "Regex test",
        description:
          "Enter a regular expression and test text to inspect matches.",
        regex: "Regular expression",
        regexPlaceholder: "Enter a regex, for example: \\d+",
        flagsPlaceholder: "Flags",
        flagsHelp:
          "Flags: g (global), i (ignore case), m (multiline), s (dot all), u (Unicode), y (sticky)",
        testText: "Test text",
        testPlaceholder: "Enter text to test",
        result: "Matches",
        found: "Found {count} matches",
        list: "Match list",
        commonTitle: "Common regular expressions",
        commonDescription:
          "Common regex patterns for everyday scenarios. Click Use to apply one to the tester.",
        copy: "Copy",
        use: "Use",
        example: "Example:",
        copied: "Copied to clipboard",
      }
    : {
        testTab: "正则表达式测试",
        commonTab: "常用正则表达式",
        title: "正则表达式测试",
        description: "输入正则表达式和测试文本，查看匹配结果",
        regex: "正则表达式",
        regexPlaceholder: "输入正则表达式，例如：\\d+",
        flagsPlaceholder: "标志",
        flagsHelp:
          "标志：g (全局), i (忽略大小写), m (多行), s (点匹配所有), u (Unicode), y (粘性)",
        testText: "测试文本",
        testPlaceholder: "输入要测试的文本",
        result: "匹配结果",
        found: "找到 {count} 个匹配",
        list: "匹配列表",
        commonTitle: "常用正则表达式",
        commonDescription:
          "常见场景的正则表达式，点击使用按钮将其应用到测试工具",
        copy: "复制",
        use: "使用",
        example: "示例：",
        copied: "已复制到剪贴板",
      };
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
    toast.success(copy.copied);
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
      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">{copy.testTab}</TabsTrigger>
          <TabsTrigger value="common">{copy.commonTab}</TabsTrigger>
        </TabsList>

        {/* 正则表达式测试 */}
        <TabsContent value="test" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{copy.title}</CardTitle>
              <CardDescription>{copy.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* 正则表达式输入 */}
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">{copy.regex}</div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={copy.regexPlaceholder}
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
                      placeholder={copy.flagsPlaceholder}
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
                  {copy.flagsHelp}
                </div>
              </div>

              {/* 测试文本输入 */}
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">{copy.testText}</div>
                <Textarea
                  placeholder={copy.testPlaceholder}
                  value={testString}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setTestString(e.target.value);
                    testRegex(pattern, flags, e.target.value);
                  }}
                  className="min-h-[120px]"
                />
              </div>

              {/* 匹配结果 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">{copy.result}</div>
                  <div className="text-sm text-muted-foreground">
                    {copy.found.replace(
                      "{count}",
                      String(testResults.matches.length)
                    )}
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
                    <div className="text-sm font-medium mb-2">{copy.list}</div>
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
              <CardTitle>{copy.commonTitle}</CardTitle>
              <CardDescription>{copy.commonDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {commonRegexPatterns.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(item.pattern)}
                        >
                          <Copy data-icon="inline-start" />
                          {copy.copy}
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
                          <Search data-icon="inline-start" />
                          {copy.use}
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
                      <span className="font-medium">{copy.example}</span>
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
