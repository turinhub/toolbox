"use client";

import React, { useRef, useImperativeHandle, forwardRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeUnwrapImages from "rehype-unwrap-images";
import { Theme, MarkdownConfig } from "../types";

interface WeChatPreviewProps {
  content: string;
  theme: Theme;
  config: MarkdownConfig;
}

export interface WeChatPreviewHandle {
  copyToClipboard: () => Promise<void>;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  isBlock?: boolean;
}

export const WeChatPreview = forwardRef<
  WeChatPreviewHandle,
  WeChatPreviewProps
>(({ content, theme, config }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 提取外链
  const links = useMemo(() => {
    if (!config.wechatLink) return [];
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    const foundLinks: { text: string; href: string }[] = [];
    let match;
    const uniqueUrls = new Set<string>();

    while ((match = linkRegex.exec(content)) !== null) {
      const text = match[1];
      const href = match[2];
      if (!uniqueUrls.has(href)) {
        uniqueUrls.add(href);
        foundLinks.push({ text, href });
      }
    }
    return foundLinks;
  }, [content, config.wechatLink]);

  useImperativeHandle(ref, () => ({
    copyToClipboard: async () => {
      if (!containerRef.current) return;

      const range = document.createRange();
      range.selectNode(containerRef.current);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      try {
        document.execCommand("copy");
        if (selection) {
          selection.removeAllRanges();
        }
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    },
  }));

  return (
    <div
      id="wechat-preview-container"
      ref={containerRef}
      style={{
        ...theme.styles.container,
        overflowY: "auto",
        height: "100%",
        padding: "20px",
        backgroundColor: theme.styles.container?.backgroundColor || "#fff",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeUnwrapImages]}
        components={{
          h1: ({ node, ...props }) => <h1 style={theme.styles.h1} {...props} />,
          h2: ({ node, ...props }) => <h2 style={theme.styles.h2} {...props} />,
          h3: ({ node, ...props }) => <h3 style={theme.styles.h3} {...props} />,
          h4: ({ node, ...props }) => <h4 style={theme.styles.h4} {...props} />,
          h5: ({ node, ...props }) => <h5 style={theme.styles.h5} {...props} />,
          h6: ({ node, ...props }) => <h6 style={theme.styles.h6} {...props} />,
          p: ({ node, ...props }) => <p style={theme.styles.p} {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote style={theme.styles.blockquote} {...props} />
          ),
          ul: ({ node, ...props }) => <ul style={theme.styles.ul} {...props} />,
          ol: ({ node, ...props }) => <ol style={theme.styles.ol} {...props} />,
          li: ({ node, ...props }) => <li style={theme.styles.li} {...props} />,
          a: ({ node, ...props }) => {
            if (config.wechatLink) {
              const href = props.href || "";
              const index = links.findIndex(l => l.href === href);
              if (index !== -1) {
                return (
                  <span style={{ color: theme.styles.a?.color || "#1e80ff" }}>
                    {props.children}
                    <sup style={{ marginLeft: "2px" }}>[{index + 1}]</sup>
                  </span>
                );
              }
            }
            return <a style={theme.styles.a} {...props} />;
          },
          strong: ({ node, ...props }) => (
            <strong style={theme.styles.strong} {...props} />
          ),
          em: ({ node, ...props }) => <em style={theme.styles.em} {...props} />,
          img: ({ node, ...props }) => {
            const alt = props.alt || "";
            const title = props.title || "";

            let caption = "";
            if (config.figcaptionType === "title" && title) {
              caption = title;
            } else if (config.figcaptionType === "alt" && alt) {
              caption = alt;
            } else if (config.figcaptionType === "title_only" && title) {
              caption = title;
            } else if (config.figcaptionType === "alt_only" && alt) {
              caption = alt;
            } else if (config.figcaptionType === "title" && !title && alt) {
              caption = alt;
            } else if (config.figcaptionType === "alt" && !alt && title) {
              caption = title;
            }

            if (config.figcaptionType !== "none" && caption) {
              return (
                <figure style={theme.styles.figure}>
                  <img style={theme.styles.img} {...props} />
                  <figcaption style={theme.styles.figcaption}>
                    {caption}
                  </figcaption>
                </figure>
              );
            }

            return <img style={theme.styles.img} {...props} />;
          },
          hr: ({ node, ...props }) => <hr style={theme.styles.hr} {...props} />,
          table: ({ node, ...props }) => (
            <table style={theme.styles.table} {...props} />
          ),
          th: ({ node, ...props }) => <th style={theme.styles.th} {...props} />,
          td: ({ node, ...props }) => <td style={theme.styles.td} {...props} />,
          pre: ({ children, style, ...props }) => (
            <pre style={{ ...theme.styles.pre, ...style }} {...props}>
              {config.macCodeBlock && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "15px",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: "#ff5f56",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: "#ffbd2e",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: "#27c93f",
                      display: "inline-block",
                    }}
                  />
                </div>
              )}
              {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                  // @ts-ignore
                  return React.cloneElement(child, { isBlock: true });
                }
                return child;
              })}
            </pre>
          ),
          code: ({
            isBlock,
            style,
            className,
            children,
            ...props
          }: CodeProps) => {
            if (isBlock) {
              const codeContent = String(children).replace(/\n$/, "");
              if (config.codeLineNumber) {
                const lines = codeContent.split("\n");
                return (
                  <div
                    style={{ display: "flex", fontFamily: "inherit", ...style }}
                    className={className}
                    {...props}
                  >
                    <div
                      style={{
                        textAlign: "right",
                        paddingRight: "1em",
                        userSelect: "none",
                        opacity: 0.5,
                        borderRight: "1px solid",
                        marginRight: "1em",
                        minWidth: "2em",
                      }}
                    >
                      {lines.map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <div style={{ flex: 1, overflowX: "auto" }}>
                      {codeContent}
                    </div>
                  </div>
                );
              }
              return (
                <code
                  style={{ fontFamily: "inherit", ...style }}
                  className={className}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                style={{ ...theme.styles.code, ...style }}
                className={className}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {config.wechatLink && links.length > 0 && (
        <div
          style={{
            marginTop: "2em",
            paddingTop: "1em",
            borderTop: "1px solid #eee",
          }}
        >
          <h4
            style={{
              fontSize: "1em",
              fontWeight: "bold",
              marginBottom: "0.5em",
            }}
          >
            引用链接
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {links.map((link, index) => (
              <li
                key={index}
                style={{
                  fontSize: "0.9em",
                  color: "#666",
                  marginBottom: "0.3em",
                }}
              >
                [{index + 1}] {link.text}:{" "}
                <span style={{ wordBreak: "break-all" }}>{link.href}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

WeChatPreview.displayName = "WeChatPreview";
