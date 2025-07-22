"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface NetworkInfo {
    ipAddress?: string;
    country?: string;
    countryCode?: string;
    region?: string;
    regionName?: string;
    city?: string;
    zip?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    isp?: string;
    org?: string;
    asn?: string;
    as?: string;
    query?: string;
}

interface SiteTestResult {
    url: string;
    status: "idle" | "testing" | "success" | "failed";
    latency: number | null;
    error: string | null;
}

interface PredefinedSite {
    name: string;
    logo: string;
    url: string;
    type: "domestic" | "international";
}

const predefinedSites: PredefinedSite[] = [
    { name: "Google", logo: "https://www.google.com/favicon.ico", url: "https://www.google.com", type: "international" },
    { name: "GitHub", logo: "https://github.githubassets.com/favicons/favicon.svg", url: "https://www.github.com", type: "international" },
    { name: "Bilibili", logo: "https://www.bilibili.com/favicon.ico", url: "https://www.bilibili.com", type: "domestic" },
    { name: "OpenAI", logo: "https://openai.com/favicon.ico", url: "https://openai.com", type: "international" },
    { name: "X (Twitter)", logo: "https://abs.twimg.com/favicons/twitter.2.ico", url: "https://x.com", type: "international" },
    { name: "Weibo", logo: "https://weibo.com/favicon.ico", url: "https://weibo.com", type: "domestic" },
    { name: "YouTube", logo: "https://www.youtube.com/favicon.ico", url: "https://www.youtube.com", type: "international" },
    { name: "Douyin", logo: "https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico", url: "https://www.douyin.com", type: "domestic" },
    { name: "TikTok", logo: "https://www.tiktok.com/favicon.ico", url: "https://www.tiktok.com", type: "international" },
];

export default function NetworkInfoPage() {
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [apiSource, setApiSource] = useState<"ip.sb" | "ip-api.com">("ip.sb");
    const [error, setError] = useState<string | null>(null);
    const [siteTestResults, setSiteTestResults] = useState<SiteTestResult[]>(() =>
        predefinedSites.map((site) => ({ url: site.url, status: "idle", latency: null, error: null }))
    );
    const [testingAllSites, setTestingAllSites] = useState<boolean>(false);

    const fetchNetworkInfo = async (source: "ip.sb" | "ip-api.com") => {
        setLoading(true);
        setProgress(0);
        setNetworkInfo(null);
        setError(null);

        try {
            let data: NetworkInfo = {};
            if (source === "ip.sb") {
                setProgress(30);
                const ipSbResponse = await fetch("https://api.ip.sb/geoip");
                if (!ipSbResponse.ok) {
                    throw new Error(`IP.SB API error: ${ipSbResponse.statusText}`);
                }
                const ipSbData = await ipSbResponse.json();
                data = {
                    ipAddress: ipSbData.ip,
                    country: ipSbData.country,
                    countryCode: ipSbData.country_code,
                    city: ipSbData.city,
                    lat: ipSbData.latitude,
                    lon: ipSbData.longitude,
                    timezone: ipSbData.timezone,
                    isp: ipSbData.isp,
                    org: ipSbData.organization,
                    asn: ipSbData.asn_organization,
                    query: ipSbData.ip,
                };
            } else {
                setProgress(30);
                const ipApiComResponse = await fetch("http://ip-api.com/json");
                if (!ipApiComResponse.ok) {
                    throw new Error(`IP-API.com error: ${ipApiComResponse.statusText}`);
                }
                const ipApiComData = await ipApiComResponse.json();
                if (ipApiComData.status === "fail") {
                    throw new Error(`IP-API.com status: ${ipApiComData.message}`);
                }
                data = {
                    ipAddress: ipApiComData.query,
                    country: ipApiComData.country,
                    countryCode: ipApiComData.countryCode,
                    region: ipApiComData.region,
                    regionName: ipApiComData.regionName,
                    city: ipApiComData.city,
                    zip: ipApiComData.zip,
                    lat: ipApiComData.lat,
                    lon: ipApiComData.lon,
                    timezone: ipApiComData.timezone,
                    isp: ipApiComData.isp,
                    org: ipApiComData.org,
                    asn: ipApiComData.as,
                    query: ipApiComData.query,
                };
            }
            setNetworkInfo(data);
            setProgress(100);
        } catch (err) {
            console.error("获取网络信息失败:", err);
            setError(`获取网络信息失败: ${(err as Error).message}`);
            setProgress(0);
        } finally {
            setLoading(false);
        }
    };

    const testSiteConnectivity = async (url: string) => {
        setSiteTestResults((prevResults) =>
            prevResults.map((result) =>
                result.url === url ? { ...result, status: "testing", latency: null, error: null } : result
            )
        );
        const startTime = performance.now();
        try {
            await fetch(url, { mode: 'no-cors' }); // Use no-cors for basic reachability
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);
            setSiteTestResults((prevResults) =>
                prevResults.map((result) =>
                    result.url === url
                        ? { ...result, status: "success", latency, error: null }
                        : result
                )
            );
        } catch (err) {
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);
            setSiteTestResults((prevResults) =>
                prevResults.map((result) =>
                    result.url === url
                        ? { ...result, status: "failed", latency, error: (err as Error).message }
                        : result
                )
            );
        }
    };

    const testAllSites = async () => {
        setTestingAllSites(true);
        setSiteTestResults(predefinedSites.map((site) => ({ url: site.url, status: "idle", latency: null, error: null })));
        for (const site of predefinedSites) {
            await testSiteConnectivity(site.url);
        }
        setTestingAllSites(false);
    };

    useEffect(() => {
        fetchNetworkInfo(apiSource);
    }, [apiSource]);

    const domesticSites = predefinedSites.filter(site => site.type === "domestic");
    const internationalSites = predefinedSites.filter(site => site.type === "international");

    const renderSiteBadges = (sites: PredefinedSite[]) => (
        <div className="mb-4 flex flex-wrap gap-2">
            {sites.map((site) => {
                const result = siteTestResults.find((r) => r.url === site.url);
                let variant: "default" | "secondary" | "outline" | "destructive" | "success" | null = "secondary";
                let pingText = "";

                if (result) {
                    if (result.status === "testing") {
                        variant = "outline";
                        pingText = "测试中...";
                    } else if (result.status === "success") {
                        variant = "success";
                        pingText = `${result.latency}ms`;
                    } else if (result.status === "failed") {
                        variant = "destructive";
                        pingText = "失败";
                    }
                }

                return (
                    <Badge
                        key={site.url}
                        variant={variant === "success" ? "default" : variant} // 将 success 变体映射为 default 变体
                        className="cursor-pointer flex items-center space-x-1 pr-3"
                        onClick={() => !testingAllSites && testSiteConnectivity(site.url)}
                    >
                        <Image src={site.logo} alt={site.name} width={16} height={16} className="w-4 h-4 rounded-full" /> {/* Replace <img> with <Image /> */}
                        <span>{site.name}</span>
                        {pingText && <span className="ml-2 text-xs opacity-75">{pingText}</span>}
                    </Badge>
                );
            })}
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">网络信息相关</h1>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>网络信息查询</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex space-x-2">
                        <Button
                            onClick={() => setApiSource("ip.sb")}
                            disabled={loading}
                            variant={apiSource === "ip.sb" ? "default" : "outline"}
                        >
                            使用 IP.SB API
                        </Button>
                        <Button
                            onClick={() => setApiSource("ip-api.com")}
                            disabled={loading}
                            variant={apiSource === "ip-api.com" ? "default" : "outline"}
                        >
                            使用 IP-API.com API
                        </Button>
                    </div>

                    {loading && (
                        <div className="mb-4">
                            <p className="mb-2">正在获取网络信息...</p>
                            <Progress value={progress} className="w-full" />
                        </div>
                    )}

                    {error && (
                        <Card className="mb-4 border-red-500 bg-red-50/50">
                            <CardHeader>
                                <CardTitle className="text-red-700">错误</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-red-600">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    {networkInfo && !loading && !error && (
                        <Card className="mb-4">
                            <CardHeader>
                                <CardTitle>您的网络信息</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center">
                                    <span className="font-semibold mr-2">IP 地址:</span>
                                    <Badge variant="secondary">{networkInfo.ipAddress}</Badge>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold mr-2">国家:</span>
                                    <Badge variant="secondary">
                                        {networkInfo.country} ({networkInfo.countryCode})
                                    </Badge>
                                </div>
                                {networkInfo.regionName && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">区域:</span>
                                        <Badge variant="secondary">
                                            {networkInfo.regionName} ({networkInfo.region})
                                        </Badge>
                                    </div>
                                )}
                                {networkInfo.city && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">城市:</span>
                                        <Badge variant="secondary">{networkInfo.city}</Badge>
                                    </div>
                                )}
                                {networkInfo.zip && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">邮编:</span>
                                        <Badge variant="secondary">{networkInfo.zip}</Badge>
                                    </div>
                                )}
                                {(networkInfo.lat || networkInfo.lon) && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">经纬度:</span>
                                        <Badge variant="secondary">
                                            {networkInfo.lat}, {networkInfo.lon}
                                        </Badge>
                                    </div>
                                )}
                                {networkInfo.timezone && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">时区:</span>
                                        <Badge variant="secondary">{networkInfo.timezone}</Badge>
                                    </div>
                                )}
                                {networkInfo.isp && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">ISP:</span>
                                        <Badge variant="secondary">{networkInfo.isp}</Badge>
                                    </div>
                                )}
                                {networkInfo.org && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">组织:</span>
                                        <Badge variant="secondary">{networkInfo.org}</Badge>
                                    </div>
                                )}
                                {networkInfo.asn && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">ASN:</span>
                                        <Badge variant="secondary">{networkInfo.asn}</Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>站点连通性测试</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button onClick={testAllSites} disabled={testingAllSites}>
                        {testingAllSites ? "正在测试所有站点..." : "一键全部测试"}
                    </Button>
                    <h3 className="text-lg font-semibold mb-2 mt-4">国内站点</h3>
                    {renderSiteBadges(domesticSites)}
                    <h3 className="text-lg font-semibold mb-2 mt-4">海外站点</h3>
                    {renderSiteBadges(internationalSites)}
                </CardContent>
            </Card>
        </div>
    );
}