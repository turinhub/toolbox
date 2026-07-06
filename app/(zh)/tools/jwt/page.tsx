"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Key, FileJson, RefreshCw, Lock, Unlock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as jwt from "jsonwebtoken";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

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
  sub: "1234567890",
  name: "John Doe",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  iss: "example.com",
  aud: "client",
};

export default function JwtPage() {
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        encode: "Encode",
        decode: "Decode",
        headerTitle: "JWT Header",
        headerDescription: "Defines the JWT type and signing algorithm.",
        payloadTitle: "JWT Payload",
        payloadDescription: "Contains the claims to transmit.",
        format: "Format",
        signingTitle: "Signing settings",
        signingDescription: "Key and algorithm used to generate the signature.",
        algorithm: "Signing algorithm",
        secret: "Secret / Key",
        privateHelp:
          "For HMAC algorithms, enter a secret string. For RSA/ECDSA, use a private key.",
        publicHelp:
          "For HMAC algorithms, enter a secret string. For RSA/ECDSA, use a public key.",
        generate: "Generate JWT",
        generatedTitle: "Generated JWT",
        generatedDescription: "JWT token ready to copy and use.",
        copyJwt: "Copy JWT",
        tokenTitle: "JWT token",
        tokenDescription: "Enter the JWT token to decode.",
        tokenPlaceholder: "Paste a JWT token here...",
        verifyTitle: "Verification settings",
        verifyDescription: "Settings used to verify the JWT signature.",
        verifySignature: "Verify signature",
        decodeJwt: "Decode JWT",
        resultTitle: "Decoded result",
        signatureValid: "Signature valid",
        signatureInvalid: "Signature invalid",
        notVerified: "Signature not verified",
        expired: "Expired",
        expiresIn: "Expires in {hours}h {minutes}m",
        noExpiry: "No expiration set",
        headerLabel: "Header",
        payloadLabel: "Payload",
        generatedSuccess: "JWT generated",
        generatedFailed: "JWT generation failed",
        enterToken: "Enter a JWT token",
        invalidFormat: "Invalid JWT format",
        decodedValid: "JWT decoded. Signature is valid.",
        invalidSignature: "Invalid signature",
        decodedNoVerify: "JWT decoded without signature verification.",
        decodeFailed: "JWT decoding failed",
        copied: "Copied to clipboard",
      }
    : {
        encode: "编码",
        decode: "解码",
        headerTitle: "JWT 头部 (Header)",
        headerDescription: "定义 JWT 的类型和使用的签名算法",
        payloadTitle: "JWT 负载 (Payload)",
        payloadDescription: "包含要传输的声明（claims）",
        format: "格式化",
        signingTitle: "签名设置",
        signingDescription: "用于生成签名的密钥和算法",
        algorithm: "签名算法",
        secret: "密钥 (Secret/Key)",
        privateHelp:
          "对于 HMAC 算法，输入密钥字符串；对于 RSA/ECDSA，应使用私钥",
        publicHelp:
          "对于 HMAC 算法，输入密钥字符串；对于 RSA/ECDSA，应使用公钥",
        generate: "生成 JWT",
        generatedTitle: "生成的 JWT",
        generatedDescription: "可以复制并使用的 JWT 令牌",
        copyJwt: "复制 JWT",
        tokenTitle: "JWT 令牌",
        tokenDescription: "输入要解码的 JWT 令牌",
        tokenPlaceholder: "在此粘贴 JWT 令牌…",
        verifyTitle: "验证设置",
        verifyDescription: "用于验证 JWT 签名的设置",
        verifySignature: "验证签名",
        decodeJwt: "解码 JWT",
        resultTitle: "解码结果",
        signatureValid: "签名有效",
        signatureInvalid: "签名无效",
        notVerified: "未验证签名",
        expired: "已过期",
        expiresIn: "有效期还剩 {hours}小时 {minutes}分钟",
        noExpiry: "未设置过期时间",
        headerLabel: "头部 (Header)",
        payloadLabel: "负载 (Payload)",
        generatedSuccess: "JWT 生成成功",
        generatedFailed: "JWT 生成失败",
        enterToken: "请输入 JWT 令牌",
        invalidFormat: "无效的 JWT 格式",
        decodedValid: "JWT 解码成功，签名有效",
        invalidSignature: "签名无效",
        decodedNoVerify: "JWT 解码成功（未验证签名）",
        decodeFailed: "JWT 解码失败",
        copied: "已复制到剪贴板",
      };
  // 编码状态
  const [encodeMode, setEncodeMode] = useState(true);
  const [jwtToken, setJwtToken] = useState("");
  const [header, setHeader] = useState(
    JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)
  );
  const [payload, setPayload] = useState(
    JSON.stringify(examplePayload, null, 2)
  );
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
        header: headerObj,
      });

      setJwtToken(token);
      toast.success(copy.generatedSuccess);
    } catch (error) {
      console.error(error);
      toast.error(`${copy.generatedFailed}: ${(error as Error).message}`);
    }
  };

  // 解码 JWT
  const decodeJwt = () => {
    try {
      if (!jwtToken) {
        toast.error(copy.enterToken);
        return;
      }

      // 先尝试不验证签名的解码
      const decoded = jwt.decode(jwtToken, { complete: true });

      if (!decoded) {
        setIsTokenValid(false);
        setDecodedHeader("");
        setDecodedPayload("");
        toast.error(copy.invalidFormat);
        return;
      }

      setDecodedHeader(JSON.stringify(decoded.header, null, 2));
      setDecodedPayload(JSON.stringify(decoded.payload, null, 2));

      // 检查过期状态
      const payload = decoded.payload as { exp?: number; iat?: number };
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp) {
        if (payload.exp < now) {
          setExpiryStatus(copy.expired);
        } else {
          const timeLeft = payload.exp - now;
          const hours = Math.floor(timeLeft / 3600);
          const minutes = Math.floor((timeLeft % 3600) / 60);
          setExpiryStatus(
            copy.expiresIn
              .replace("{hours}", String(hours))
              .replace("{minutes}", String(minutes))
          );
        }
      } else {
        setExpiryStatus(copy.noExpiry);
      }

      // 如果需要验证签名
      if (verifySecret) {
        try {
          jwt.verify(jwtToken, secret);
          setIsTokenValid(true);
          toast.success(copy.decodedValid);
        } catch (error) {
          setIsTokenValid(false);
          toast.error(`${copy.invalidSignature}: ${(error as Error).message}`);
        }
      } else {
        setIsTokenValid(null);
        toast.success(copy.decodedNoVerify);
      }
    } catch (error) {
      console.error(error);
      toast.error(`${copy.decodeFailed}: ${(error as Error).message}`);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(copy.copied);
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
      <div className="flex justify-center mb-4">
        <Tabs
          value={encodeMode ? "encode" : "decode"}
          onValueChange={value => setEncodeMode(value === "encode")}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encode" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {copy.encode}
            </TabsTrigger>
            <TabsTrigger value="decode" className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              {copy.decode}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {encodeMode ? (
        // 编码模式
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  {copy.headerTitle}
                </CardTitle>
                <CardDescription>{copy.headerDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={header}
                  onChange={e => setHeader(e.target.value)}
                  className="font-mono text-sm min-h-[120px]"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHeader(formatJson(header))}
                  >
                    <RefreshCw data-icon="inline-start" />
                    {copy.format}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  {copy.payloadTitle}
                </CardTitle>
                <CardDescription>{copy.payloadDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={payload}
                  onChange={e => setPayload(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPayload(formatJson(payload))}
                  >
                    <RefreshCw data-icon="inline-start" />
                    {copy.format}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {copy.signingTitle}
                </CardTitle>
                <CardDescription>{copy.signingDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="algorithm">{copy.algorithm}</Label>
                  <select
                    id="algorithm"
                    value={algorithm}
                    onChange={e => setAlgorithm(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  >
                    {jwtAlgorithms.map(alg => (
                      <option key={alg.value} value={alg.value}>
                        {alg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="secret">{copy.secret}</Label>
                  <Input
                    id="secret"
                    type="text"
                    value={secret}
                    onChange={e => setSecret(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {copy.privateHelp}
                  </p>
                </div>

                <Button onClick={generateJwt} className="w-full">
                  {copy.generate}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {copy.generatedTitle}
                </CardTitle>
                <CardDescription>{copy.generatedDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
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
                        <Copy data-icon="inline-start" />
                        {copy.copyJwt}
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
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {copy.tokenTitle}
                </CardTitle>
                <CardDescription>{copy.tokenDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={jwtToken}
                  onChange={e => setJwtToken(e.target.value)}
                  placeholder={copy.tokenPlaceholder}
                  className="font-mono text-sm min-h-[120px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {copy.verifyTitle}
                </CardTitle>
                <CardDescription>{copy.verifyDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="verify-signature"
                    checked={verifySecret}
                    onCheckedChange={setVerifySecret}
                  />
                  <Label htmlFor="verify-signature">
                    {copy.verifySignature}
                  </Label>
                </div>

                {verifySecret && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="verify-secret">{copy.secret}</Label>
                    <Input
                      id="verify-secret"
                      type="text"
                      value={secret}
                      onChange={e => setSecret(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      {copy.publicHelp}
                    </p>
                  </div>
                )}

                <Button onClick={decodeJwt} className="w-full">
                  {copy.decodeJwt}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            {(decodedHeader || decodedPayload) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Unlock className="h-5 w-5" />
                    {copy.resultTitle}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {isTokenValid === true && (
                      <span className="text-green-500 flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        {copy.signatureValid}
                      </span>
                    )}
                    {isTokenValid === false && (
                      <span className="text-red-500 flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        {copy.signatureInvalid}
                      </span>
                    )}
                    {isTokenValid === null && copy.notVerified}

                    {expiryStatus && (
                      <span
                        className={`ml-2 ${expiryStatus === copy.expired ? "text-red-500" : "text-green-500"}`}
                      >
                        {expiryStatus}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <Label>{copy.headerLabel}</Label>
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

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <Label>{copy.payloadLabel}</Label>
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
