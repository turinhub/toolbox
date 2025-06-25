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
import { useState } from "react";
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

export default function DomainCheckerPage() {
  const [domain, setDomain] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

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
      toast.error("请输入域名");
      return;
    }

    if (!validateDomain(domain)) {
      toast.error("请输入有效的域名格式");
      return;
    }

    setIsChecking(true);
    setCheckResults([]);
    setDomainInfo(null);

    try {
      // 基本信息检测
      updateCheckResults("basic", "pending", "正在检测基本信息...");

      const basicInfo = await checkDomainBasicInfo(domain);
      updateCheckResults(
        "basic",
        basicInfo.status === "active" ? "success" : "error",
        basicInfo.status === "active"
          ? "基本信息检测完成"
          : basicInfo.error || "基本信息检测失败",
        basicInfo
      );

      // DNS 记录检测
      updateCheckResults("dns", "pending", "正在查询DNS记录...");

      const dnsInfo = await checkDomainDNS(domain);
      updateCheckResults("dns", "success", "DNS记录查询完成", dnsInfo);

      // SSL 证书检测
      updateCheckResults("ssl", "pending", "正在检测SSL证书...");

      const sslInfo = await checkDomainSSL(domain);
      updateCheckResults(
        "ssl",
        sslInfo.valid ? "success" : "error",
        sslInfo.valid ? "SSL证书有效" : sslInfo.error || "SSL证书无效或不存在",
        sslInfo
      );

      // 性能检测
      updateCheckResults("performance", "pending", "正在检测响应性能...");

      const performanceInfo = await checkDomainPerformance(domain);
      updateCheckResults(
        "performance",
        performanceInfo.httpStatus && performanceInfo.httpStatus > 0
          ? "success"
          : "error",
        performanceInfo.httpStatus && performanceInfo.httpStatus > 0
          ? "性能检测完成"
          : performanceInfo.error || "性能检测失败",
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
      toast.success("域名检测完成");
    } catch (error) {
      console.error("域名检测失败:", error);
      toast.error("域名检测失败");
      updateCheckResults(
        "error",
        "error",
        error instanceof Error ? error.message : "检测过程中发生未知错误"
      );
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">域名检测工具</h1>
        <p className="text-muted-foreground">
          检测域名的DNS记录、SSL证书、性能指标和基本信息
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            域名检测
          </CardTitle>
          <CardDescription>
            输入域名进行全面的连通性和安全性检测
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="domain">域名</Label>
              <Input
                id="domain"
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="例如: example.com"
                disabled={isChecking}
              />
            </div>
          </div>

          <Button
            onClick={checkDomain}
            disabled={isChecking || !domain.trim()}
            className="w-full sm:w-auto"
          >
            {isChecking ? "检测中..." : "开始检测"}
          </Button>
        </CardContent>
      </Card>

      {/* 检测进度 */}
      {checkResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              检测进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checkResults.map((result, index) => (
                <div key={index} className="flex items-center gap-3">
                  {result.status === "pending" && (
                    <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  {result.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {result.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm ${
                      result.status === "success"
                        ? "text-green-600"
                        : result.status === "error"
                          ? "text-red-600"
                          : "text-blue-600"
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
                检测结果: {domainInfo.domain}
              </div>
              <Badge
                variant={
                  domainInfo.status === "active" ? "default" : "destructive"
                }
              >
                {domainInfo.status === "active" ? "在线" : "离线"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="dns">DNS记录</TabsTrigger>
                <TabsTrigger value="ssl">SSL证书</TabsTrigger>
                <TabsTrigger value="performance">性能指标</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>域名</Label>
                    <div className="flex items-center gap-2">
                      <Input value={domainInfo.domain} readOnly />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(domainInfo.domain)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {domainInfo.ipAddress && (
                    <div className="space-y-2">
                      <Label>IP地址</Label>
                      <div className="flex items-center gap-2">
                        <Input value={domainInfo.ipAddress} readOnly />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(domainInfo.ipAddress!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="dns" className="space-y-4">
                {domainInfo.dnsRecords && (
                  <div className="space-y-4">
                    {Object.entries(domainInfo.dnsRecords).map(
                      ([type, records]) =>
                        records &&
                        records.length > 0 && (
                          <div key={type} className="space-y-2">
                            <Label className="flex items-center gap-2">
                              {type} 记录
                              <Badge variant="secondary">
                                {records.length}
                              </Badge>
                            </Label>
                            <div className="space-y-2">
                              {records.map((record, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <Input value={record} readOnly />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(record)}
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

              <TabsContent value="ssl" className="space-y-4">
                {domainInfo.sslInfo && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`h-5 w-5 ${domainInfo.sslInfo.valid ? "text-green-600" : "text-red-600"}`}
                      />
                      <span className="font-medium">
                        SSL证书状态:{" "}
                        {domainInfo.sslInfo.valid ? "有效" : "无效"}
                      </span>
                    </div>

                    {domainInfo.sslInfo.valid && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {domainInfo.sslInfo.issuer && (
                          <div className="space-y-2">
                            <Label>证书颁发机构</Label>
                            <Input value={domainInfo.sslInfo.issuer} readOnly />
                          </div>
                        )}
                        {domainInfo.sslInfo.validFrom && (
                          <div className="space-y-2">
                            <Label>生效日期</Label>
                            <Input
                              value={formatDate(domainInfo.sslInfo.validFrom)}
                              readOnly
                            />
                          </div>
                        )}
                        {domainInfo.sslInfo.validTo && (
                          <div className="space-y-2">
                            <Label>过期日期</Label>
                            <Input
                              value={formatDate(domainInfo.sslInfo.validTo)}
                              readOnly
                            />
                          </div>
                        )}
                        {domainInfo.sslInfo.daysLeft !== undefined && (
                          <div className="space-y-2">
                            <Label>剩余天数</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={`${domainInfo.sslInfo.daysLeft} 天`}
                                readOnly
                              />
                              {domainInfo.sslInfo.daysLeft < 30 && (
                                <Badge variant="destructive">即将过期</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                {domainInfo.performanceInfo && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {domainInfo.performanceInfo.responseTime && (
                        <div className="space-y-2">
                          <Label>响应时间</Label>
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
                                ? "优秀"
                                : domainInfo.performanceInfo.responseTime < 500
                                  ? "良好"
                                  : "较慢"}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {domainInfo.performanceInfo.httpStatus && (
                        <div className="space-y-2">
                          <Label>HTTP状态码</Label>
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
                                ? "正常"
                                : "异常"}
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
        <AlertTitle>使用说明</AlertTitle>
        <AlertDescription>
          此工具提供域名的基础信息检测，包括DNS记录、SSL证书状态和性能指标。
          由于浏览器安全限制，某些高级功能（如WHOIS查询）需要服务端支持。
          检测结果仅供参考，实际情况可能因网络环境而异。
        </AlertDescription>
      </Alert>
    </div>
  );
}
