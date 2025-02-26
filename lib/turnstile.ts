// 服务端验证函数
export async function validateTurnstileToken(token: string): Promise<boolean> {
  const formData = new FormData();
  formData.append('secret', process.env.CLOUDFLARE_TURNSTILE_SECRETKEY || '');
  formData.append('response', token);

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('Turnstile validation error:', error);
    return false;
  }
}

// 检查 NextRequest 是否已通过人机验证
export function isHumanVerified(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  return cookie.includes('human_verified=true');
} 