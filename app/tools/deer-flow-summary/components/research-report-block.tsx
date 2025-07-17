// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useCallback, useEffect, useRef } from "react";

import { LoadingAnimation } from "@/components/deer-flow/loading-animation";
import { Markdown } from "@/components/deer-flow/markdown";
import ReportEditor from "@/components/deer-flow/editor";
import { useReplay } from "@/core/replay";
import { useMessage, useStore } from "@/core/store";
import { cn } from "@/lib/utils";

export function ResearchReportBlock({
  className,
  messageId,
  editing,
}: {
  className?: string;
  researchId: string;
  messageId: string;
  editing: boolean;
}) {
  const message = useMessage(messageId);
  const { isReplay } = useReplay();
  const handleMarkdownChange = useCallback(
    (markdown: string) => {
      if (message) {
        message.content = markdown;
        useStore.setState({
          messages: new Map(useStore.getState().messages).set(
            message.id,
            message,
          ),
        });
      }
    },
    [message],
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const isCompleted = message?.isStreaming === false;
  
  // Auto-scroll to bottom during streaming and content updates
  useEffect(() => {
    if (message) {
      const scrollToBottom = (force = false) => {
        const scrollContainers = document.querySelectorAll('[data-research-scroll-container] [data-radix-scroll-area-viewport]');
        scrollContainers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.scrollTop = container.scrollHeight;
          }
        });
      };

      // Use MutationObserver for detecting content changes
      let mutationObserver: MutationObserver | null = null;
      
      if (typeof window !== 'undefined') {
        mutationObserver = new MutationObserver(() => {
          scrollToBottom(true);
        });
        
        const scrollContainers = document.querySelectorAll('[data-research-scroll-container] [data-radix-scroll-area-viewport]');
        scrollContainers.forEach(container => {
          if (container) {
            mutationObserver?.observe(container, {
              childList: true,
              subtree: true,
              characterData: true,
            });
          }
        });
      }

      // Aggressive scrolling for streaming content
      const aggressiveScroll = () => {
        scrollToBottom();
        
        // Multiple retries for content loading
        const retries = [0, 50, 100, 200, 300, 500, 800];
        retries.forEach(delay => {
          setTimeout(() => scrollToBottom(true), delay);
        });
      };

      // Execute scrolling
      aggressiveScroll();
      
      // Continuous scroll during streaming for live content updates
      let streamingInterval: NodeJS.Timeout | null = null;
      if (message.isStreaming || message.content?.length > 100) {
        streamingInterval = setInterval(() => scrollToBottom(true), 250);
      }
      
      return () => {
        if (mutationObserver) {
          mutationObserver.disconnect();
        }
        if (streamingInterval) {
          clearInterval(streamingInterval);
        }
      };
    }
  }, [message?.isStreaming, message?.content, message?.id]);

  return (
    <div ref={contentRef} className={cn("w-full pt-4 pb-4 px-2", className)}>
      {!isReplay && isCompleted && editing ? (
        <ReportEditor
          content={message?.content || ""}
          onMarkdownChange={handleMarkdownChange}
        />
      ) : (
        <>
          <Markdown animated checkLinkCredibility>
            {message?.content}
          </Markdown>
          {message?.isStreaming && <LoadingAnimation className="my-8" />}
        </>
      )}
    </div>
  );
}
