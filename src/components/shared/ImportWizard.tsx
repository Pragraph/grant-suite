"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowRight, Upload, SkipForward } from "lucide-react";

import { useDocumentStore } from "@/stores/document-store";
import { useProjectStore } from "@/stores/project-store";
import type { JourneyMode } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentImporter } from "@/components/shared/DocumentImporter";
import { QuickFillGI } from "@/components/shared/QuickFillGI";

// ─── Import step definitions per journey mode ───────────────────────────────

interface ImportStep {
  canonicalName: string;
  label: string;
  helpText: string;
  phase: number;
  step: number;
  required: boolean;
}

const IMPORT_STEPS: Record<string, ImportStep[]> = {
  planned: [
    {
      canonicalName: "Grant_Intelligence.md",
      label: "Grant Intelligence",
      helpText:
        "Upload or paste your grant guidelines, evaluation criteria, and requirements. This is the most important context document. If you don't have this yet, skip for now and use the Quick-Fill form in Phase 1.",
      phase: 1,
      step: 3,
      required: false,
    },
    {
      canonicalName: "Research_Design.md",
      label: "Research Design",
      helpText:
        "Upload or paste your existing research design, methodology, or research proposal draft. Include your research questions, methodology approach, and timeline.",
      phase: 3,
      step: 1,
      required: false,
    },
    {
      canonicalName: "Proposal_Blueprint.md",
      label: "Strategic Blueprint (optional)",
      helpText:
        "If you have strategic notes, a positioning document, or an outline of your proposal strategy, upload it here.",
      phase: 2,
      step: 5,
      required: false,
    },
  ],
  review: [
    {
      canonicalName: "Complete_Proposal.md",
      label: "Your Proposal Draft",
      helpText:
        "Upload or paste your complete proposal. This is the document that will be reviewed and optimized.",
      phase: 5,
      step: 8,
      required: true,
    },
    {
      canonicalName: "Grant_Intelligence.md",
      label: "Grant Guidelines (recommended)",
      helpText:
        "Upload or paste the grant guidelines. This helps the review align with the funder's evaluation criteria.",
      phase: 1,
      step: 3,
      required: false,
    },
  ],
  resubmit: [
    {
      canonicalName: "Complete_Proposal.md",
      label: "Your Original Proposal",
      helpText:
        "Upload or paste the proposal that was submitted. This is the base document for revision.",
      phase: 5,
      step: 8,
      required: true,
    },
    {
      canonicalName: "Feedback_Analysis.md",
      label: "Reviewer Feedback",
      helpText:
        "Paste the reviewer comments, scores, and feedback you received. Include all panel comments if available.",
      phase: 7,
      step: 1,
      required: true,
    },
    {
      canonicalName: "Grant_Intelligence.md",
      label: "Grant Guidelines (recommended)",
      helpText:
        "Upload or paste the grant guidelines for context.",
      phase: 1,
      step: 3,
      required: false,
    },
  ],
};

// ─── Component ──────────────────────────────────────────────────────────────

interface ImportWizardProps {
  projectId: string;
  journeyMode: JourneyMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function ImportWizard({
  projectId,
  journeyMode,
  open,
  onOpenChange,
  onComplete,
}: ImportWizardProps) {
  const { documents, loadDocuments } = useDocumentStore();
  const { activeProject } = useProjectStore();
  const [localImported, setLocalImported] = useState<Set<string>>(new Set());

  const steps = useMemo(
    () => IMPORT_STEPS[journeyMode] ?? [],
    [journeyMode]
  );

  // Load documents on mount
  useEffect(() => {
    if (projectId) loadDocuments(projectId);
  }, [projectId, loadDocuments]);

  // Derive imported docs from store + local tracking (no setState in effect)
  const importedDocs = useMemo(() => {
    const fromStore = new Set(
      documents
        .filter((d) => d.projectId === projectId && d.isCurrent)
        .map((d) => d.canonicalName)
    );
    // Merge with locally tracked imports (for immediate UI feedback)
    for (const name of localImported) {
      fromStore.add(name);
    }
    return fromStore;
  }, [documents, projectId, localImported]);

  const requiredSteps = steps.filter((s) => s.required);
  const allRequiredImported = requiredSteps.every((s) =>
    importedDocs.has(s.canonicalName)
  );
  const totalImported = steps.filter((s) =>
    importedDocs.has(s.canonicalName)
  ).length;

  const handleDocImported = (canonicalName: string) => {
    setLocalImported((prev) => new Set([...prev, canonicalName]));
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete();
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete();
  };

  if (steps.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#4F7DF3]" />
            Import Your Documents
          </DialogTitle>
          <DialogDescription>
            Provide the documents you already have so the system can work with
            your existing material. You can always add or replace these later.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 py-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-[#4F7DF3] rounded-full transition-all duration-300"
              style={{
                width: `${
                  steps.length > 0
                    ? (totalImported / steps.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {totalImported} of {steps.length}
          </span>
        </div>

        {/* Import steps */}
        <div className="space-y-4">
          {steps.map((importStep) => (
            <div key={importStep.canonicalName} className="relative">
              {importStep.required && (
                <Badge
                  variant="outline"
                  className="absolute -top-2 right-0 text-[9px] z-10 bg-background"
                >
                  Required
                </Badge>
              )}

              {/* Show Quick-Fill option for Grant Intelligence in planned mode */}
              {importStep.canonicalName === "Grant_Intelligence.md" &&
              journeyMode === "planned" &&
              !importedDocs.has("Grant_Intelligence.md") ? (
                <div className="space-y-3">
                  <DocumentImporter
                    projectId={projectId}
                    canonicalName={importStep.canonicalName}
                    phase={importStep.phase}
                    step={importStep.step}
                    label={importStep.label}
                    helpText={importStep.helpText}
                    allowPaste
                    onImported={handleDocImported}
                  />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-3 text-xs text-muted-foreground">
                        or fill in what you know
                      </span>
                    </div>
                  </div>
                  <QuickFillGI
                    projectId={projectId}
                    defaults={{
                      grantName: activeProject?.grantScheme || "",
                      funder: activeProject?.targetFunder || "",
                      country: activeProject?.country || "",
                      budgetRange: activeProject?.budgetRange || "",
                      grantScheme: activeProject?.grantScheme || "",
                    }}
                    onComplete={() => handleDocImported("Grant_Intelligence.md")}
                  />
                </div>
              ) : (
                <DocumentImporter
                  projectId={projectId}
                  canonicalName={importStep.canonicalName}
                  phase={importStep.phase}
                  step={importStep.step}
                  label={importStep.label}
                  helpText={importStep.helpText}
                  allowPaste
                  onImported={handleDocImported}
                />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            <SkipForward className="h-4 w-4 mr-1" />
            Skip for now
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!allRequiredImported && requiredSteps.length > 0}
          >
            {allRequiredImported
              ? "Continue to Project"
              : "Import required documents to continue"}
            {allRequiredImported && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
