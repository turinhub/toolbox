"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import {
  checkDomainBasicInfo,
  checkDomainDNS,
  checkDomainSSL,
  checkDomainPerformance,
} from "./lib/domain-service";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Globe,
  Server,
  Timer,
  Shield,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

interface DomainInfo {
  domain: string;
  status: "active" | "inactive" | "error";
  ipAddress?: string;
  dnsRecords?: {
    A?: string[];
    AAAA?: string[];
    CNAME?: string[];
    MX?: string[];
    NS?: string[];
    TXT?: string[];
  };
  sslInfo?: {
    valid: boolean;
    issuer?: string;
    validFrom?: string;
    validTo?: string;
    daysLeft?: number;
  };
  whoisInfo?: {
    registrar?: string;
    registrationDate?: string;
    expirationDate?: string;
    nameServers?: string[];
  };
  performanceInfo?: {
    responseTime?: number;
    httpStatus?: number;
    redirects?: string[];
  };
}

interface CheckResult {
  step: string;
  status: "success" | "error" | "pending";
  message?: string;
  data?: unknown;
}

type DomainCheckerTab = "basic" | "dns" | "ssl" | "performance";
const DOMAIN_CHECKER_TABS: DomainCheckerTab[] = [
  "basic",
  "dns",
  "ssl",
  "performance",
];

function getInitialDomainCheckerTab(): DomainCheckerTab {
  if (typeof window === "undefined") return "basic";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return DOMAIN_CHECKER_TABS.includes(tab as DomainCheckerTab)
    ? (tab as DomainCheckerTab)
    : "basic";
}

export default function DomainCheckerPage() {
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  });
  const copy = isEnglish
    ? {
        enterDomain: "Enter a domain.",
        invalidDomain: "Enter a valid domain format.",
        checkingBasic: "Checking basic info...",
        basicDone: "Basic info check complete",
        basicFailed: "Basic info check failed",
        checkingDns: "Querying DNS records...",
        dnsDone: "DNS records loaded",
        checkingSsl: "Checking SSL certificate...",
        sslValid: "SSL certificate is valid",
        sslInvalid: "SSL certificate is invalid or missing",
        checkingPerformance: "Checking response performance...",
        performanceDone: "Performance check complete",
        performanceFailed: "Performance check failed",
        done: "Domain check complete",
        failed: "Domain check failed",
        unknown: "Unknown error occurred during the check",
        copied: "Copied to clipboard",
        title: "Domain Checker",
        description:
          "Enter a domain to run connectivity and security checks.",
        domain: "Domain",
        placeholder: "For example: example.com",
        checking: "Checking...",
        start: "Start check",
        progress: "Check progress",
        result: "Check result:",
        online: "Online",
        offline: "Offline",
        basic: "Basic info",
        dns: "DNS records",
        ssl: "SSL certificate",
        performance: "Performance",
        ip: "IP address",
        copyDomain: "Copy domain",
        copyIp: "Copy IP address",
        record: "record",
        copyRecord: "Copy {type} record {index}",
        sslStatus: "SSL certificate status:",
        valid: "Valid",
        invalid: "Invalid",
        issuer: "Issuer",
        validFrom: "Valid from",
        validTo: "Valid to",
        daysLeft: "Days left",
        days: "days",
        expiring: "Expiring soon",
        responseTime: "Response time",
        httpStatus: "HTTP status code",
        excellent: "Excellent",
        good: "Good",
        slow: "Slow",
        normal: "Normal",
        abnormal: "Abnormal",
        helpTitle: "How to use",
        helpDescription:
          "This tool checks basic domain information, DNS records, SSL certificate status, and performance metrics. Some advanced features such as WHOIS require server-side support because of browser security limits. Results are for reference and may vary by network environment.",
      }
    : {
        enterDomain: "请输入域名",
        invalidDomain: "请输入有效的域名格式",
        checkingBasic: "正在检测基本信息...",
        basicDone: "基本信息检测完成",
        basicFailed: "基本信息检测失败",
        checkingDns: "正在查询DNS记录...",
        dnsDone: "DNS记录查询完成",
        checkingSsl: "正在检测SSL证书...",
        sslValid: "SSL证书有效",
        sslInvalid: "SSL证书无效或不存在",
        checkingPerformance: "正在检测响应性能...",
        performanceDone: "性能检测完成",
        performanceFailed: "性能检测失败",
        done: "域名检测完成",
        failed: "域名检测失败",
        unknown: "检测过程中发生未知错误",
        copied: "已复制到剪贴板",
        title: "域名检测",
        description: "输入域名进行全面的连通性和安全性检测",
        domain: "域名",
        placeholder: "例如: example.com",
        checking: "检测中…",
        start: "开始检测",
        progress: "检测进度",
        result: "检测结果:",
        online: "在线",
        offline: "离线",
        basic: "基本信息",
        dns: "DNS记录",
        ssl: "SSL证书",
        performance: "性能指标",
        ip: "IP地址",
        copyDomain: "复制域名",
        copyIp: "复制 IP 地址",
        record: "记录",
        copyRecord: "复制 {type} 记录 {index}",
        sslStatus: "SSL证书状态:",
        valid: "有效",
        invalid: "无效",
        issuer: "证书颁发机构",
        validFrom: "生效日期",
        validTo: "过期日期",
        daysLeft: "剩余天数",
        days: "天",
        expiring: "即将过期",
        responseTime: "响应时间",
        httpStatus: "HTTP状态码",
        excellent: "优秀",
        good: "良好",
        slow: "较慢",
        normal: "正常",
        abnormal: "异常",
        helpTitle: "使用说明",
        helpDescription:
          "此工具提供域名的基础信息检测，包括DNS记录、SSL证书状态和性能指标。由于浏览器安全限制，某些高级功能（如WHOIS查询）需要服务端支持。检测结果仅供参考，实际情况可能因网络环境而异。",
      };
  const [domain, setDomain] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [activeTab, setActiveTab] = useState<DomainCheckerTab>("basic");

  const handleTabChange = (value: string) => {
    const nextTab = DOMAIN_CHECKER_TABS.includes(value as DomainCheckerTab)
      ? (value as DomainCheckerTab)
      : "basic";
    setActiveTab(nextTab);
    const url = new URL(window.location.href);
    if (nextTab === "basic") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", nextTab);
    }
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    setActiveTab(getInitialDomainCheckerTab());
  }, []);

  const updateCheckResults = (
    step: string,
    status: "success" | "error" | "pending",
    message?: string,
    data?: unknown
  ) => {
    setCheckResults(prev => {
      const existing = prev.find(result => result.step === step);
      if (existing) {
        return prev.map(result =>
          result.step === step ? { ...result, status, message, data } : result
        );
      }
      return [...prev, { step, status, message, data }];
    });
  };

  const validateDomain = (domain: string): boolean => {
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    return domainRegex.test(domain);
  };

  const checkDomain = async () => {
    if (!domain.trim()) {
      toast.error(copy.enterDomain);
      return;
    }

    if (!validateDomain(domain)) {
      toast.error(copy.invalidDomain);
      return;
    }

    setIsChecking(true);
    setCheckResults([]);
    setDomainInfo(null);

    try {
      // 基本信息检测
      updateCheckResults("basic", "pending", copy.checkingBasic);

      const basicInfo = await checkDomainBasicInfo(domain);
      updateCheckResults(
        "basic",
        basicInfo.status === "active" ? "success" : "error",
        basicInfo.status === "active"
          ? copy.basicDone
          : basicInfo.error || copy.basicFailed,
        basicInfo
      );

      // DNS 记录检测
      updateCheckResults("dns", "pending", copy.checkingDns);

      const dnsInfo = await checkDomainDNS(domain);
      updateCheckResults("dns", "success", copy.dnsDone, dnsInfo);

      // SSL 证书检测
      updateCheckResults("ssl", "pending", copy.checkingSsl);

      const sslInfo = await checkDomainSSL(domain);
      updateCheckResults(
        "ssl",
        sslInfo.valid ? "success" : "error",
        sslInfo.valid ? copy.sslValid : sslInfo.error || copy.sslInvalid,
        sslInfo
      );

      // 性能检测
      updateCheckResults("performance", "pending", copy.checkingPerformance);

      const performanceInfo = await checkDomainPerformance(domain);
      updateCheckResults(
        "performance",
        performanceInfo.httpStatus && performanceInfo.httpStatus > 0
          ? "success"
          : "error",
        performanceInfo.httpStatus && performanceInfo.httpStatus > 0
          ? copy.performanceDone
          : performanceInfo.error || copy.performanceFailed,
        performanceInfo
      );

      // 汇总结果
      const domainResult: DomainInfo = {
        domain,
        status: basicInfo.status,
        ipAddress: basicInfo.ipAddress,
        dnsRecords: dnsInfo,
        sslInfo,
        performanceInfo,
      };

      setDomainInfo(domainResult);
      toast.success(copy.done);
    } catch (error) {
      console.error(copy.failed, error);
      toast.error(copy.failed);
      updateCheckResults(
        "error",
        "error",
        error instanceof Error ? error.message : copy.unknown
      );
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(copy.copied);
  };

  const formatDate = (dateString: string) => {
    return dateFormatter.format(new Date(dateString));
  };

  return (
    <div className="flex flex-col container mx-auto p-6 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="domain">{copy.domain}</Label>
              <Input
                id="domain"
                name="domain"
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder={copy.placeholder}
                disabled={isChecking}
              />
            </div>
          </div>

          <Button
            onClick={checkDomain}
            disabled={isChecking || !domain.trim()}
            className="w-full sm:w-auto"
          >
            {isChecking ? copy.checking : copy.start}
          </Button>
        </CardContent>
      </Card>

      {/* 检测进度 */}
      {checkResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              {copy.progress}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {checkResults.map((result, index) => (
                <div key={index} className="flex items-center gap-3">
                  {result.status === "pending" && (
                    <div className="h-4 w-4 border-2 border-info border-t-transparent rounded-full animate-spin" />
                  )}
                  {result.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  )}
                  {result.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span
                    className={`text-sm ${
                      result.status === "success"
                        ? "text-success"
                        : result.status === "error"
                          ? "text-destructive"
                          : "text-info"
                    }`}
                  >
                    {result.message || result.step}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 检测结果 */}
      {domainInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                {copy.result} {domainInfo.domain}
              </div>
              <Badge
                variant={
                  domainInfo.status === "active" ? "default" : "destructive"
                }
              >
                {domainInfo.status === "active" ? copy.online : copy.offline}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">{copy.basic}</TabsTrigger>
                <TabsTrigger value="dns">{copy.dns}</TabsTrigger>
                <TabsTrigger value="ssl">{copy.ssl}</TabsTrigger>
                <TabsTrigger value="performance">{copy.performance}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="domain-result-domain">{copy.domain}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="domain-result-domain"
                        value={domainInfo.domain}
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(domainInfo.domain)}
                        aria-label={copy.copyDomain}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {domainInfo.ipAddress && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="domain-result-ip">{copy.ip}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="domain-result-ip"
                          value={domainInfo.ipAddress}
                          readOnly
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(domainInfo.ipAddress!)}
                          aria-label={copy.copyIp}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="dns" className="flex flex-col gap-4">
                {domainInfo.dnsRecords && (
                  <div className="flex flex-col gap-4">
                    {Object.entries(domainInfo.dnsRecords).map(
                      ([type, records]) =>
                        records &&
                        records.length > 0 && (
                          <div key={type} className="flex flex-col gap-2">
                            <Label className="flex items-center gap-2">
                              {type} {copy.record}
                              <Badge variant="secondary">
                                {records.length}
                              </Badge>
                            </Label>
                            <div className="flex flex-col gap-2">
                              {records.map((record, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    aria-label={`${type} ${copy.record} ${index + 1}`}
                                    value={record}
                                    readOnly
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(record)}
                                    aria-label={copy.copyRecord
                                      .replace("{type}", type)
                                      .replace("{index}", String(index + 1))}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            {type !== "TXT" && <Separator />}
                          </div>
                        )
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ssl" className="flex flex-col gap-4">
                {domainInfo.sslInfo && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`h-5 w-5 ${domainInfo.sslInfo.valid ? "text-success" : "text-destructive"}`}
                      />
                      <span className="font-medium">
                        {copy.sslStatus}{" "}
                        {domainInfo.sslInfo.valid ? copy.valid : copy.invalid}
                      </span>
                    </div>

                    {domainInfo.sslInfo.valid && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {domainInfo.sslInfo.issuer && (
                          <div className="flex flex-col gap-2">
                            <Label>{copy.issuer}</Label>
                            <Input value={domainInfo.sslInfo.issuer} readOnly />
                          </div>
                        )}
                        {domainInfo.sslInfo.validFrom && (
                          <div className="flex flex-col gap-2">
                            <Label>{copy.validFrom}</Label>
                            <Input
                              value={formatDate(domainInfo.sslInfo.validFrom)}
                              readOnly
                            />
                          </div>
                        )}
                        {domainInfo.sslInfo.validTo && (
                          <div className="flex flex-col gap-2">
                            <Label>{copy.validTo}</Label>
                            <Input
                              value={formatDate(domainInfo.sslInfo.validTo)}
                              readOnly
                            />
                          </div>
                        )}
                        {domainInfo.sslInfo.daysLeft !== undefined && (
                          <div className="flex flex-col gap-2">
                            <Label>{copy.daysLeft}</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={`${domainInfo.sslInfo.daysLeft} ${copy.days}`}
                                readOnly
                              />
                              {domainInfo.sslInfo.daysLeft < 30 && (
                                <Badge variant="destructive">
                                  {copy.expiring}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="performance" className="flex flex-col gap-4">
                {domainInfo.performanceInfo && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {domainInfo.performanceInfo.responseTime && (
                        <div className="flex flex-col gap-2">
                          <Label>{copy.responseTime}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={`${domainInfo.performanceInfo.responseTime} ms`}
                              readOnly
                            />
                            <Badge
                              variant={
                                domainInfo.performanceInfo.responseTime < 200
                                  ? "default"
                                  : domainInfo.performanceInfo.responseTime <
                                      500
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {domainInfo.performanceInfo.responseTime < 200
                                ? copy.excellent
                                : domainInfo.performanceInfo.responseTime < 500
                                  ? copy.good
                                  : copy.slow}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {domainInfo.performanceInfo.httpStatus && (
                        <div className="flex flex-col gap-2">
                          <Label>{copy.httpStatus}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={domainInfo.performanceInfo.httpStatus.toString()}
                              readOnly
                            />
                            <Badge
                              variant={
                                domainInfo.performanceInfo.httpStatus >= 200 &&
                                domainInfo.performanceInfo.httpStatus < 300
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {domainInfo.performanceInfo.httpStatus >= 200 &&
                              domainInfo.performanceInfo.httpStatus < 300
                                ? copy.normal
                                : copy.abnormal}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{copy.helpTitle}</AlertTitle>
        <AlertDescription>{copy.helpDescription}</AlertDescription>
      </Alert>
    </div>
  );
}
