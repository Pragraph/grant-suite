"use client";

import React, { useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MarkdownEditorProps {
  content: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  className?: string;
  placeholder?: string;
  minHeight?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MarkdownEditor({
  content,
  onChange,
  readOnly = false,
  showToolbar = true,
  className,
  placeholder = "Write markdown here...",
  minHeight = "300px",
}: MarkdownEditorProps) {
  const wordCount = useMemo(() => {
    if (!content) return 0;
    return content
      .replace(/[#*`>\-|=]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }, [content]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab inserts 2 spaces instead of moving focus
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const value = target.value;
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        onChange?.(newValue);
        // Restore cursor position after React re-renders
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });
      }
    },
    [onChange]
  );

  if (readOnly) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div
          className="overflow-auto rounded-lg border border-gray-200 bg-white p-6"
          style={{ minHeight }}
        >
          <MarkdownRenderer content={content} />
        </div>
        <div className="mt-2 flex justify-end text-xs text-muted-foreground">
          {wordCount.toLocaleString()} words
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {showToolbar ? (
        <Tabs defaultValue="edit" className="w-full">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <textarea
              value={content}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-4",
                "font-mono text-sm text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-2 focus:ring-offset-white",
                "transition-colors duration-fast"
              )}
              style={{ minHeight }}
            />
          </TabsContent>

          <TabsContent value="preview">
            <div
              className="overflow-auto rounded-lg border border-gray-200 bg-white p-6"
              style={{ minHeight }}
            >
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">
                  Nothing to preview
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <textarea
          value={content}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-4",
            "font-mono text-sm text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-2 focus:ring-offset-white",
            "transition-colors duration-fast"
          )}
          style={{ minHeight }}
        />
      )}

      <div className="mt-2 flex justify-end text-xs text-muted-foreground">
        {wordCount.toLocaleString()} words
      </div>
    </div>
  );
}
