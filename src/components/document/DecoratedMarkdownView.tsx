"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import {
  PLACEHOLDER_TAG_REGEX,
  type TagInstance,
  type TagType,
} from "@/lib/placeholders";

const TAG_PILL_COLORS: Record<TagType, string> = {
  "CITATION NEEDED":
    "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300",
  "USER INPUT NEEDED":
    "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300",
  VERIFY:
    "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
  ESTIMATED:
    "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300",
  "CHECK DATE":
    "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300",
};

interface DecoratedMarkdownViewProps {
  content: string;
  tagInstances: TagInstance[];
  resolutions: Record<string, string>;
  confirmed: Set<string>;
  skipped: Set<string>;
  activeTagId: string | null;
  onTagClick: (tagId: string) => void;
}

interface DecorateContext {
  tagInstances: TagInstance[];
  counterRef: { current: number };
  resolutions: Record<string, string>;
  confirmed: Set<string>;
  skipped: Set<string>;
  activeTagId: string | null;
  onTagClick: (tagId: string) => void;
}

function decorateText(text: string, ctx: DecorateContext): React.ReactNode[] {
  const re = new RegExp(PLACEHOLDER_TAG_REGEX.source, "g");
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(
        <React.Fragment key={`t-${key++}`}>
          {text.slice(lastIndex, match.index)}
        </React.Fragment>,
      );
    }

    const tag = ctx.tagInstances[ctx.counterRef.current++];
    if (!tag) {
      // Mismatch — fall back to plain text
      segments.push(
        <React.Fragment key={`t-${key++}`}>{match[0]}</React.Fragment>,
      );
    } else {
      const isResolved = ctx.resolutions[tag.id] !== undefined;
      const isConfirmed = ctx.confirmed.has(tag.id);
      const isSkipped = ctx.skipped.has(tag.id);
      const isActive = ctx.activeTagId === tag.id;

      if (isConfirmed) {
        // Marker would be removed on save — render nothing visible.
        // Keep an invisible anchor so scrollIntoView still has a target.
        segments.push(
          <span
            key={`t-${key++}`}
            id={`tag-pill-${tag.id}`}
            className="sr-only"
            aria-hidden="true"
          />,
        );
      } else if (isResolved) {
        const replacement = ctx.resolutions[tag.id];
        segments.push(
          <button
            key={`t-${key++}`}
            type="button"
            id={`tag-pill-${tag.id}`}
            onClick={(e) => {
              e.preventDefault();
              ctx.onTagClick(tag.id);
            }}
            className={cn(
              "inline rounded border px-1 py-0 text-inherit transition-all",
              "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
              isActive && "ring-2 ring-[#4F7DF3]/60",
            )}
          >
            {replacement}
          </button>,
        );
      } else {
        segments.push(
          <button
            key={`t-${key++}`}
            type="button"
            id={`tag-pill-${tag.id}`}
            onClick={(e) => {
              e.preventDefault();
              ctx.onTagClick(tag.id);
            }}
            className={cn(
              "inline rounded border px-1 py-0 font-mono text-[11px] font-medium transition-all",
              TAG_PILL_COLORS[tag.type],
              isSkipped && "opacity-50",
              isActive && "ring-2 ring-[#4F7DF3]/60",
            )}
          >
            {match[0]}
          </button>,
        );
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push(
      <React.Fragment key={`t-${key++}`}>
        {text.slice(lastIndex)}
      </React.Fragment>,
    );
  }

  return segments;
}

function decorateChildren(
  children: React.ReactNode,
  ctx: DecorateContext,
): React.ReactNode {
  if (typeof children === "string") {
    return <>{decorateText(children, ctx)}</>;
  }
  if (Array.isArray(children)) {
    return (
      <>
        {children.map((child, i) =>
          typeof child === "string" ? (
            <React.Fragment key={i}>{decorateText(child, ctx)}</React.Fragment>
          ) : (
            <React.Fragment key={i}>{child}</React.Fragment>
          ),
        )}
      </>
    );
  }
  return <>{children}</>;
}

export function DecoratedMarkdownView({
  content,
  tagInstances,
  resolutions,
  confirmed,
  skipped,
  activeTagId,
  onTagClick,
}: DecoratedMarkdownViewProps) {
  // Counter resets each render so decoration order matches tagInstances order.
  const counterRef = { current: 0 };
  const ctx: DecorateContext = {
    tagInstances,
    counterRef,
    resolutions,
    confirmed,
    skipped,
    activeTagId,
    onTagClick,
  };

  const wrap = (children: React.ReactNode) => decorateChildren(children, ctx);

  return (
    <div
      className={cn(
        "prose prose-sm prose-gray max-w-none",
        "prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-xl prose-h1:border-b prose-h1:border-border/50 prose-h1:pb-2 prose-h1:mb-4",
        "prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3",
        "prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2",
        "prose-p:text-muted-foreground prose-p:leading-relaxed",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-muted-foreground/90",
        "prose-a:text-accent-400 prose-a:no-underline hover:prose-a:underline",
        "prose-li:text-muted-foreground prose-li:marker:text-muted-foreground/50",
        "prose-ul:my-2 prose-ol:my-2",
        "prose-code:text-[#4F7DF3] prose-code:bg-gray-50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg",
        "prose-table:border-collapse",
        "prose-th:border prose-th:border-border/50 prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-medium prose-th:text-foreground",
        "prose-td:border prose-td:border-border/50 prose-td:px-3 prose-td:py-2 prose-td:text-sm prose-td:text-muted-foreground",
        "prose-blockquote:border-l-accent-500 prose-blockquote:text-muted-foreground/80 prose-blockquote:not-italic",
        "prose-hr:border-border/50",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{wrap(children)}</p>,
          li: ({ children }) => <li>{wrap(children)}</li>,
          td: ({ children }) => <td>{wrap(children)}</td>,
          th: ({ children }) => <th>{wrap(children)}</th>,
          h1: ({ children }) => <h1>{wrap(children)}</h1>,
          h2: ({ children }) => <h2>{wrap(children)}</h2>,
          h3: ({ children }) => <h3>{wrap(children)}</h3>,
          h4: ({ children }) => <h4>{wrap(children)}</h4>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
