import jwt from "jsonwebtoken";

const HUMAN_VERIFICATION_COOKIE = "human_verified";
const HUMAN_VERIFICATION_AUDIENCE = "turinhub-toolbox";
const HUMAN_VERIFICATION_ISSUER = "turinhub-toolbox-turnstile";
const HUMAN_VERIFICATION_TTL_SECONDS = 60 * 60;

export function isHumanVerificationConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY &&
      process.env.CLOUDFLARE_TURNSTILE_SECRETKEY
  );
}

// 服务端验证函数
export async function validateTurnstileToken(token: string): Promise<boolean> {
  if (!isHumanVerificationConfigured()) return false;

  const formData = new FormData();
  formData.append("secret", process.env.CLOUDFLARE_TURNSTILE_SECRETKEY || "");
  formData.append("response", token);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error("Turnstile validation error:", error);
    return false;
  }
}

export function createHumanVerificationToken() {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRETKEY;
  if (!secret) throw new Error("Turnstile secret is not configured");
  return jwt.sign({ verified: true }, secret, {
    algorithm: "HS256",
    audience: HUMAN_VERIFICATION_AUDIENCE,
    issuer: HUMAN_VERIFICATION_ISSUER,
    subject: "human-verification",
    expiresIn: HUMAN_VERIFICATION_TTL_SECONDS,
  });
}

// 检查 NextRequest 是否已通过人机验证
export function isHumanVerified(request: Request): boolean {
  const cookie = request.headers.get("cookie") || "";
  const value = cookie
    .split(";")
    .map(item => item.trim())
    .find(item => item.startsWith(`${HUMAN_VERIFICATION_COOKIE}=`))
    ?.slice(HUMAN_VERIFICATION_COOKIE.length + 1);
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRETKEY;
  if (!value || !secret) return false;

  try {
    const payload = jwt.verify(decodeURIComponent(value), secret, {
      algorithms: ["HS256"],
      audience: HUMAN_VERIFICATION_AUDIENCE,
      issuer: HUMAN_VERIFICATION_ISSUER,
      subject: "human-verification",
    });
    return (
      typeof payload === "object" &&
      payload !== null &&
      payload.verified === true
    );
  } catch {
    return false;
  }
}

export const humanVerificationCookieName = HUMAN_VERIFICATION_COOKIE;
export const humanVerificationTtlSeconds = HUMAN_VERIFICATION_TTL_SECONDS;
