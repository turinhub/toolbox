// 使用客户端 cookie 方法
const IMAGE_GENERATION_COUNT_COOKIE = 'image_generation_count';
const IMAGE_GENERATION_DATE_COOKIE = 'image_generation_date';
const MAX_DAILY_GENERATIONS = 5;

/**
 * 从请求中获取 cookie 值
 */
export function getCookieFromRequest(request: Request, name: string): string | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  
  const match = cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * 从请求中获取图像生成次数
 */
export function getGenerationCountFromRequest(request: Request): number {
  const countCookie = getCookieFromRequest(request, IMAGE_GENERATION_COUNT_COOKIE);
  const dateCookie = getCookieFromRequest(request, IMAGE_GENERATION_DATE_COOKIE);
  
  if (!dateCookie || !isToday(dateCookie)) {
    return 0;
  }
  
  return countCookie ? parseInt(countCookie, 10) : 0;
}

/**
 * 检查请求是否已达到每日限制
 */
export function hasRequestReachedLimit(request: Request): boolean {
  const count = getGenerationCountFromRequest(request);
  return count >= MAX_DAILY_GENERATIONS;
}

/**
 * 为响应设置更新后的生成次数 cookie
 */
export function setGenerationCountCookies(response: Response): Response {
  const count = parseInt(response.headers.get('X-Generation-Count') || '0', 10);
  const today = new Date().toISOString().split('T')[0];
  const expires = getTomorrowMidnight().toUTCString();
  
  response.headers.append('Set-Cookie', 
    `${IMAGE_GENERATION_COUNT_COOKIE}=${count}; Path=/; Expires=${expires}; HttpOnly; SameSite=Strict`
  );
  response.headers.append('Set-Cookie', 
    `${IMAGE_GENERATION_DATE_COOKIE}=${today}; Path=/; Expires=${expires}; HttpOnly; SameSite=Strict`
  );
  
  return response;
}

/**
 * 检查日期字符串是否为今天
 */
function isToday(dateString: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
}

/**
 * 获取明天凌晨的日期对象
 */
function getTomorrowMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * 获取客户端剩余的生成次数（客户端使用）
 */
export function getRemainingGenerationsClient(): number {
  // 确保在客户端环境
  if (typeof document === 'undefined') return MAX_DAILY_GENERATIONS;
  
  const countCookie = getCookieClient(IMAGE_GENERATION_COUNT_COOKIE);
  const dateCookie = getCookieClient(IMAGE_GENERATION_DATE_COOKIE);
  
  if (!dateCookie || !isToday(dateCookie)) {
    return MAX_DAILY_GENERATIONS;
  }
  
  const count = countCookie ? parseInt(countCookie, 10) : 0;
  return Math.max(0, MAX_DAILY_GENERATIONS - count);
}

/**
 * 从客户端获取 cookie 值
 */
function getCookieClient(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
} 