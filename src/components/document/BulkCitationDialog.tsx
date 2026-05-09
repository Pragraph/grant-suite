"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseCitationList } from "@/lib/citation-parser";
import type { TagInstance } from "@/lib/placeholders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BulkCitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Pending CITATION NEEDED tags in document order. Distribution maps the
  // i-th parsed reference to the i-th slot.
  citationSlots: TagInstance[];
  onApply: (assignments: Record<string, string>) => void;
}

interface SlotAssignment {
  slotId: string;
  citation: string | null;
}

type Stage = "paste" | "review";

export function BulkCitationDialog({
  open,
  onOpenChange,
  citationSlots,
  onApply,
}: BulkCitationDialogProps) {
  const [pasteText, setPasteText] = useState("");
  const [stage, setStage] = useState<Stage>("paste");
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  const [unassigned, setUnassigned] = useState<string[]>([]);

  const resetAndClose = () => {
    setPasteText("");
    setStage("paste");
    setAssignments([]);
    setUnassigned([]);
    onOpenChange(false);
  };

  const handleParseAndAdvance = () => {
    const parsed = parseCitationList(pasteText);
    const newAssignments: SlotAssignment[] = citationSlots.map((slot, i) => ({
      slotId: slot.id,
      citation: parsed[i] ?? null,
    }));
    const overflow =
      parsed.length > citationSlots.length
        ? parsed.slice(citationSlots.length)
        : [];

    setAssignments(newAssignments);
    setUnassigned(overflow);
    setStage("review");
  };

  const handleApply = () => {
    const result: Record<string, string> = {};
    for (const a of assignments) {
      if (a.citation) result[a.slotId] = a.citation;
    }
    onApply(result);
    resetAndClose();
  };

  const handleUnassign = (slotId: string) => {
    setAssignments((prev) => {
      const target = prev.find((a) => a.slotId === slotId);
      if (target?.citation) {
        setUnassigned((u) => [...u, target.citation as string]);
      }
      return prev.map((a) =>
        a.slotId === slotId ? { ...a, citation: null } : a,
      );
    });
  };

  const handleAssignFromUnassigned = (slotId: string, index: number) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.slotId === slotId ? { ...a, citation: unassigned[index] } : a,
      ),
    );
    setUnassigned((u) => u.filter((_, i) => i !== index));
  };

  const slotsWithoutCitation = assignments.filter((a) => !a.citation).length;
  const assignedCount = assignments.length - slotsWithoutCitation;
  const slotPlural = (n: number) => (n === 1 ? "" : "s");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetAndClose();
        } else {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        {stage === "paste" ? (
          <>
            <DialogHeader>
              <DialogTitle>Paste all citations</DialogTitle>
              <DialogDescription>
                You have {citationSlots.length} CITATION NEEDED slot
                {slotPlural(citationSlots.length)} in document order. Paste your
                reference list below — numbered or unnumbered, one per line, or
                separated by blank lines for multi-line citations.
              </DialogDescription>
            </DialogHeader>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={
                "1. Smith, J. (2020). Title. Journal, 10(1), 1-20.\n2. Lee, K. (2021). Title. Journal, 11(2), 21-40."
              }
              aria-label="Paste references"
              className={cn(
                "h-72 w-full resize-y rounded-md border border-border bg-card p-3",
                "font-mono text-sm text-foreground placeholder:text-muted-foreground/60",
                "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]/40",
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                onClick={handleParseAndAdvance}
                disabled={!pasteText.trim()}
              >
                Continue to review
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Review citation assignments</DialogTitle>
              <DialogDescription>
                {assignedCount} of {assignments.length} slot
                {slotPlural(assignments.length)} assigned.
                {slotsWithoutCitation > 0
                  ? ` ${slotsWithoutCitation} unassigned will stay pending.`
                  : ""}
                {unassigned.length > 0
                  ? ` ${unassigned.length} extra reference${slotPlural(unassigned.length)} not used.`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 space-y-2 overflow-auto">
              {assignments.map((a, i) => {
                const slot = citationSlots.find((s) => s.id === a.slotId);
                if (!slot) return null;
                const contextHead =
                  slot.contextBefore.length > 40
                    ? `…${slot.contextBefore.slice(-40)}`
                    : slot.contextBefore;
                return (
                  <div key={a.slotId} className="rounded border border-border p-3">
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      Slot {i + 1} — context: &ldquo;{contextHead}&rdquo;
                    </div>
                    {a.citation ? (
                      <div className="flex items-start gap-2">
                        <span className="flex-1 text-sm text-foreground">
                          {a.citation}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassign(a.slotId)}
                          aria-label="Unassign citation"
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm italic text-muted-foreground">
                          {unassigned.length > 0
                            ? "Unassigned. Pick from extras below or leave pending."
                            : "Unassigned. Will stay pending."}
                        </span>
                        {unassigned.length > 0 && (
                          <select
                            aria-label={`Assign extra to slot ${i + 1}`}
                            onChange={(e) => {
                              const idx = Number(e.target.value);
                              if (!Number.isNaN(idx)) {
                                handleAssignFromUnassigned(a.slotId, idx);
                              }
                            }}
                            value=""
                            className={cn(
                              "h-7 rounded border border-border bg-card px-2 text-xs",
                              "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]/40",
                            )}
                          >
                            <option value="">Assign extra…</option>
                            {unassigned.map((u, ui) => (
                              <option key={ui} value={ui}>
                                {u.length > 60 ? `${u.slice(0, 60)}…` : u}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {unassigned.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <div className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    Extra references not assigned
                  </div>
                  {unassigned.map((u, i) => (
                    <div
                      key={i}
                      className="mb-1 rounded border border-border bg-muted/40 p-2 text-sm text-muted-foreground"
                    >
                      {u}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStage("paste")}>
                Back to paste
              </Button>
              <Button onClick={handleApply} disabled={assignedCount === 0}>
                Apply {assignedCount} citation{slotPlural(assignedCount)}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
