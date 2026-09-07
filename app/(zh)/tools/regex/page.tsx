"use client";

import { useEffect, useRef, useState } from "react";
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
import { useLocale, useTranslations } from "next-intl";
import { englishLocale } from "@/i18n/config";
import { Label } from "@/components/ui/label";
import { RegexHighlight } from "@/components/regex-highlight";
import {
  createRegexRunner,
  REGEX_MAX_MATCHES,
  REGEX_MATCH_PAGE_SIZE,
  type RegexInput,
  type RegexRunner,
  type RegexRunState,
} from "@/lib/regex/runner";

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

const errorMessageKeys = {
  "invalid-regex": "invalidRegex",
  timeout: "timeout",
  "worker-load-timeout": "workerLoadTimeout",
  "worker-error": "workerError",
  "worker-unavailable": "workerUnavailable",
  "invalid-response": "invalidResponse",
} as const;

export default function RegexPage() {
  const t = useTranslations("regex");
  const isEnglish = useLocale() === englishLocale;
  const commonRegexPatterns = getCommonRegexPatterns(isEnglish);
  const [activeTab, setActiveTab] = useState("test");
  const [input, setInput] = useState<RegexInput>({
    pattern: "",
    flags: "g",
    text: "",
  });
  const [runState, setRunState] = useState<RegexRunState>({
    status: "idle",
    requestId: 0,
    input,
  });
  const [matchPage, setMatchPage] = useState(0);
  const runnerRef = useRef<RegexRunner | null>(null);

  useEffect(() => {
    const runner = createRegexRunner({ onState: setRunState });
    runnerRef.current = runner;
    return () => {
      runner.dispose();
      runnerRef.current = null;
    };
  }, []);

  const updateInput = (changes: Partial<RegexInput>) => {
    const nextInput = { ...input, ...changes };
    setInput(nextInput);
    setMatchPage(0);
    runnerRef.current?.schedule(nextInput);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const result = runState.status === "success" ? runState : null;
  const error = runState.status === "error" ? runState : null;
  const isBusy = ["pending", "loading", "running"].includes(runState.status);
  const pageCount = Math.ceil(
    (result?.matches.length ?? 0) / REGEX_MATCH_PAGE_SIZE
  );
  const pageStart = matchPage * REGEX_MATCH_PAGE_SIZE;
  const visibleMatches = result?.matches.slice(
    pageStart,
    pageStart + REGEX_MATCH_PAGE_SIZE
  );
  const statusText = result
    ? t(result.limited ? "limitedCount" : "found", {
        count: result.matches.length,
      })
    : t(runState.status === "error" ? "failed" : runState.status);

  return (
    <div className="flex flex-col gap-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">{t("testTab")}</TabsTrigger>
          <TabsTrigger value="common">{t("commonTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Label htmlFor="regex-pattern">{t("regex")}</Label>
                    <Input
                      id="regex-pattern"
                      name="regex-pattern"
                      placeholder={t("regexPlaceholder")}
                      value={input.pattern}
                      onChange={event =>
                        updateInput({ pattern: event.target.value })
                      }
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={error?.code === "invalid-regex"}
                      aria-describedby={error ? "regex-error" : undefined}
                      className="font-mono"
                    />
                  </div>
                  <div className="flex w-24 shrink-0 flex-col gap-2">
                    <Label htmlFor="regex-flags">{t("flags")}</Label>
                    <Input
                      id="regex-flags"
                      name="regex-flags"
                      placeholder={t("flagsPlaceholder")}
                      value={input.flags}
                      onChange={event =>
                        updateInput({ flags: event.target.value })
                      }
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={error?.code === "invalid-regex"}
                      aria-describedby="regex-flags-help"
                      className="font-mono text-center"
                    />
                  </div>
                </div>
                <p
                  id="regex-flags-help"
                  className="text-xs text-muted-foreground"
                >
                  {t("flagsHelp")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="regex-test-text">{t("testText")}</Label>
                <Textarea
                  id="regex-test-text"
                  name="regex-test-text"
                  placeholder={t("testPlaceholder")}
                  value={input.text}
                  onChange={event => updateInput({ text: event.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                  className="min-h-[120px] font-mono"
                />
              </div>

              {error && (
                <div className="flex flex-col items-start gap-2">
                  <div
                    id="regex-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    <p>{t(errorMessageKeys[error.code])}</p>
                    {error.message && (
                      <p className="mt-1 break-words font-mono text-xs">
                        {error.message}
                      </p>
                    )}
                  </div>
                  {error.code !== "invalid-regex" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateInput({})}
                    >
                      {t("retry")}
                    </Button>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2" aria-busy={isBusy}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">{t("result")}</div>
                  <div
                    role="status"
                    aria-live="polite"
                    data-testid="regex-status"
                    data-state={runState.status}
                    className="text-sm tabular-nums text-muted-foreground"
                  >
                    {statusText}
                  </div>
                </div>
                {result && (
                  <>
                    {result.limited && (
                      <p className="text-sm text-muted-foreground">
                        {t("limitHelp", { count: REGEX_MAX_MATCHES })}
                      </p>
                    )}
                    {result.matches.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {t("noMatches")}
                      </p>
                    )}
                    <RegexHighlight
                      text={result.input.text}
                      matches={result.matches}
                      emptyMatchLabel={position =>
                        t("emptyMatchAt", { position })
                      }
                    />
                  </>
                )}
                {result && result.matches.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-sm font-medium">{t("list")}</div>
                    <ul
                      data-testid="regex-match-list"
                      aria-label={t("list")}
                      className="max-h-[300px] overflow-y-auto rounded-md bg-muted p-2"
                    >
                      {visibleMatches?.map((match, index) => (
                        <li
                          key={`${pageStart + index}-${match.start}-${match.end}`}
                          className="flex items-center justify-between gap-2 rounded p-2 hover:bg-muted/80"
                        >
                          <div className="min-w-0">
                            <span className="break-all font-mono">
                              {match.start === match.end
                                ? t("emptyMatch")
                                : result.input.text.slice(
                                    match.start,
                                    match.end
                                  )}
                            </span>
                            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                              {t("matchRange", {
                                start: match.start,
                                end: match.end,
                              })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            aria-label={t("copyMatch", {
                              number: pageStart + index + 1,
                            })}
                            onClick={() =>
                              copyToClipboard(
                                result.input.text.slice(match.start, match.end)
                              )
                            }
                          >
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    {pageCount > 1 && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {t("page", { page: matchPage + 1, total: pageCount })}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={matchPage === 0}
                            onClick={() => setMatchPage(page => page - 1)}
                          >
                            {t("previousPage")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={matchPage >= pageCount - 1}
                            onClick={() => setMatchPage(page => page + 1)}
                          >
                            {t("nextPage")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="common" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("commonTitle")}</CardTitle>
              <CardDescription>{t("commonDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {commonRegexPatterns.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(item.pattern)}
                        >
                          <Copy data-icon="inline-start" aria-hidden="true" />
                          {t("copy")}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            updateInput({ pattern: item.pattern });
                            setActiveTab("test");
                          }}
                        >
                          <Search data-icon="inline-start" aria-hidden="true" />
                          {t("use")}
                        </Button>
                      </div>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <div className="break-all rounded bg-muted p-2 font-mono text-sm">
                      {item.pattern}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">{t("example")}</span>
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
