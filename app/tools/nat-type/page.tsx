"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STUN_SERVERS = [
    "stun:stun.miwifi.com:3478",
    "stun:stun.avigora.fr:3478",
    "stun:stun.imp.ch:3478",
    "stun:stun.root-1.de:3478",
    "stun:stun.axialys.net:3478",
    "stun:stun.sonetel.net:3478",
    "stun:stun.skydrone.aero:3478",
    "stun:stun.dcalling.de:3478",
    "stun:stun.telnyx.com:3478",
    "stun:stun.siptrunk.com:3478",
    "stun:stun.romaaeterna.nl:3478",
    "stun:stun.voipia.net:3478",
    "stun:stun.nextcloud.com:443",
    "stun:stun.m-online.net:3478",
    "stun:stun.ringostat.com:3478",
    "stun:stun.fitauto.ru:3478",
    "stun:stun.cope.es:3478",
    "stun:stun.nanocosmos.de:3478",
    "stun:stun.streamnow.ch:3478",
    "stun:stun.hot-chilli.net:3478",
    "stun:stun.pure-ip.com:3478",
    "stun:stun.radiojar.com:3478",
    "stun:stun.sip.us:3478",
];

const NAT_TYPE_DESCRIPTION = [
    {
        type: "NAT1 - 全锥形NAT (Full Cone NAT)",
        description: "这是最宽松的网络环境，IP和端口都不受限。\n\n• 任何外部主机都可以通过映射的公网IP和端口访问内网设备\n• 适合运行P2P应用和CDN业务\n• 可获得最佳的网络连接体验和业务收益"
    },
    {
        type: "NAT2 - 受限锥型NAT (Address-Restricted Cone NAT)",
        description: "相比NAT1增加了地址限制，IP受限但端口不受限。\n\n• 只有之前通信过的外部主机IP可以访问映射的端口\n• 仍能支持大多数P2P应用\n• 网络体验较好但不如NAT1开放"
    },
    {
        type: "NAT3 - 端口受限锥型NAT (Port-Restricted Cone NAT)",
        description: "相比NAT2又增加了端口限制，IP和端口都受限。\n\n• 只有之前通信过的外部主机IP和端口可以访问\n• 对P2P应用支持有限\n• 可能需要借助TURN服务器建立连接"
    },
    {
        type: "NAT4 - 对称型NAT (Symmetric NAT)",
        description: "最严格的NAT类型，基本上告别P2P。\n\n• 每个外部目标地址和端口都会创建新的映射\n• 请求不同外部地址时端口号可能不同\n• 除非具有IPv6地址，否则无法运行CDN业务\n• 游戏联机、视频通话等体验较差"
    }
];

const NAT_OPTIMIZATION_TIPS = [
    "若光猫为路由模式（光猫拨号），则电脑直连光猫，不再连接自己的路由器。",
    "将光猫改为桥接模式，用路由器拨号。",
    "换用其他运营商。移动宽带常出现局端限制NAT4，无论客户端如何修改也无济于事。联通和电信通常为NAT1，有些地区为公网，无NAT。",
    "打开IPv6功能，不再纠结NAT类型。",
    "针对学校、企业等网络，不要使用自己的路由器上网，使用交换机直连电脑，减少路由层数。"
];

export default function NatTypeCheckerPage() {
    const [selectedServer, setSelectedServer] = useState(STUN_SERVERS[0]);
    const [natType, setNatType] = useState<string | null>(null);
    const [publicIp, setPublicIp] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const detectNatType = async () => {
        setIsLoading(true);
        setNatType(null);
        setPublicIp(null);
        setError(null);
        setProgress(0);

        try {
            const config = {
                iceServers: [{ urls: selectedServer }],
            };

            const pc = new RTCPeerConnection(config);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    // Filter out non-host candidates for public IP discovery
                    if (event.candidate.candidate.includes("typ srflx")) {
                        const parts = event.candidate.candidate.split(" ");
                        const ip = parts[4];
                        setPublicIp(ip);
                    }
                    // For NAT type, we need to analyze multiple candidates and their types
                    // This is a simplified approach. A full NAT type detection is complex.
                    // For a more robust solution, consider a library like `nat-type-detector`
                    // or a more detailed analysis of ICE candidates.
                    if (event.candidate.type === "srflx") {
                        setNatType("NAT1/2 - Full Cone NAT or Restricted Cone NAT");
                    } else if (event.candidate.type === "prflx") {
                        setNatType("NAT3 - Port Restricted Cone NAT");
                    } else if (event.candidate.type === "relay") {
                        setNatType("NAT4 - Symmetric NAT (via TURN server if available)");
                    } else if (event.candidate.type === "host") {
                        setNatType("NAT0 - No NAT (Public IP)");
                    }
                }
            };

            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === "complete") {
                    setIsLoading(false);
                    setProgress(100);
                    if (!natType) {
                        setNatType("Unknown or Symmetric NAT (could not determine with STUN only)");
                    }
                } else if (pc.iceGatheringState === "gathering") {
                    setProgress(50);
                }
            };

            pc.oniceconnectionstatechange = () => {
                if (pc.iceConnectionState === "failed") {
                    setError("ICE connection failed. Could not determine NAT type.");
                    setIsLoading(false);
                    setProgress(100);
                }
            };

            // Create a dummy data channel to trigger ICE candidate gathering
            pc.createDataChannel("nat-check");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Set a timeout for the detection process
            setTimeout(() => {
                if (isLoading) {
                    setIsLoading(false);
                    setProgress(100);
                    if (!natType) {
                        setError("Detection timed out. Could not determine NAT type.");
                    }
                    pc.close();
                }
            }, 10000); // 10 seconds timeout

        } catch (err) {
            console.error("Error during NAT detection:", err);
            setError("An error occurred during detection. Please try again.");
            setIsLoading(false);
            setProgress(100);
        }
    };

    return (
        <div className="container relative">
            <div className="mx-auto py-10">
                <h1 className="font-heading text-3xl md:text-4xl">NAT类型检测工具</h1>

                <div className="pt-10">
                    <Card>
                        <CardHeader>
                            <CardTitle>NAT类型检测</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p>选择STUN服务器:</p>
                                <Select value={selectedServer} onValueChange={setSelectedServer}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="选择STUN服务器" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STUN_SERVERS.map((serverUrl) => (
                                            <SelectItem key={serverUrl} value={serverUrl}>
                                                {serverUrl}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={detectNatType} disabled={isLoading}>
                                {isLoading ? "检测中..." : "开始检测NAT类型"}
                            </Button>

                            {isLoading && (
                                <div className="space-y-2">
                                    <Progress value={progress} className="w-full" />
                                    <p className="text-sm text-muted-foreground">Gathering ICE candidates...</p>
                                </div>
                            )}
                            {error && (
                                <p className="text-red-500">错误: {error}</p>
                            )}
                            {natType && (
                                <div>
                                    <h3 className="font-semibold">检测到的NAT类型:</h3>
                                    <p>{natType}</p>
                                </div>
                            )}
                            {publicIp && (
                                <div>
                                    <h3 className="font-semibold">公网IP地址:</h3>
                                    <p>{publicIp}</p>
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground">
                                注意: 仅使用STUN服务器检测NAT类型可能不够准确，特别是对于对称NAT。如需更精确的结果，可能需要使用TURN服务器。
                            </p>

                        </CardContent>
                    </Card>
                </div>

                <div className="mt-10">
                    <Card>
                        <CardHeader>
                            <CardTitle>NAT类型详解</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                {NAT_TYPE_DESCRIPTION.map((nat) => (
                                    <Card key={nat.type} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                        <h4 className="font-medium text-lg mb-2">{nat.type}</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                                            {nat.description}
                                        </p>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-10">
                    <Card>
                        <CardHeader>
                            <CardTitle>如何优化NAT类型</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-2 text-base">
                                {NAT_OPTIMIZATION_TIPS.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}