import type { Metadata } from "next";
import Link from "next/link";
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {jsonLd.map((data, index) => (
        <StructuredData key={index} data={data as Record<string, unknown>} />
      ))}

      <section className="space-y-3">
        <h1 className="text-3xl font-bold">在线工具大全</h1>
        <p className="max-w-3xl text-muted-foreground leading-7">
          Turinhub Toolbox
          汇集免费、无广告、尽量本地处理的在线工具，覆盖开发调试、文本处理、图像设计、网络检测、AI
          辅助和常用计算场景。
        </p>
      </section>

      <section className="grid gap-6">
        {toolCategories.map(category => (
          <Card key={category.title} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <category.icon className="h-5 w-5 text-primary" />
                <CardTitle>{category.title}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {category.tools.map(tool => (
                  <Link
                    key={tool.path}
                    href={tool.path}
                    className="rounded-md border p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
                  >
                    <h2 className="font-semibold text-foreground">
                      {tool.name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {tool.description}
                    </p>
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
