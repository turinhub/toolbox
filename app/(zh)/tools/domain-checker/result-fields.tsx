"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ResultFields({
  fields,
}: {
  fields: { label: string; value?: string; mono?: boolean }[];
}) {
  const t = useTranslations("domainChecker");
  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("copied", { label }));
    } catch {
      toast.error(t("copyFailed"));
    }
  };
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {fields.map(({ label, value, mono }) => (
        <div key={label} className="min-w-0 space-y-1">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="flex min-w-0 items-start gap-2">
            <span
              className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 ${mono ? "font-mono" : ""}`}
            >
              {value || t("notProvided")}
            </span>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                aria-label={t("copyValue", { label })}
                onClick={() => void copyValue(label, value)}
              >
                <Copy className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
