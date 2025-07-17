// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  autoScrollToBottom?: boolean;
  scrollShadow?: boolean;
  scrollShadowColor?: string;
}

export interface ScrollContainerRef {
  scrollToBottom: () => void;
  scrollToTop: () => void;
}

export function ScrollContainer({
  children,
  className,
  autoScrollToBottom = false,
  scrollShadow = true,
  scrollShadowColor = "var(--background)",
}: ScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (autoScrollToBottom && containerRef.current) {
      scrollToBottom();
    }
  }, [children, autoScrollToBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowTopShadow(scrollTop > 0);
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [children]);

  return (
    <div className="relative">
      {scrollShadow && showTopShadow && (
        <div
          className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
          style={{
            background: `linear-gradient(to bottom, ${scrollShadowColor} 0%, transparent 100%)`,
          }}
        />
      )}
      <div
        ref={containerRef}
        className={cn("overflow-y-auto scrollbar-thin", className)}
      >
        {children}
      </div>
      {scrollShadow && showBottomShadow && (
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10"
          style={{
            background: `linear-gradient(to top, ${scrollShadowColor} 0%, transparent 100%)`,
          }}
        />
      )}
    </div>
  );
}