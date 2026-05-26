import Link from "next/link";
import { StructuredData } from "@/components/structured-data";
import { buildToolJsonLd, getRelatedTools, getToolByPath } from "@/lib/seo";

export function ToolPageSeo({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  const tool = getToolByPath(path);
  const relatedTools = getRelatedTools(path);
  const jsonLd = buildToolJsonLd(path);

  return (
    <>
      {jsonLd.map((data, index) => (
        <StructuredData key={index} data={data as Record<string, unknown>} />
      ))}
      {children}
      {tool ? (
        <section className="mt-12 border-t pt-8 text-sm text-muted-foreground">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  关于{tool.title}
                </h2>
                <p className="mt-3 leading-7">{tool.longDescription}</p>
              </div>

              {tool.faq && tool.faq.length > 0 ? (
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    常见问题
                  </h2>
                  <div className="mt-3 space-y-4">
                    {tool.faq.map(item => (
                      <div key={item.question}>
                        <h3 className="font-medium text-foreground">
                          {item.question}
                        </h3>
                        <p className="mt-1 leading-7">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {relatedTools.length > 0 ? (
              <aside>
                <h2 className="text-xl font-semibold text-foreground">
                  同类工具
                </h2>
                <div className="mt-3 grid gap-3">
                  {relatedTools.map(relatedTool => (
                    <Link
                      key={relatedTool.path}
                      href={relatedTool.path}
                      className="rounded-md border p-3 transition-colors hover:border-primary/50 hover:bg-muted/40"
                    >
                      <span className="block font-medium text-foreground">
                        {relatedTool.name}
                      </span>
                      <span className="mt-1 block leading-6">
                        {relatedTool.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </aside>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
