"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Key, FileJson, RefreshCw, Lock, Unlock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as jwt from 'jsonwebtoken';

// JWT 算法选项
const jwtAlgorithms = [
  { value: "HS256", label: "HS256 (HMAC + SHA256)" },
  { value: "HS384", label: "HS384 (HMAC + SHA384)" },
  { value: "HS512", label: "HS512 (HMAC + SHA512)" },
  { value: "RS256", label: "RS256 (RSA + SHA256)" },
  { value: "RS384", label: "RS384 (RSA + SHA384)" },
  { value: "RS512", label: "RS512 (RSA + SHA512)" },
  { value: "ES256", label: "ES256 (ECDSA + SHA256)" },
  { value: "ES384", label: "ES384 (ECDSA + SHA384)" },
  { value: "ES512", label: "ES512 (ECDSA + SHA512)" },
];

// 示例 JWT 负载
const examplePayload = {
  "sub": "1234567890",
  "name": "John Doe",
  "iat": Math.floor(Date.now() / 1000),
  "exp": Math.floor(Date.now() / 1000) + 3600,
  "iss": "example.com",
  "aud": "client"
};

export default function JwtPage() {
  // 编码状态
  const [encodeMode, setEncodeMode] = useState(true);
  const [jwtToken, setJwtToken] = useState("");
  const [header, setHeader] = useState(JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2));
  const [payload, setPayload] = useState(JSON.stringify(examplePayload, null, 2));
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [algorithm, setAlgorithm] = useState("HS256");
  const [decodedHeader, setDecodedHeader] = useState("");
  const [decodedPayload, setDecodedPayload] = useState("");
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [verifySecret, setVerifySecret] = useState(true);
  const [expiryStatus, setExpiryStatus] = useState<string | null>(null);

  // 生成 JWT
  const generateJwt = () => {
    try {
      const headerObj = JSON.parse(header);
      const payloadObj = JSON.parse(payload);
      
      // 对于 HMAC 算法，使用密钥字符串
      // 对于其他算法，这里应该使用适当的私钥
      const token = jwt.sign(payloadObj, secret, { 
        algorithm: algorithm as jwt.Algorithm,
        header: headerObj
      });
      
      setJwtToken(token);
      toast.success("JWT 生成成功");
    } catch (error) {
      console.error(error);
      toast.error(`JWT 生成失败: ${(error as Error).message}`);
    }
  };

  // 解码 JWT
  const decodeJwt = () => {
    try {
      if (!jwtToken) {
        toast.error("请输入 JWT 令牌");
        return;
      }

      // 先尝试不验证签名的解码
      const decoded = jwt.decode(jwtToken, { complete: true });
      
      if (!decoded) {
        setIsTokenValid(false);
        setDecodedHeader("");
        setDecodedPayload("");
        toast.error("无效的 JWT 格式");
        return;
      }
      
      setDecodedHeader(JSON.stringify(decoded.header, null, 2));
      setDecodedPayload(JSON.stringify(decoded.payload, null, 2));
      
      // 检查过期状态
      const payload = decoded.payload as { exp?: number, iat?: number };
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp) {
        if (payload.exp < now) {
          setExpiryStatus("已过期");
        } else {
          const timeLeft = payload.exp - now;
          const hours = Math.floor(timeLeft / 3600);
          const minutes = Math.floor((timeLeft % 3600) / 60);
          setExpiryStatus(`有效期还剩 ${hours}小时 ${minutes}分钟`);
        }
      } else {
        setExpiryStatus("未设置过期时间");
      }
      
      // 如果需要验证签名
      if (verifySecret) {
        try {
          jwt.verify(jwtToken, secret);
          setIsTokenValid(true);
          toast.success("JWT 解码成功，签名有效");
        } catch (error) {
          setIsTokenValid(false);
          toast.error(`签名无效: ${(error as Error).message}`);
        }
      } else {
        setIsTokenValid(null);
        toast.success("JWT 解码成功（未验证签名）");
      }
    } catch (error) {
      console.error(error);
      toast.error(`JWT 解码失败: ${(error as Error).message}`);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  // 格式化 JSON
  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  // 当切换模式时重置状态
  useEffect(() => {
    if (encodeMode) {
      setDecodedHeader("");
      setDecodedPayload("");
      setIsTokenValid(null);
      setExpiryStatus(null);
    } else {
      setHeader(JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2));
      setPayload(JSON.stringify(examplePayload, null, 2));
    }
  }, [encodeMode]);

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">JWT 编解码工具</h1>
        <p className="text-muted-foreground">
          JSON Web Token (JWT) 的编码和解码工具
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <Tabs
          value={encodeMode ? "encode" : "decode"}
          onValueChange={(value) => setEncodeMode(value === "encode")}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              编码
            </TabsTrigger>
            <TabsTrigger value="decode" className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              解码
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {encodeMode ? (
        // 编码模式
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  JWT 头部 (Header)
                </CardTitle>
                <CardDescription>
                  定义 JWT 的类型和使用的签名算法
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  className="font-mono text-sm min-h-[120px]"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHeader(formatJson(header))}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    格式化
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  JWT 负载 (Payload)
                </CardTitle>
                <CardDescription>
                  包含要传输的声明（claims）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPayload(formatJson(payload))}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    格式化
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  签名设置
                </CardTitle>
                <CardDescription>
                  用于生成签名的密钥和算法
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="algorithm">签名算法</Label>
                  <select
                    id="algorithm"
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  >
                    {jwtAlgorithms.map((alg) => (
                      <option key={alg.value} value={alg.value}>
                        {alg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret">密钥 (Secret/Key)</Label>
                  <Input
                    id="secret"
                    type="text"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    对于 HMAC 算法，输入密钥字符串；对于 RSA/ECDSA，应使用私钥
                  </p>
                </div>

                <Button onClick={generateJwt} className="w-full">
                  生成 JWT
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  生成的 JWT
                </CardTitle>
                <CardDescription>
                  可以复制并使用的 JWT 令牌
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={jwtToken}
                    readOnly
                    className="font-mono text-sm min-h-[120px] bg-muted"
                  />
                  {jwtToken && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => copyToClipboard(jwtToken)}
                        variant="outline"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        复制 JWT
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // 解码模式
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  JWT 令牌
                </CardTitle>
                <CardDescription>
                  输入要解码的 JWT 令牌
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={jwtToken}
                  onChange={(e) => setJwtToken(e.target.value)}
                  placeholder="在此粘贴 JWT 令牌..."
                  className="font-mono text-sm min-h-[120px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  验证设置
                </CardTitle>
                <CardDescription>
                  用于验证 JWT 签名的设置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="verify-signature"
                    checked={verifySecret}
                    onCheckedChange={setVerifySecret}
                  />
                  <Label htmlFor="verify-signature">验证签名</Label>
                </div>

                {verifySecret && (
                  <div className="space-y-2">
                    <Label htmlFor="verify-secret">密钥 (Secret/Key)</Label>
                    <Input
                      id="verify-secret"
                      type="text"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      对于 HMAC 算法，输入密钥字符串；对于 RSA/ECDSA，应使用公钥
                    </p>
                  </div>
                )}

                <Button onClick={decodeJwt} className="w-full">
                  解码 JWT
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {(decodedHeader || decodedPayload) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Unlock className="h-5 w-5" />
                    解码结果
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {isTokenValid === true && (
                      <span className="text-green-500 flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        签名有效
                      </span>
                    )}
                    {isTokenValid === false && (
                      <span className="text-red-500 flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        签名无效
                      </span>
                    )}
                    {isTokenValid === null && "未验证签名"}
                    
                    {expiryStatus && (
                      <span className={`ml-2 ${expiryStatus === "已过期" ? "text-red-500" : "text-green-500"}`}>
                        {expiryStatus}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>头部 (Header)</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(decodedHeader)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="bg-muted p-3 rounded-md overflow-auto text-xs font-mono">
                      {decodedHeader}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>负载 (Payload)</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(decodedPayload)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="bg-muted p-3 rounded-md overflow-auto text-xs font-mono">
                      {decodedPayload}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 