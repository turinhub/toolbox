import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { buildToolMetadata } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildToolMetadata("/tools/docker-registry");
}

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToolPageSeo path="/tools/docker-registry">{children}</ToolPageSeo>;
}
