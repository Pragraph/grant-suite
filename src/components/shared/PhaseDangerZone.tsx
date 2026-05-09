"use client";

import { useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResetPhaseDialog } from "@/components/shared/ResetPhaseDialog";

interface PhaseDangerZoneProps {
  projectId: string;
  phase: number;
}

const expandVariants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" as const },
  expanded: { height: "auto", opacity: 1, overflow: "visible" as const },
};

export function PhaseDangerZone({ projectId, phase }: PhaseDangerZoneProps) {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mt-12 pt-6 border-t border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 text-xs font-medium text-muted-foreground/60",
          "hover:text-muted-foreground transition-colors",
        )}
      >
        <ShieldAlert className="h-3 w-3" />
        Danger Zone
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={expandVariants}
            transition={{ duration: 0.2 }}
            className="mt-3"
          >
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Reset Phase {phase}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently deletes all documents, step statuses, and saved
                  drafts in this phase. Refused if any later phase has
                  progress. This cannot be undone.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Reset Phase {phase}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResetPhaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        phase={phase}
      />
    </div>
  );
}
