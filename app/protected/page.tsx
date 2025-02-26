export default function ProtectedPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">受保护的页面</h1>
      
      <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">访问成功</h2>
        <p className="mb-4">
          恭喜！您已成功通过人机验证并访问到此受保护页面。
        </p>
        <p className="text-muted-foreground">
          这个页面受到 Cloudflare Turnstile 保护，只有通过人机验证的用户才能访问。
          验证状态通过 HTTP-only cookie 存储，有效期为 1 小时。
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-3">安全特性</h3>
          <ul className="list-disc pl-5 space-y-2 text-green-700 dark:text-green-400">
            <li>使用 HTTP-only cookie 防止 XSS 攻击</li>
            <li>验证状态有时效性，过期后需重新验证</li>
            <li>不收集任何个人信息，保护用户隐私</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-3">实现方式</h3>
          <ul className="list-disc pl-5 space-y-2 text-blue-700 dark:text-blue-400">
            <li>使用 Next.js 中间件拦截受保护路径</li>
            <li>验证 cookie 状态决定是否允许访问</li>
            <li>未验证用户自动重定向到验证页面</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 