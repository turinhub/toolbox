// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { useMemo } from "react";

import { useStore } from "@/core/store";
import { cn } from "@/lib/utils";

import { ErrorBoundary } from "@/components/deer-flow/error-boundary";
import { NetworkErrorHandler } from "./components/network-error-handler";
import { MessagesBlock } from "./components/messages-block";
import { ResearchBlock } from "./components/research-block";

export default function Main() {
  const openResearchId = useStore((state: any) => state.openResearchId);
  const doubleColumnMode = useMemo(
    () => openResearchId !== null,
    [openResearchId],
  );
  return (
    <ErrorBoundary>
      <NetworkErrorHandler />
      <div
        className={cn(
          "flex h-full w-full justify-center-safe px-4 pb-4",
          doubleColumnMode && "gap-6",
        )}
      >
        <MessagesBlock
          className={cn(
            "shrink-0 transition-all duration-300 ease-out",
            !doubleColumnMode &&
              "w-full max-w-[600px] mx-auto",
            doubleColumnMode && "w-[min(480px,40vw)] max-w-[480px] mx-0",
          )}
        />
        <ResearchBlock
          className={cn(
            "w-[min(600px,55vw)] max-w-[600px] pb-4 transition-all duration-300 ease-out",
            !doubleColumnMode && "scale-0 opacity-0 w-0",
            doubleColumnMode && "scale-100 opacity-100",
          )}
          researchId={openResearchId}
        />
      </div>
    </ErrorBoundary>
  );
}
