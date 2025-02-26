import { FileText, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const toolCategories = [
  {
    title: "综合工具",
    description: "常用的文本处理和格式化工具",
    icon: FileText,
    tools: [
      { name: "时间戳转换", description: "获取当前时间戳、时间戳转换", path: "/tools/timestamp" },
      { name: "正则表达式", description: "提供常用正则表达式，并提供在线测试正则表达式", path: "/tools/regex" },
      { name: "JSON 格式化", description: "JSON 数据格式化与验证", path: "/tools/json-formatter" },
      { name: "SQL 格式化", description: "SQL 语句格式化与美化", path: "/tools/sql-formatter" },
    ]
  },
  {
    title: "加密与编码",
    description: "各类加密、哈希和编码转换工具",
    icon: Lock,
    tools: [
      { name: "UUID 生成器", description: "生成 UUID 和各种随机 ID", path: "/tools/uuid" },
      { name: "JWT 编解码", description: "JWT 令牌的编码和解码", path: "/tools/jwt" },
      { name: "URL 编解码", description: "URL 编码和解码转换", path: "/tools/url-codec" },
      { name: "Base64 编解码", description: "Base64 编码和解码转换", path: "/tools/base64" },
    ]
  }
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Turinhub Toolbox</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          常用网页工具的汇集网站，基于 Vercel 和 Cloudflare 提供免费、无广告、无数据存储的常用在线工具箱。
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {toolCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
              <div className="flex items-center gap-2">
                <category.icon className="h-5 w-5" />
                <CardTitle>{category.title}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {category.tools.map((tool) => (
                  <li key={tool.name}>
                    <Link 
                      href={tool.path}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <h3 className="font-medium">{tool.name}</h3>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                      <span className="text-primary">使用 →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8 text-center">
        <p className="text-muted-foreground">
          开源项目 · <a href="https://github.com/turinhub/toolbox" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
      </section>
    </div>
  );
}
