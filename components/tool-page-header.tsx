import type { ReactNode } from "react";
import { getToolByPath, getToolCategoryByPath } from "@/lib/seo";

export function ToolPageHeader({
  path,
  actions,
}: {
  path: string;
  actions?: ReactNode;
}) {
  const tool = getToolByPath(path);
  const category = getToolCategoryByPath(path);

  if (!tool) return null;

  const Icon = category?.icon;

  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground">
              <Icon className="size-6" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {tool.categoryName}
            </p>
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {tool.title}
            </h1>
          </div>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {tool.description}
        </p>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
