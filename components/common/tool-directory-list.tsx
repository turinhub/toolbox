import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ToolCategory } from "@/lib/routes";
import { localizePath, type AppLocale } from "@/i18n/config";

export function ToolDirectoryList({
  categories,
  locale,
  linkCategories = false,
}: {
  categories: ToolCategory[];
  locale: AppLocale;
  linkCategories?: boolean;
}) {
  return (
    <div
      className="grid items-start gap-6 lg:grid-cols-2"
      data-testid="tool-directory-list"
    >
      {categories.map(category => (
        <section
          key={category.id}
          aria-labelledby={`category-${category.id}`}
          className="min-w-0"
        >
          <h2
            id={`category-${category.id}`}
            className="mb-3 flex items-center gap-2 text-base font-semibold"
          >
            <category.icon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            {linkCategories ? (
              <Link
                href={`${localizePath("/tools", locale)}?category=${category.id}`}
                className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {category.title}
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </Link>
            ) : (
              category.title
            )}
          </h2>
          <ul className="divide-y rounded-lg border bg-card">
            {category.tools.map(tool => (
              <li key={tool.path} className="min-w-0">
                <Link
                  href={localizePath(tool.path, locale)}
                  className="group flex min-h-16 items-center gap-3 rounded-md p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-medium group-hover:text-primary">
                      {tool.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
