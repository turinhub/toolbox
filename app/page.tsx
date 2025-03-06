import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toolCategories } from "@/lib/routes";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 container mx-auto px-4 py-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">Turinhub Toolbox</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          常用网页工具的汇集网站，基于 Vercel 和 Cloudflare 提供免费、无广告、无数据存储的常用在线工具箱。
        </p>
      </section>

      <section className="max-w-6xl mx-auto w-full">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {toolCategories.map((category) => (
            <Card key={category.title} className="overflow-hidden border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex items-center gap-2">
                  <category.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </div>
                <CardDescription className="mt-2 text-sm">{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border/50">
                  {category.tools.map((tool) => (
                    <li key={tool.name} className="group">
                      <Link 
                        href={tool.path}
                        className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-0.5 text-primary/90">{tool.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                        </div>
                        <span className="text-primary opacity-60 group-hover:opacity-100 flex items-center ml-3 shrink-0">
                          使用
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                            <path d="M5 12h14"></path>
                            <path d="m12 5 7 7-7 7"></path>
                          </svg>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12 text-center">
        <div className="p-6 bg-muted/30 rounded-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">关于 Turinhub Toolbox</h2>
          <p className="text-muted-foreground mb-4">
            Turinhub Toolbox 是一个开源项目，旨在提供简单、高效、无广告的在线工具集合。
            所有工具均在浏览器中运行，后端不会存储您的任何数据。
            欢迎您在 GitHub 上检查项目代码以及本地部署使用。
          </p>
          <a 
            href="https://github.com/turinhub/toolbox" 
            className="inline-flex items-center gap-2 text-primary hover:underline" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
              <path d="M9 18c-4.51 2-5-2-7-2"></path>
            </svg>
            在 GitHub 上查看项目
          </a>
        </div>
      </section>
    </div>
  );
}
