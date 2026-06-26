import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StructuredData } from "@/components/structured-data";
import { buildToolsPageJsonLd, buildToolsPageMetadata } from "@/lib/seo";
import { toolCategories } from "@/lib/routes";

export const metadata: Metadata = buildToolsPageMetadata();

export default function ToolsPage() {
  const jsonLd = buildToolsPageJsonLd();
  const toolCount = toolCategories.reduce(
    (count, category) => count + category.tools.length,
    0
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {jsonLd.map((data, index) => (
        <StructuredData
          key={index}
          id={`tools-json-ld-${index}`}
          data={data as Record<string, unknown>}
        />
      ))}

      <section className="toolbox-canvas overflow-hidden rounded-xl border bg-card/80">
        <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
          <div className="border-b bg-background/80 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Tool directory
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              在线工具大全
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              Turinhub Toolbox
              汇集免费、无广告、尽量本地处理的在线工具，覆盖开发调试、文本处理、图像设计、网络检测、AI
              辅助和常用计算场景。
            </p>
          </div>
          <div className="grid grid-cols-2 bg-muted/20 lg:grid-cols-1">
            <div className="border-r p-5 lg:border-b lg:border-r-0">
              <div className="font-mono text-3xl font-semibold tabular-nums">
                {toolCount}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">个工具</div>
            </div>
            <div className="p-5">
              <div className="font-mono text-3xl font-semibold tabular-nums">
                {toolCategories.length}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">个分类</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {toolCategories.map((category, categoryIndex) => (
          <Card key={category.title} className="overflow-hidden shadow-sm">
            <CardHeader className="border-b bg-muted/25">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                    <category.icon
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">
                        {category.title}
                      </CardTitle>
                      <span className="rounded-md border bg-background px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                        {category.tools.length} tools
                      </span>
                    </div>
                    <CardDescription className="mt-2 leading-6">
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  C{String(categoryIndex + 1).padStart(2, "0")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                {category.tools.map(tool => (
                  <Link
                    key={tool.path}
                    href={tool.path}
                    className="group flex min-h-[124px] flex-col justify-between rounded-lg border bg-background p-4 transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-foreground group-hover:text-primary">
                        {tool.name}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                      打开工具
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
