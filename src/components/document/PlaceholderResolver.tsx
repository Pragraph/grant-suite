"use client";

import { useState, useEffect, useRef } from "react";
import {
  Check,
  CheckCheck,
  ClipboardPaste,
  ListChecks,
  RotateCcw,
  X,
  BookOpen,
  Edit3,
  ShieldCheck,
  Sigma,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TagInstance, TagType } from "@/lib/placeholders";
import { isReplaceRequired } from "@/lib/placeholders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BulkCitationDialog } from "@/components/document/BulkCitationDialog";

export type ResolverFilter = "all" | "pending" | "resolved";

interface PlaceholderResolverProps {
  tagInstances: TagInstance[];
  resolutions: Record<string, string>;
  confirmed: Set<string>;
  skipped: Set<string>;
  filter: ResolverFilter;
  activeTagId: string | null;
  onApply: (tagId: string, replacement: string) => void;
  onConfirm: (tagId: string) => void;
  onSkip: (tagId: string) => void;
  onUndo: (tagId: string) => void;
  onBulkConfirm?: (tagIds: string[]) => void;
  onBulkApplyCitations?: (assignments: Record<string, string>) => void;
  onBulkApplyUserInputs?: (assignments: Record<string, string>) => void;
  onFilterChange: (filter: ResolverFilter) => void;
  onEntryFocus: (tagId: string) => void;
}

const VERIFY_LIKE_TYPES: ReadonlySet<TagType> = new Set([
  "VERIFY",
  "ESTIMATED",
  "CHECK DATE",
]);

const TAG_ICONS: Record<TagType, React.ComponentType<{ className?: string }>> = {
  "CITATION NEEDED": BookOpen,
  "USER INPUT NEEDED": Edit3,
  VERIFY: ShieldCheck,
  ESTIMATED: Sigma,
  "CHECK DATE": CalendarClock,
};

const TAG_COLORS: Record<TagType, { bg: string; border: string; text: string }> = {
  "CITATION NEEDED": {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    text: "text-rose-700 dark:text-rose-300",
  },
  "USER INPUT NEEDED": {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    text: "text-rose-700 dark:text-rose-300",
  },
  VERIFY: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
  },
  ESTIMATED: {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-300",
  },
  "CHECK DATE": {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-300",
  },
};

const RESOLVED_COLOR = {
  bg: "bg-emerald-50 dark:bg-emerald-950/30",
  border: "border-emerald-200 dark:border-emerald-800",
  text: "text-emerald-700 dark:text-emerald-300",
};

function getInputPlaceholder(type: TagType): string {
  switch (type) {
    case "CITATION NEEDED":
      return "Paste citation here (APA 7th preferred)";
    case "USER INPUT NEEDED":
      return "Enter the missing content here";
    case "VERIFY":
      return "Replace with verified text";
    case "ESTIMATED":
      return "Replace with confirmed value";
    case "CHECK DATE":
      return "Replace with confirmed date";
  }
}

function getConfirmLabel(type: TagType): string {
  switch (type) {
    case "VERIFY":
      return "Confirm as-is";
    case "ESTIMATED":
      return "Keep estimate";
    case "CHECK DATE":
      return "Confirm date";
    default:
      return "Confirm";
  }
}

interface EntryProps {
  index: number;
  total: number;
  tag: TagInstance;
  state: "pending" | "resolved" | "confirmed" | "skipped";
  resolution?: string;
  isActive: boolean;
  onApply: (tagId: string, replacement: string) => void;
  onConfirm: (tagId: string) => void;
  onSkip: (tagId: string) => void;
  onUndo: (tagId: string) => void;
  onFocus: (tagId: string) => void;
}

function Entry({
  index,
  total,
  tag,
  state,
  resolution,
  isActive,
  onApply,
  onConfirm,
  onSkip,
  onUndo,
  onFocus,
}: EntryProps) {
  // For confirm-or-replace tags carrying an asserted bold span, seed the
  // draft with the assertion text so users edit in place rather than
  // retyping. Replace-required tags start blank.
  const initialDraft =
    resolution ??
    (!isReplaceRequired(tag.type) ? (tag.assertionText ?? "") : "");
  const [draft, setDraft] = useState<string>(initialDraft);
  const [editingConfirmable, setEditingConfirmable] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const Icon = TAG_ICONS[tag.type];
  const colors = state === "resolved" || state === "confirmed" ? RESOLVED_COLOR : TAG_COLORS[tag.type];

  const replaceRequired = isReplaceRequired(tag.type);
  const showTextarea = state === "pending" && (replaceRequired || editingConfirmable);

  useEffect(() => {
    if (isActive && state === "pending" && replaceRequired) {
      textareaRef.current?.focus();
    }
  }, [isActive, state, replaceRequired]);

  const handleApply = () => {
    if (!draft.trim()) return;
    onApply(tag.id, draft.trim());
    setEditingConfirmable(false);
  };

  return (
    <div
      id={`resolver-entry-${tag.id}`}
      onClick={() => onFocus(tag.id)}
      className={cn(
        "rounded-lg border p-3 transition-all cursor-pointer",
        colors.bg,
        colors.border,
        isActive && "ring-2 ring-[#4F7DF3]/40",
        state === "skipped" && "opacity-60",
      )}
    >
      {/* Entry header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className={cn("h-3.5 w-3.5 shrink-0", colors.text)} />
          <span className={cn("text-[10px] font-semibold uppercase tracking-wide", colors.text)}>
            {tag.type}
          </span>
          <span className="text-[10px] text-muted-foreground/70 shrink-0">
            {index + 1}/{total}
          </span>
        </div>
        {state === "resolved" && (
          <Badge variant="success" className="text-[9px] px-1.5 py-0 h-4">
            <Check className="h-2.5 w-2.5 mr-0.5" />
            Resolved
          </Badge>
        )}
        {state === "confirmed" && (
          <Badge variant="success" className="text-[9px] px-1.5 py-0 h-4">
            <Check className="h-2.5 w-2.5 mr-0.5" />
            Confirmed
          </Badge>
        )}
        {state === "skipped" && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
            Skipped
          </Badge>
        )}
      </div>

      {/* Collapsed states */}
      {state === "resolved" && resolution && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground line-clamp-2 italic">
            &ldquo;{resolution}&rdquo;
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUndo(tag.id);
            }}
            className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Undo
          </Button>
        </div>
      )}

      {state === "confirmed" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground italic">Marker confirmed and removed.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUndo(tag.id);
            }}
            className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Undo
          </Button>
        </div>
      )}

      {state === "skipped" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground italic">
            Will remain in the saved document.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUndo(tag.id);
            }}
            className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Undo
          </Button>
        </div>
      )}

      {/* Pending state */}
      {state === "pending" && (
        <div className="space-y-2">
          {/* Context preview — shows the full scope (tag + asserted bold)
              so the user sees what they're acting on. */}
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">
            <span className="text-muted-foreground/60">…{tag.contextBefore} </span>
            <span className={cn("font-medium", colors.text)}>
              {tag.raw}
              {tag.assertionText !== undefined && (
                <>
                  {" "}
                  <strong>{tag.assertionText}</strong>
                </>
              )}
            </span>
            <span className="text-muted-foreground/60"> {tag.contextAfter}…</span>
          </p>

          {/* Asserted text summary — makes the action target unambiguous. */}
          {tag.assertionText !== undefined && (
            <p className="text-[10px] text-muted-foreground">
              <span className="font-medium">Verifying:</span>{" "}
              <span className="italic">{tag.assertionText}</span>
            </p>
          )}

          {/* Hint */}
          {tag.hint && (
            <p className="text-[10px] text-muted-foreground italic">Hint: {tag.hint}</p>
          )}

          {/* Replace input */}
          {showTextarea && (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={getInputPlaceholder(tag.type)}
              className={cn(
                "w-full min-h-16 resize-y rounded border border-border bg-card p-2",
                "text-xs text-foreground placeholder:text-muted-foreground/60",
                "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]/40",
              )}
            />
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            {replaceRequired ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApply();
                }}
                disabled={!draft.trim()}
                className="h-7 text-[11px]"
              >
                <Check className="h-3 w-3" />
                Apply
              </Button>
            ) : (
              <>
                {editingConfirmable ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply();
                    }}
                    disabled={!draft.trim()}
                    className="h-7 text-[11px]"
                  >
                    <Check className="h-3 w-3" />
                    Apply replacement
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirm(tag.id);
                    }}
                    className="h-7 text-[11px]"
                  >
                    <Check className="h-3 w-3" />
                    {getConfirmLabel(tag.type)}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingConfirmable(!editingConfirmable);
                  }}
                  className="h-7 text-[11px]"
                >
                  {editingConfirmable ? "Cancel edit" : "Replace with…"}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSkip(tag.id);
              }}
              className="h-7 text-[11px] text-muted-foreground"
            >
              Skip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlaceholderResolver({
  tagInstances,
  resolutions,
  confirmed,
  skipped,
  filter,
  activeTagId,
  onApply,
  onConfirm,
  onSkip,
  onUndo,
  onBulkConfirm,
  onBulkApplyCitations,
  onBulkApplyUserInputs,
  onFilterChange,
  onEntryFocus,
}: PlaceholderResolverProps) {
  const total = tagInstances.length;
  const resolvedCount = Object.keys(resolutions).length + confirmed.size;
  const progress = total === 0 ? 100 : Math.round((resolvedCount / total) * 100);
  const [bulkConfirmDialogOpen, setBulkConfirmDialogOpen] = useState(false);
  const [bulkCitationDialogOpen, setBulkCitationDialogOpen] = useState(false);
  const [batchInputMode, setBatchInputMode] = useState(false);
  const [batchInputDrafts, setBatchInputDrafts] = useState<Record<string, string>>({});

  const getEntryState = (id: string): "pending" | "resolved" | "confirmed" | "skipped" => {
    if (resolutions[id] !== undefined) return "resolved";
    if (confirmed.has(id)) return "confirmed";
    if (skipped.has(id)) return "skipped";
    return "pending";
  };

  const filtered = tagInstances.filter((tag) => {
    const state = getEntryState(tag.id);
    if (filter === "pending") return state === "pending";
    if (filter === "resolved") return state === "resolved" || state === "confirmed";
    return true;
  });

  // Pending confirm-or-replace tags eligible for the bulk-confirm action.
  // VERIFY/ESTIMATED/CHECK DATE only — replace-required tags need explicit
  // human input and are skipped.
  const eligibleForBulkConfirm = tagInstances.filter(
    (t) =>
      VERIFY_LIKE_TYPES.has(t.type) && getEntryState(t.id) === "pending",
  );
  const eligibleCount = eligibleForBulkConfirm.length;

  // Pending CITATION NEEDED slots in document order. The dialog distributes
  // pasted references positionally, so document order matters.
  const pendingCitationSlots = tagInstances.filter(
    (t) =>
      t.type === "CITATION NEEDED" && getEntryState(t.id) === "pending",
  );
  const pendingCitationCount = pendingCitationSlots.length;

  // Pending USER INPUT NEEDED slots in document order. Each is unique and
  // requires explicit user content; batch mode expands them all at once with
  // hint-prominent textareas.
  const pendingUserInputs = tagInstances.filter(
    (t) =>
      t.type === "USER INPUT NEEDED" && getEntryState(t.id) === "pending",
  );
  const pendingUserInputCount = pendingUserInputs.length;
  // Pending IDs for batch mode (kept stable while editing). When the user
  // exits batch mode the slots they didn't fill remain pending.
  const batchSlotIds = batchInputMode ? Object.keys(batchInputDrafts) : [];

  const enterBatchInputMode = () => {
    const initialDrafts: Record<string, string> = {};
    for (const t of pendingUserInputs) {
      initialDrafts[t.id] = resolutions[t.id] ?? "";
    }
    setBatchInputDrafts(initialDrafts);
    setBatchInputMode(true);
  };

  const exitBatchInputMode = () => {
    setBatchInputMode(false);
    setBatchInputDrafts({});
  };

  const applyAllUserInputs = () => {
    const assignments: Record<string, string> = {};
    for (const [id, draft] of Object.entries(batchInputDrafts)) {
      const trimmed = draft.trim();
      if (trimmed) assignments[id] = trimmed;
    }
    if (Object.keys(assignments).length > 0) {
      onBulkApplyUserInputs?.(assignments);
    }
    exitBatchInputMode();
  };

  const focusNextBatchInput = (currentEl: HTMLTextAreaElement) => {
    const all = Array.from(
      document.querySelectorAll<HTMLTextAreaElement>("[data-batch-input='true']"),
    );
    const idx = all.indexOf(currentEl);
    const next = all[idx + 1];
    next?.focus();
  };

  const filledBatchCount = Object.values(batchInputDrafts).filter((v) =>
    v.trim(),
  ).length;

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Resolve placeholders</p>
          <span className="text-[11px] text-muted-foreground">
            {resolvedCount} of {total} resolved
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "pending", "resolved"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
                filter === f
                  ? "bg-[#4F7DF3] text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Bulk action strip — surfaces only when at least one eligible
            tag is pending and the matching handler is wired by the parent.
            Each button shows its own count and is hidden when zero. */}
        {((onBulkConfirm && eligibleCount > 0) ||
          (onBulkApplyCitations && pendingCitationCount > 0) ||
          (onBulkApplyUserInputs && pendingUserInputCount > 0 && !batchInputMode)) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {onBulkConfirm && eligibleCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkConfirmDialogOpen(true)}
                className="h-7 text-[11px]"
              >
                <CheckCheck className="h-3 w-3" />
                Confirm all verifications ({eligibleCount})
              </Button>
            )}
            {onBulkApplyCitations && pendingCitationCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkCitationDialogOpen(true)}
                className="h-7 text-[11px]"
              >
                <ClipboardPaste className="h-3 w-3" />
                Paste all citations ({pendingCitationCount})
              </Button>
            )}
            {onBulkApplyUserInputs && pendingUserInputCount > 0 && !batchInputMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={enterBatchInputMode}
                className="h-7 text-[11px]"
              >
                <ListChecks className="h-3 w-3" />
                Fill all user inputs ({pendingUserInputCount})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bulk confirmation dialog. Soft confirmation — never auto-fires. */}
      <Dialog open={bulkConfirmDialogOpen} onOpenChange={setBulkConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm all verifications?</DialogTitle>
            <DialogDescription>
              This will mark {eligibleCount} placeholder
              {eligibleCount === 1 ? "" : "s"} as confirmed without reviewing
              each one. Use this when you&apos;ve already read the document and
              trust the LLM&apos;s assertions. Individual confirmations can be
              undone afterward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onBulkConfirm?.(eligibleForBulkConfirm.map((t) => t.id));
                setBulkConfirmDialogOpen(false);
              }}
            >
              Confirm all {eligibleCount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk citation paste — two-stage (paste then review). */}
      {onBulkApplyCitations && (
        <BulkCitationDialog
          open={bulkCitationDialogOpen}
          onOpenChange={setBulkCitationDialogOpen}
          citationSlots={pendingCitationSlots}
          onApply={onBulkApplyCitations}
        />
      )}

      {/* Entry list */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {/* Batch input mode — expand pending USER INPUT NEEDED tags as a
            linear form so users can Tab through and fill them all without
            the per-entry expand/collapse cycle. Other tag types still
            render below in normal mode. */}
        {batchInputMode && batchSlotIds.length > 0 && (
          <div className="rounded-lg border border-[#4F7DF3]/30 bg-[#4F7DF3]/5 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4F7DF3]">
                Batch fill — user inputs ({batchSlotIds.length})
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitBatchInputMode}
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Exit batch mode
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Tab between fields. Cmd/Ctrl+Enter applies the current entry
              and advances to the next.
            </p>
            <div className="space-y-2">
              {pendingUserInputs.map((tag, i) => (
                <div
                  key={tag.id}
                  className="rounded border border-border bg-card p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                      USER INPUT NEEDED — {i + 1}/{pendingUserInputs.length}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">
                      …{tag.contextBefore.slice(-30)}
                    </span>
                  </div>
                  {tag.hint && (
                    <p className="text-[10px] italic text-muted-foreground">
                      Hint: {tag.hint}
                    </p>
                  )}
                  <textarea
                    data-batch-input="true"
                    value={batchInputDrafts[tag.id] ?? ""}
                    onChange={(e) =>
                      setBatchInputDrafts((d) => ({
                        ...d,
                        [tag.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        const draft = (batchInputDrafts[tag.id] ?? "").trim();
                        if (draft) {
                          onBulkApplyUserInputs?.({ [tag.id]: draft });
                          setBatchInputDrafts((d) => {
                            const { [tag.id]: _omit, ...rest } = d;
                            void _omit;
                            return rest;
                          });
                        }
                        focusNextBatchInput(e.currentTarget);
                      }
                    }}
                    placeholder={tag.hint ?? "Enter the missing content here"}
                    aria-label={`User input ${i + 1} of ${pendingUserInputs.length}`}
                    className={cn(
                      "w-full min-h-16 resize-y rounded border border-border bg-background p-2",
                      "text-xs text-foreground placeholder:text-muted-foreground/60",
                      "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]/40",
                    )}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <Button
                size="sm"
                onClick={applyAllUserInputs}
                disabled={filledBatchCount === 0}
                className="h-7 text-[11px]"
              >
                <Check className="h-3 w-3" />
                Apply all ({filledBatchCount})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitBatchInputMode}
                className="h-7 text-[11px] text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground italic">
            No entries match this filter.
          </p>
        ) : (
          filtered
            // Hide pending USER INPUT NEEDED entries from the normal list
            // while batch mode is active to avoid double-rendering them.
            .filter(
              (tag) =>
                !(
                  batchInputMode &&
                  tag.type === "USER INPUT NEEDED" &&
                  getEntryState(tag.id) === "pending"
                ),
            )
            .map((tag) => (
              <Entry
                key={tag.id}
                index={tagInstances.findIndex((t) => t.id === tag.id)}
                total={total}
                tag={tag}
                state={getEntryState(tag.id)}
                resolution={resolutions[tag.id]}
                isActive={activeTagId === tag.id}
                onApply={onApply}
                onConfirm={onConfirm}
                onSkip={onSkip}
                onUndo={onUndo}
                onFocus={onEntryFocus}
              />
            ))
        )}
      </div>
    </div>
  );
}
