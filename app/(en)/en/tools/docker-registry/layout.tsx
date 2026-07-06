import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/docker-registry",
  englishLocale
);

export default function DockerRegistryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/docker-registry" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
