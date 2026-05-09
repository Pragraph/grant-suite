"use client";

import { useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import {
  preprocessPlaceholdersForMarkdown,
  type TagInstance,
} from "@/lib/placeholders";
import "@/styles/placeholder-pills.css";

interface DecoratedMarkdownViewProps {
  content: string;
  // Kept for backward-compat with the StepExecutor parent contract; the
  // preprocess function re-derives instances from `content`.
  tagInstances?: TagInstance[];
  resolutions: Record<string, string>;
  confirmed: Set<string>;
  // Skipped tags render with the same styling as pending tags. The set is
  // accepted for parent compatibility but not used here directly.
  skipped?: Set<string>;
  activeTagId: string | null;
  onTagClick: (tagId: string) => void;
}

export function DecoratedMarkdownView({
  content,
  resolutions,
  confirmed,
  activeTagId,
  onTagClick,
}: DecoratedMarkdownViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const processed = useMemo(
    () => preprocessPlaceholdersForMarkdown(content, resolutions, confirmed),
    [content, resolutions, confirmed],
  );

  // Container-level click delegation.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const pill = target?.closest<HTMLElement>("[data-tag-id]");
      if (pill && pill.dataset.tagId) {
        e.preventDefault();
        onTagClick(pill.dataset.tagId);
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [onTagClick]);

  // Mark resolved pills (rendered text-only, no span) and active pill.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container
      .querySelectorAll<HTMLElement>("[data-tag-id][data-active='true']")
      .forEach((el) => el.removeAttribute("data-active"));

    if (activeTagId) {
      // Escape quotes in the selector value.
      const safe = activeTagId.replace(/"/g, '\\"');
      const el = container.querySelector<HTMLElement>(
        `[data-tag-id="${safe}"]`,
      );
      if (el) {
        el.setAttribute("data-active", "true");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeTagId, processed]);

  return (
    <div
      ref={containerRef}
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
        rehypePlugins={[rehypeRaw]}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
