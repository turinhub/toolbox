import Link from "next/link";
import { Github, Search } from "lucide-react";
import { getToolCategories } from "@/lib/routes";
import { RecentTools } from "@/components/common/recent-tools";
import { ToolDirectoryList } from "@/components/common/tool-directory-list";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { defaultLocale, localizePath, type AppLocale } from "@/i18n/config";
import { getMessages } from "@/lib/messages";
import { StructuredData } from "@/components/structured-data";
import { buildHomeJsonLd } from "@/lib/seo";

export default function Home() {
  return <HomePage locale={defaultLocale} />;
}

export function HomePage({ locale }: { locale: AppLocale }) {
  const toolCategories = getToolCategories(locale);
  const messages = getMessages(locale);
  const homeJsonLd = buildHomeJsonLd(locale);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {homeJsonLd.map((data, index) => (
        <StructuredData
          key={index}
          id={`home-json-ld-${locale}-${index}`}
          data={data}
        />
      ))}
      <header className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1
            className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl"
            translate="no"
          >
            Turinhub Toolbox
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {messages.home.description}
          </p>
        </div>
        <Link
          href={localizePath("/tools", locale)}
          className="inline-flex min-h-11 shrink-0 items-center self-start rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {messages.home.browseAll}
        </Link>
      </header>
      <form
        action={localizePath("/tools", locale)}
        method="get"
        role="search"
        className="mb-6 space-y-2"
      >
        <Label htmlFor="home-search">{messages.directory.searchLabel}</Label>
        <div className="flex gap-2">
          <Input
            id="home-search"
            name="q"
            type="search"
            placeholder={messages.directory.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            className="h-11 min-w-0 flex-1"
          />
          <Button type="submit" className="h-11 shrink-0 gap-2">
            <Search className="size-4" aria-hidden="true" />
            {messages.directory.searchButton}
          </Button>
        </div>
      </form>
      <RecentTools />
      <ToolDirectoryList
        categories={toolCategories}
        locale={locale}
        linkCategories
      />
      <section className="mt-8 border-t py-6">
        <h2 className="text-base font-semibold">{messages.home.aboutTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {messages.home.aboutDescription}
        </p>
        <a
          href="https://github.com/turinhub/toolbox"
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="size-4" aria-hidden="true" />
          {messages.home.viewOnGithub}
        </a>
      </section>
    </div>
  );
}
