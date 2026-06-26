import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { toolCategories } from "@/lib/routes";
import { RecentTools } from "@/components/common/recent-tools";

export default function Home() {
  const toolCount = toolCategories.reduce(
    (count, category) => count + category.tools.length,
    0
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="toolbox-canvas overflow-hidden rounded-xl border bg-card/80 shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex min-h-[360px] flex-col justify-between border-b bg-background/80 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="rounded-md border bg-background px-2.5 py-1 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Local first
                </span>
                <span className="rounded-md border bg-background px-2.5 py-1 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  No ads
                </span>
              </div>
              <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Turinhub Toolbox
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                常用网页工具的汇集网站。打开、处理、复制结果，把临时任务留在浏览器里完成。
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/tools"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                浏览全部在线工具
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="https://github.com/turinhub/toolbox"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                查看源码
              </a>
            </div>
          </div>

          <div className="grid bg-muted/20">
            <div className="grid grid-cols-2 border-b">
              <div className="border-r p-5">
                <div className="font-mono text-3xl font-semibold tabular-nums">
                  {toolCount}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  个在线工具
                </div>
              </div>
              <div className="p-5">
                <div className="font-mono text-3xl font-semibold tabular-nums">
                  {toolCategories.length}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  个工具分区
                </div>
              </div>
            </div>
            <div className="flex min-h-[220px] flex-col justify-end p-5">
              <div className="mb-4 h-px w-full toolbox-rule" />
              <div className="grid gap-3">
                {toolCategories.slice(0, 4).map((category, index) => (
                  <Link
                    key={category.title}
                    href="/tools"
                    className="group flex items-center justify-between rounded-lg border bg-background/80 px-3 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <category.icon
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium">
                        {category.title}
                      </span>
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground group-hover:text-primary">
                      {category.tools.length}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <RecentTools />

      <section className="w-full">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Tool index
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              按任务类型快速进入
            </h2>
          </div>
          <Link
            href="/tools"
            className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:inline-flex"
          >
            完整目录
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {toolCategories.map((category, categoryIndex) => (
            <Card
              key={category.title}
              className="overflow-hidden shadow-sm transition-colors hover:border-primary/50"
            >
              <CardHeader className="border-b bg-muted/25 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                      <category.icon
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {category.title}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 text-xs leading-5">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    C{String(categoryIndex + 1).padStart(2, "0")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border/50">
                  {category.tools.map(tool => (
                    <li key={tool.name} className="group">
                      <Link
                        href={tool.path}
                        className="flex min-h-[48px] items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="mb-0.5 truncate text-sm font-medium text-foreground group-hover:text-primary">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {tool.description}
                          </p>
                        </div>
                        <span className="ml-3 flex shrink-0 items-center text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                          使用
                          <ArrowRight
                            className="ml-1 h-3.5 w-3.5"
                            aria-hidden="true"
                          />
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

      <section className="border-t py-8">
        <div className="grid gap-4 md:grid-cols-[0.35fr_0.65fr]">
          <h2 className="text-xl font-semibold">关于 Turinhub Toolbox</h2>
          <div>
            <p className="leading-7 text-muted-foreground">
              Turinhub Toolbox
              是一个开源项目，旨在提供简单、高效、无广告的在线工具集合。
              多数工具在浏览器中运行；涉及 AI、S3、FTP 或 API
              测试的工具会使用浏览器网络请求、服务端代理或第三方服务。欢迎您在
              GitHub 上检查项目代码以及本地部署使用。
            </p>
            <a
              href="https://github.com/turinhub/toolbox"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" aria-hidden="true" />在 GitHub
              上查看项目
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
