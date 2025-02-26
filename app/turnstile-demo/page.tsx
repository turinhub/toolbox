"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TurnstileForm } from "@/components/common/TurnstileForm";
import { TurnstileProtection } from "@/components/common/TurnstileProtection";

// 创建一个内部组件来使用 useSearchParams
function TurnstileDemoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    // 获取重定向路径
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectPath(redirect);
    }
  }, [searchParams]);

  // 处理验证成功后的重定向
  const handleVerificationSuccess = () => {
    if (redirectPath) {
      router.push(redirectPath);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cloudflare Turnstile 演示</h1>
      
      {redirectPath && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-800 rounded-md">
          <p className="text-yellow-800 dark:text-yellow-300">
            您正在尝试访问受保护的内容。请先完成人机验证，验证成功后将自动跳转。
          </p>
        </div>
      )}
      
      <div className="mb-8">
        <p className="text-muted-foreground mb-4">
          这是一个使用 Cloudflare Turnstile 进行人机验证的示例。
          本网站支持匿名访问，不需要提供邮箱等用户信息，
          但为了防止自动化攻击，某些敏感操作可能需要验证您是人类。
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">基础人机验证</h2>
          <TurnstileForm onVerificationSuccess={redirectPath ? handleVerificationSuccess : undefined} />
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">保护内容示例</h2>
          <TurnstileProtection>
            <div className="p-4 border border-green-500 bg-green-50 dark:bg-green-950 rounded-md">
              <p className="text-green-700 dark:text-green-300">
                这是受保护的内容，只有通过人机验证后才能看到。
              </p>
            </div>
          </TurnstileProtection>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="text-lg font-medium mb-2">实现说明</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>客户端组件使用 <code className="bg-muted-foreground/20 px-1 rounded">next-turnstile</code> 包来渲染验证组件</li>
          <li>服务端使用 Cloudflare Turnstile API 验证令牌的有效性</li>
          <li>验证成功后，设置 HTTP-only cookie 作为临时会话标记</li>
          <li>提供了 <code className="bg-muted-foreground/20 px-1 rounded">TurnstileProtection</code> 组件，可以包装需要保护的内容</li>
          <li>使用中间件自动拦截对受保护路径的访问，重定向到验证页面</li>
          <li>整个过程不收集任何个人信息，完全匿名</li>
        </ul>
      </div>
    </div>
  );
}

// 主页面组件，使用 Suspense 包裹内部组件
export default function TurnstileDemoPage() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <TurnstileDemoContent />
    </Suspense>
  );
} 