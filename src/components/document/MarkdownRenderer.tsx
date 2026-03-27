"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// ─── Marker Highlighting ────────────────────────────────────────────────────

const CITATION_RE = /\[CITATION NEEDED\]/g;
const USER_INPUT_RE = /\[USER INPUT NEEDED\]/g;
const EP_TAG_RE = /\b(EP-\d{2})\b/g;

function highlightMarkers(text: string): React.ReactNode[] {
  // Split by all marker patterns, preserving delimiters
  const combined = /(\[CITATION NEEDED\]|\[USER INPUT NEEDED\]|\bEP-\d{2}\b)/g;
  const parts = text.split(combined);

  return parts.map((part, i) => {
    if (CITATION_RE.test(part)) {
      CITATION_RE.lastIndex = 0;
      return (
        <mark
          key={i}
          className="rounded px-1.5 py-0.5 bg-warning/20 text-warning font-medium"
        >
          {part}
        </mark>
      );
    }
    if (USER_INPUT_RE.test(part)) {
      USER_INPUT_RE.lastIndex = 0;
      return (
        <mark
          key={i}
          className="rounded px-1.5 py-0.5 bg-error/20 text-error font-medium"
        >
          {part}
        </mark>
      );
    }
    if (EP_TAG_RE.test(part)) {
      EP_TAG_RE.lastIndex = 0;
      return (
        <span
          key={i}
          className="rounded px-1.5 py-0.5 bg-accent-500/15 text-accent-400 font-mono text-xs font-medium"
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

// ─── Custom renderers that highlight markers in text nodes ───────────────────

function TextWithMarkers({ children }: { children: React.ReactNode }) {
  if (typeof children === "string") {
    return <>{highlightMarkers(children)}</>;
  }
  if (Array.isArray(children)) {
    return (
      <>
        {children.map((child, i) =>
          typeof child === "string" ? (
            <React.Fragment key={i}>{highlightMarkers(child)}</React.Fragment>
          ) : (
            <React.Fragment key={i}>{child}</React.Fragment>
          )
        )}
      </>
    );
  }
  return <>{children}</>;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-sm prose-gray max-w-none",
        // Headings
        "prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-xl prose-h1:border-b prose-h1:border-border/50 prose-h1:pb-2 prose-h1:mb-4",
        "prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3",
        "prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2",
        // Body text
        "prose-p:text-muted-foreground prose-p:leading-relaxed",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-muted-foreground/90",
        // Links
        "prose-a:text-accent-400 prose-a:no-underline hover:prose-a:underline",
        // Lists
        "prose-li:text-muted-foreground prose-li:marker:text-muted-foreground/50",
        "prose-ul:my-2 prose-ol:my-2",
        // Code
        "prose-code:text-[#4F7DF3] prose-code:bg-gray-50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg",
        // Tables
        "prose-table:border-collapse",
        "prose-th:border prose-th:border-border/50 prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-medium prose-th:text-foreground",
        "prose-td:border prose-td:border-border/50 prose-td:px-3 prose-td:py-2 prose-td:text-sm prose-td:text-muted-foreground",
        // Blockquotes
        "prose-blockquote:border-l-accent-500 prose-blockquote:text-muted-foreground/80 prose-blockquote:not-italic",
        // HR
        "prose-hr:border-border/50",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p>
              <TextWithMarkers>{children}</TextWithMarkers>
            </p>
          ),
          li: ({ children }) => (
            <li>
              <TextWithMarkers>{children}</TextWithMarkers>
            </li>
          ),
          td: ({ children }) => (
            <td>
              <TextWithMarkers>{children}</TextWithMarkers>
            </td>
          ),
          th: ({ children }) => (
            <th>
              <TextWithMarkers>{children}</TextWithMarkers>
            </th>
          ),
          h1: ({ children }) => (
            <h1>
              <TextWithMarkers>{children}</TextWithMarkers>
            </h1>
          ),
          h2: ({ children }) => (
            <h2>
              <TextWithMarkers>{children}</TextWithMarkers>
            </h2>
          ),
          h3: ({ children }) => (
            <h3>
              <TextWithMarkers>{children}</TextWithMarkers>
            </h3>
          ),
          h4: ({ children }) => (
            <h4>
              <TextWithMarkers>{children}</TextWithMarkers>
            </h4>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
