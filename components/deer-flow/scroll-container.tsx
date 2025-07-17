// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import type React from "react";
import { useStickToBottom } from "use-stick-to-bottom";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ScrollContainerProps {
  className?: string;
  children?: ReactNode;
  scrollShadow?: boolean;
  scrollShadowColor?: string;
  autoScrollToBottom?: boolean;
  ref?: RefObject<ScrollContainerRef | null>;
}

export interface ScrollContainerRef {
  scrollToBottom(): void;
  scrollRef?: React.RefObject<HTMLElement>;
}

export function ScrollContainer({
  className,
  children,
  scrollShadow = true,
  scrollShadowColor = "var(--background)",
  autoScrollToBottom = false,
  ref,
}: ScrollContainerProps) {
  const { scrollRef, contentRef, scrollToBottom, isAtBottom } =
    useStickToBottom({ initial: "instant" });
  useImperativeHandle(ref, () => ({
    scrollToBottom() {
      scrollToBottom();
    },
    scrollRef: scrollRef as React.RefObject<HTMLElement>,
  }));

  useEffect(() => {
    if (autoScrollToBottom) {
      // More aggressive auto-scrolling
      scrollToBottom();
      
      // Retry scrolling multiple times to handle content loading
      const retryDelays = [50, 150, 300, 500, 1000];
      const timeouts = retryDelays.map(delay => 
        setTimeout(() => scrollToBottom(), delay)
      );
      
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [autoScrollToBottom, scrollToBottom, children]);

  return (
    <div className={cn("relative", className)}>
      <ScrollArea ref={scrollRef} className="h-full w-full">
        <div className="h-fit w-full" ref={contentRef}>
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
