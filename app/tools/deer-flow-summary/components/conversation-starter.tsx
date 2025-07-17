// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Welcome } from "./welcome";

export function ConversationStarter({
  className,
  onSend,
}: {
  className?: string;
  onSend?: (message: string) => void;
}) {
  const t = useTranslations("chat");
  const questions = t.raw("conversationStarters") as string[];

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="mb-8">
        <Welcome />
      </div>
      <ul className="grid w-full max-w-2xl grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:gap-4">
        {questions.map((question, index) => (
          <motion.li
            key={question}
            className="flex w-full p-1 active:scale-95"
            style={{ transition: "all 0.2s ease-out" }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1 + 0.3,
              ease: "easeOut",
            }}
          >
            <div
              className="bg-card text-muted-foreground h-full w-full cursor-pointer rounded-xl border px-3 py-2 text-sm opacity-80 transition-all duration-200 hover:scale-[1.02] hover:opacity-100 hover:shadow-lg focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand sm:px-4 sm:py-3 sm:text-base"
              onClick={() => {
                onSend?.(question);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSend?.(question);
                }
              }}
            >
              {question}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
