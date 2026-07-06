"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, type ReactNode } from "react";
import type { AppLocale } from "@/i18n/config";
import type { AppMessages } from "@/lib/messages";

export function IntlProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: AppMessages;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Shanghai"
    >
      {children}
    </NextIntlClientProvider>
  );
}
