import type { Metadata } from "next";
import { Suspense } from "react";
import { StructuredData } from "@/components/structured-data";
import {
  ToolDirectory,
  ToolDirectoryFallback,
} from "@/components/common/tool-directory";
import { buildToolsPageJsonLd, buildToolsPageMetadata } from "@/lib/seo";
import { defaultLocale, type AppLocale } from "@/i18n/config";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = buildToolsPageMetadata();

export default function ToolsPage() {
  return <ToolsPageContent locale={defaultLocale} />;
}

export function ToolsPageContent({ locale }: { locale: AppLocale }) {
  const jsonLd = buildToolsPageJsonLd(locale);
  const messages = getMessages(locale);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {jsonLd.map((data, index) => (
        <StructuredData
          key={index}
          id={`tools-json-ld-${locale}-${index}`}
          data={data as Record<string, unknown>}
        />
      ))}
      <header className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {messages.tools.title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {messages.directory.description}
          </p>
        </div>
      </header>
      <Suspense fallback={<ToolDirectoryFallback locale={locale} />}>
        <ToolDirectory locale={locale} />
      </Suspense>
    </div>
  );
}
