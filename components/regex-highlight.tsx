import type { ReactNode } from "react";
import type { RegexMatchRange } from "@/lib/regex/runner";

interface RegexHighlightProps {
  text: string;
  matches: RegexMatchRange[];
  emptyMatchLabel: (position: number) => string;
}

export function RegexHighlight({
  text,
  matches,
  emptyMatchLabel,
}: RegexHighlightProps) {
  const content: ReactNode[] = [];
  let cursor = 0;

  for (const [index, match] of matches.entries()) {
    content.push(text.slice(cursor, match.start));
    const isEmpty = match.start === match.end;
    content.push(
      <mark
        key={`${index}-${match.start}-${match.end}`}
        data-match-start={match.start}
        data-match-end={match.end}
        className={
          isEmpty
            ? "inline-block h-4 border-l-2 border-primary align-text-bottom"
            : "rounded-sm bg-primary/20 text-foreground"
        }
        aria-label={isEmpty ? emptyMatchLabel(match.start) : undefined}
        title={isEmpty ? emptyMatchLabel(match.start) : undefined}
      >
        {text.slice(match.start, match.end)}
      </mark>
    );
    cursor = match.end;
  }
  content.push(text.slice(cursor));

  return (
    <div
      data-testid="regex-highlight"
      className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-4 font-mono text-sm"
    >
      {content}
    </div>
  );
}
