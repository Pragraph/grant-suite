"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Edit3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/document-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PlaceholderEntry {
  marker: string;
  document: string;
  phase: number;
  context: string;
}

interface PlaceholderTrackerProps {
  projectId: string;
  className?: string;
}

export function PlaceholderTracker({
  projectId,
  className,
}: PlaceholderTrackerProps) {
  const { documents } = useDocumentStore();
  const [expanded, setExpanded] = useState(false);

  const { citations, userInputs } = useMemo(() => {
    const citations: PlaceholderEntry[] = [];
    const userInputs: PlaceholderEntry[] = [];

    const relevantDocs = documents.filter(
      (d) =>
        d.projectId === projectId &&
        d.isCurrent &&
        (d.phase >= 3 && d.phase <= 6),
    );

    for (const doc of relevantDocs) {
      if (!doc.content) continue;

      const citRegex = /\[CITATION NEEDED[^\]]*\]/g;
      let match: RegExpExecArray | null;
      while ((match = citRegex.exec(doc.content)) !== null) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(
          doc.content.length,
          match.index + match[0].length + 30,
        );
        citations.push({
          marker: match[0],
          document: doc.canonicalName,
          phase: doc.phase,
          context:
            "..." +
            doc.content.slice(start, end).replace(/\n/g, " ") +
            "...",
        });
      }

      const inputRegex = /\[USER INPUT NEEDED[^\]]*\]/g;
      while ((match = inputRegex.exec(doc.content)) !== null) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(
          doc.content.length,
          match.index + match[0].length + 30,
        );
        userInputs.push({
          marker: match[0],
          document: doc.canonicalName,
          phase: doc.phase,
          context:
            "..." +
            doc.content.slice(start, end).replace(/\n/g, " ") +
            "...",
        });
      }
    }

    return { citations, userInputs };
  }, [documents, projectId]);

  const total = citations.length + userInputs.length;

  if (total === 0) {
    return (
      <Card
        className={cn(
          "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
          className,
        )}
      >
        <CardContent className="p-3 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs">
              ✓
            </span>
          </div>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            All placeholders resolved. Proposal is ready for final review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-amber-200 dark:border-amber-800", className)}>
      <CardContent className="p-4 space-y-3">
        {/* Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium text-foreground">
              {total} Unresolved Placeholder{total !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {citations.length > 0 && (
              <Badge className="text-[10px] bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                {citations.length} citation
                {citations.length !== 1 ? "s" : ""}
              </Badge>
            )}
            {userInputs.length > 0 && (
              <Badge className="text-[10px] bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700">
                {userInputs.length} user input
                {userInputs.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          These markers must be resolved before submission. Use the Citation
          Resolution tool to find references, and manually fill in [USER INPUT
          NEEDED] items.
        </p>

        {/* Expandable detail list */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs w-full justify-between"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Hide details" : "Show all markers"}
          {expanded ? (
            <ChevronUp className="h-3 w-3 ml-1" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1" />
          )}
        </Button>

        {expanded && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {citations.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 text-amber-500" />
                  <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Citations Needed ({citations.length})
                  </p>
                </div>
                {citations.map((c, i) => (
                  <div
                    key={`cit-${i}`}
                    className="rounded border border-amber-100 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30 px-2.5 py-1.5"
                  >
                    <p className="text-[11px] font-mono text-amber-700 dark:text-amber-300">
                      {c.marker}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      in {c.document}
                    </p>
                    <p className="text-[10px] text-muted-foreground italic mt-0.5">
                      {c.context}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {userInputs.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Edit3 className="h-3 w-3 text-blue-500" />
                  <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    User Input Needed ({userInputs.length})
                  </p>
                </div>
                {userInputs.map((u, i) => (
                  <div
                    key={`inp-${i}`}
                    className="rounded border border-blue-100 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 px-2.5 py-1.5"
                  >
                    <p className="text-[11px] font-mono text-blue-700 dark:text-blue-300">
                      {u.marker}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      in {u.document}
                    </p>
                    <p className="text-[10px] text-muted-foreground italic mt-0.5">
                      {u.context}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
