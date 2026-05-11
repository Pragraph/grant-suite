"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

import { useProgressStore } from "@/stores/progress-store";
import { useDocumentStore } from "@/stores/document-store";
import { storage } from "@/lib/storage";
import { getDownstreamProgress } from "@/lib/phase-dependencies";
import { PHASE_DEFINITIONS } from "@/lib/constants";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResetPhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  phase: number;
}

export function ResetPhaseDialog({
  open,
  onOpenChange,
  projectId,
  phase,
}: ResetPhaseDialogProps) {
  const progress = useProgressStore((s) => s.progress);
  const resetPhaseProgress = useProgressStore((s) => s.resetPhaseProgress);
  const deleteDocumentsByPhase = useDocumentStore(
    (s) => s.deleteDocumentsByPhase,
  );
  const documents = useDocumentStore((s) => s.documents);

  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  const phaseDef = PHASE_DEFINITIONS.find((p) => p.phase === phase);
  const phaseName = phaseDef?.name ?? `Phase ${phase}`;

  const downstream = useMemo(
    () => getDownstreamProgress(progress, phase),
    [progress, phase],
  );

  const phaseDocs = useMemo(
    () =>
      documents.filter(
        (d) => d.projectId === projectId && d.phase === phase && d.isCurrent,
      ),
    [documents, projectId, phase],
  );

  const totalWords = useMemo(
    () => phaseDocs.reduce((sum, d) => sum + d.wordCount, 0),
    [phaseDocs],
  );

  const isMatch = confirmText.trim() === phaseName;

  const handleReset = async () => {
    if (!isMatch || resetting) return;
    setResetting(true);
    try {
      await deleteDocumentsByPhase(projectId, phase);
      resetPhaseProgress(projectId, phase);
      // Round 15.1: clear component-local localStorage drafts (roles, letters,
      // budget rows, partner cards, module toggles, executor form inputs).
      // The Zustand-managed document store and progress store are already
      // reactive, but useState hooks in phase clients lazy-init from
      // localStorage and don't auto-sync. The reload below flushes them.
      storage.resetPhaseLocalStorage(projectId, phase);
      toast.success(`Phase ${phase} reset`, {
        description: `${phaseDocs.length} document${phaseDocs.length === 1 ? "" : "s"} deleted, all step statuses cleared.`,
      });
      onOpenChange(false);
      setConfirmText("");
      // Force a reload so phase clients re-mount with empty in-memory state.
      // Without this, cleared localStorage gets overwritten by stale useState
      // on the next state change.
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      toast.error("Reset failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmText("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <ShieldAlert className="h-5 w-5" />
            Reset Phase {phase}: {phaseName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This permanently deletes all data for this phase.
          </DialogDescription>
        </DialogHeader>

        {downstream.hasProgress ? (
          <>
            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Cannot reset: downstream phases have progress
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Resetting Phase {phase} would invalidate work in later
                    phases. Reset those phases first, in reverse order.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Blocking phases
                </p>
                {downstream.blockingPhases.map((p) => (
                  <div
                    key={p.phase}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-foreground flex-1">
                      Phase {p.phase}: {p.name}
                    </span>
                    <span className="text-muted-foreground">
                      {p.completedSteps} / {p.totalSteps} steps complete
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Got it</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 space-y-2">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  This will permanently delete:
                </p>
                <ul className="text-xs text-foreground space-y-1">
                  <li>
                    <span className="font-medium">{phaseDocs.length}</span>{" "}
                    document{phaseDocs.length === 1 ? "" : "s"}
                    {phaseDocs.length > 0 && (
                      <> ({totalWords.toLocaleString()} total words)</>
                    )}
                  </li>
                  <li>All step statuses for Phase {phase}</li>
                  <li>All form inputs and saved drafts in this phase</li>
                  <li>The Phase {phase} quality gate result</li>
                </ul>
              </div>

              {phaseDocs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Documents to be deleted
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {phaseDocs.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                      >
                        <span className="font-mono text-foreground flex-1 truncate">
                          {d.canonicalName}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {d.wordCount.toLocaleString()} words
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reset-confirm" className="text-xs">
                  Type{" "}
                  <span className="font-mono font-bold text-red-600 dark:text-red-400">
                    {phaseName}
                  </span>{" "}
                  to confirm
                </Label>
                <Input
                  id="reset-confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={phaseName}
                  className="font-mono text-sm"
                  autoComplete="off"
                  autoFocus
                />
                {isMatch && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmation matches
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={resetting}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                disabled={!isMatch || resetting}
                className="bg-red-600 hover:bg-red-700 text-white disabled:bg-red-200 disabled:text-red-400"
              >
                {resetting ? "Resetting..." : `Reset Phase ${phase}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
