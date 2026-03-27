"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Save,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { usePromptEngine } from "@/hooks/usePromptEngine";
import { useProjectStore } from "@/stores/project-store";
import { useDocumentStore } from "@/stores/document-store";
import { useProgressStore } from "@/stores/progress-store";
import { storage } from "@/lib/storage";
import type { CompileContext } from "@/lib/prompt-engine";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownRenderer } from "@/components/document/MarkdownRenderer";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WizardStepConfig {
  id: string;
  title: string;
  description: string;
  type: "context-form" | "prompt-compile" | "paste-output" | "external-tool" | "paste-collection";
  templateId?: string;
  externalTool?: {
    name: string;
    url: string;
    instructions: string;
  };
  generateQueries?: (formValues: Record<string, string>) => string[];
  collectionLabel?: string;
  collectionMinItems?: number;
  formInputName?: string;
}

interface MethodWizardProps {
  methodId: string;
  methodName: string;
  projectId: string;
  steps: WizardStepConfig[];
  initialFormValues?: Record<string, string>;
  onComplete: () => void;
  onCancel: () => void;
}

interface WizardState {
  currentStep: number;
  formValues: Record<string, string>;
  compiledPrompts: Record<string, string>;
  pastedOutputs: Record<string, string>;
  completedSteps: number[];
}

// ─── Persistence ────────────────────────────────────────────────────────────

function getWizardKey(projectId: string, methodId: string) {
  return `grant-suite-wizard-${projectId}-${methodId}`;
}

// ─── Animation variants ─────────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
  }),
};

// ─── Component ──────────────────────────────────────────────────────────────

export function MethodWizard({
  methodId,
  methodName,
  projectId,
  steps,
  initialFormValues,
  onComplete,
  onCancel,
}: MethodWizardProps) {
  const { compile } = usePromptEngine();
  const activeProject = useProjectStore((s) => s.activeProject);
  const saveDocument = useDocumentStore((s) => s.saveDocument);
  const updateStepStatus = useProgressStore((s) => s.updateStepStatus);

  // ── Lazy initial state: restore from localStorage + pre-fill from project ─

  const [state, setState] = useState<WizardState>(() => {
    let initial: WizardState = {
      currentStep: 0,
      formValues: {},
      compiledPrompts: {},
      pastedOutputs: {},
      completedSteps: [],
    };

    try {
      const persisted = localStorage.getItem(getWizardKey(projectId, methodId));
      if (persisted) {
        initial = JSON.parse(persisted) as WizardState;
      }
    } catch {
      // Ignore parse errors
    }

    // Pre-fill from project context
    const project = useProjectStore.getState().activeProject;
    if (project) {
      const updates: Record<string, string> = {};
      if (!initial.formValues.discipline && project.discipline) {
        updates.discipline = project.discipline;
      }
      if (!initial.formValues.country && project.country) {
        updates.country = project.country;
      }
      if (!initial.formValues.careerStage && project.careerStage) {
        updates.careerStage = project.careerStage;
      }
      if (Object.keys(updates).length > 0) {
        initial = { ...initial, formValues: { ...initial.formValues, ...updates } };
      }
    }

    // Merge caller-provided initial values (e.g., method outputs for convergence)
    if (initialFormValues) {
      initial = { ...initial, formValues: { ...initialFormValues, ...initial.formValues } };
    }

    return initial;
  });

  const [direction, setDirection] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const isInitialMount = useRef(true);

  // ── Persist state changes (skip initial mount) ────────────────────────────

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(getWizardKey(projectId, methodId), JSON.stringify(state));
    } catch {
      // Storage full
    }
  }, [state, projectId, methodId]);

  const currentStepConfig = steps[state.currentStep];

  // ── Form value handler ────────────────────────────────────────────────────

  const setFormValue = useCallback((name: string, value: string) => {
    setState((prev) => ({
      ...prev,
      formValues: { ...prev.formValues, [name]: value },
    }));
  }, []);

  // ── Compile prompt ────────────────────────────────────────────────────────

  const handleCompile = useCallback(
    (templateId: string, stepId: string) => {
      if (!activeProject) return;

      const context: CompileContext = {
        project: {
          title: activeProject.title,
          discipline: activeProject.discipline,
          country: activeProject.country,
          careerStage: activeProject.careerStage,
          targetFunder: activeProject.targetFunder,
          budgetRange: activeProject.budgetRange,
        },
        documents: {},
        formInputs: state.formValues,
      };

      try {
        const result = compile(templateId, context);
        setState((prev) => ({
          ...prev,
          compiledPrompts: { ...prev.compiledPrompts, [stepId]: result.compiledPrompt },
        }));
      } catch (err) {
        toast.error("Failed to compile prompt", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [activeProject, state.formValues, compile],
  );

  // ── Copy to clipboard ────────────────────────────────────────────────────

  const handleCopy = useCallback(async (text: string, feedbackId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(feedbackId);
      toast.success("Copied!");
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    setDirection(1);
    setState((prev) => {
      const completed = prev.completedSteps.includes(prev.currentStep)
        ? prev.completedSteps
        : [...prev.completedSteps, prev.currentStep];
      return {
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, steps.length - 1),
        completedSteps: completed,
      };
    });
  }, [steps.length]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  }, []);

  // ── Save final output ────────────────────────────────────────────────────

  const handleSaveFinalOutput = useCallback(
    async (templateId: string, stepId: string) => {
      const content = state.pastedOutputs[stepId];
      if (!content?.trim()) return;

      const wordCount = content
        .replace(/[#*`>\-|=]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

      const outputNames: Record<string, string> = {
        method1: "Method1_Gap_Synthesis.md",
        method2: "Method2_Trend_Discovery.md",
        method3: "Method3_Funding_Discovery.md",
        method4: "Method4_Convergence_Synthesis.md",
      };

      const docName = outputNames[methodId] || `${methodId}_output.md`;

      const doc = {
        id: storage.createId(),
        projectId,
        phase: 1,
        step: 1,
        name: methodName,
        canonicalName: docName,
        content,
        format: "md" as const,
        version: 1,
        isCurrent: true,
        wordCount,
        createdAt: new Date().toISOString(),
      };

      try {
        await saveDocument(projectId, doc);
        updateStepStatus(projectId, 1, 1, "in-progress");

        // Clean up wizard persistence
        localStorage.removeItem(getWizardKey(projectId, methodId));

        toast.success(`${docName} saved`);
        onComplete();
      } catch (err) {
        toast.error("Failed to save", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [state.pastedOutputs, methodId, methodName, projectId, saveDocument, updateStepStatus, onComplete],
  );

  // ── Can proceed check ────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    const step = currentStepConfig;
    switch (step.type) {
      case "context-form":
        return !!(
          state.formValues.discipline?.trim() &&
          state.formValues.areaOfInterest?.trim() &&
          state.formValues.researchType?.trim()
        );
      case "prompt-compile":
        return !!state.compiledPrompts[step.id];
      case "paste-output":
        return !!state.pastedOutputs[step.id]?.trim();
      case "external-tool":
        return true; // Always optional to proceed
      case "paste-collection":
        if (!state.formValues[step.formInputName || step.id]) return false;
        if (step.collectionMinItems) {
          const lines = state.formValues[step.formInputName || step.id]
            .split("\n")
            .filter((l) => l.trim());
          return lines.length >= step.collectionMinItems;
        }
        return true;
      default:
        return true;
    }
  };

  // ── Check if this is the last step ────────────────────────────────────────

  const isLastStep = state.currentStep === steps.length - 1;

  // ── Render step content ───────────────────────────────────────────────────

  const renderStepContent = () => {
    const step = currentStepConfig;

    switch (step.type) {
      // ── Context Form ──────────────────────────────────────────────────────
      case "context-form":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wizard-discipline" className="text-xs font-medium text-muted-foreground">
                Field / Discipline <span className="text-error">*</span>
              </Label>
              <Input
                id="wizard-discipline"
                value={state.formValues.discipline || ""}
                onChange={(e) => setFormValue("discipline", e.target.value)}
                placeholder="e.g., Computational Biology"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-area" className="text-xs font-medium text-muted-foreground">
                Area of Interest <span className="text-error">*</span>
              </Label>
              <textarea
                id="wizard-area"
                value={state.formValues.areaOfInterest || ""}
                onChange={(e) => setFormValue("areaOfInterest", e.target.value)}
                placeholder="Describe the specific area you want to explore..."
                className={cn(
                  "w-full min-h-25 resize-y rounded-lg border border-border/50 bg-muted p-3",
                  "font-mono text-sm text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-background",
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-type" className="text-xs font-medium text-muted-foreground">
                Research Type <span className="text-error">*</span>
              </Label>
              <select
                id="wizard-type"
                value={state.formValues.researchType || ""}
                onChange={(e) => setFormValue("researchType", e.target.value)}
                aria-label="Research Type"
                className={cn(
                  "w-full h-9 rounded-md border border-border/50 bg-muted px-3",
                  "text-sm text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-background",
                )}
              >
                <option value="">Select...</option>
                <option value="fundamental">Fundamental / Basic</option>
                <option value="applied">Applied</option>
                <option value="translational">Translational</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wizard-country" className="text-xs font-medium text-muted-foreground">
                  Country
                </Label>
                <Input
                  id="wizard-country"
                  value={state.formValues.country || ""}
                  onChange={(e) => setFormValue("country", e.target.value)}
                  placeholder="e.g., United States"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wizard-career" className="text-xs font-medium text-muted-foreground">
                  Career Stage
                </Label>
                <Input
                  id="wizard-career"
                  value={state.formValues.careerStage || ""}
                  onChange={(e) => setFormValue("careerStage", e.target.value)}
                  placeholder="e.g., Early Career"
                />
              </div>
            </div>
          </div>
        );

      // ── Prompt Compile ────────────────────────────────────────────────────
      case "prompt-compile": {
        const compiled = state.compiledPrompts[step.id];

        if (!compiled && step.templateId) {
          return (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{step.description}</p>
              <Button onClick={() => handleCompile(step.templateId!, step.id)}>
                Compile Prompt
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="max-h-80 overflow-auto rounded-lg bg-muted p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                {compiled}
              </pre>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="lg"
                onClick={() => handleCopy(compiled || "", `compile-${step.id}`)}
                className="min-w-45"
              >
                {copyFeedback === `compile-${step.id}` ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Paste this prompt into your preferred AI tool and copy the response.
            </p>
          </div>
        );
      }

      // ── Paste Output ──────────────────────────────────────────────────────
      case "paste-output": {
        const output = state.pastedOutputs[step.id] || "";

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{step.description}</p>

            {previewMode && output ? (
              <div className="min-h-50 overflow-auto rounded-lg border border-border/50 bg-secondary p-6">
                <MarkdownRenderer content={output} />
              </div>
            ) : (
              <textarea
                value={output}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    pastedOutputs: { ...prev.pastedOutputs, [step.id]: e.target.value },
                  }))
                }
                placeholder="Paste the AI output here..."
                className={cn(
                  "w-full min-h-50 resize-y rounded-lg border border-border/50 bg-muted p-4",
                  "font-mono text-sm text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-background",
                )}
              />
            )}

            {output.trim() && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4" />
                {previewMode ? "Raw Text" : "Preview"}
              </Button>
            )}
          </div>
        );
      }

      // ── External Tool ─────────────────────────────────────────────────────
      case "external-tool": {
        const tool = step.externalTool;
        const queries = step.generateQueries?.(state.formValues) || [];

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{step.description}</p>

            {tool && (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-accent-500/10 px-4 py-2.5 text-sm font-medium text-accent-400 transition-colors hover:bg-accent-500/20"
              >
                <ExternalLink className="h-4 w-4" />
                Open {tool.name}
              </a>
            )}

            {tool?.instructions && (
              <div className="rounded-lg border border-border/50 bg-muted/50 p-4 text-sm text-muted-foreground">
                {tool.instructions}
              </div>
            )}

            {queries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Search queries to use:</p>
                {queries.map((query, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md bg-muted px-3 py-2"
                  >
                    <code className="flex-1 text-sm text-foreground">{query}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => handleCopy(query, `query-${i}`)}
                    >
                      {copyFeedback === `query-${i}` ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      // ── Paste Collection ──────────────────────────────────────────────────
      case "paste-collection": {
        const inputName = step.formInputName || step.id;
        const value = state.formValues[inputName] || "";
        const lines = value.split("\n").filter((l) => l.trim());

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{step.description}</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {step.collectionLabel || "Items"}{" "}
                {step.collectionMinItems && (
                  <span className="text-muted-foreground/60">
                    (minimum {step.collectionMinItems})
                  </span>
                )}
              </Label>
              <textarea
                value={value}
                onChange={(e) => setFormValue(inputName, e.target.value)}
                placeholder="Enter one item per line..."
                className={cn(
                  "w-full min-h-50 resize-y rounded-lg border border-border/50 bg-muted p-4",
                  "font-mono text-sm text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-background",
                )}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {lines.length} item{lines.length !== 1 ? "s" : ""} entered
              {step.collectionMinItems && lines.length < step.collectionMinItems && (
                <span className="text-warning">
                  {" "}— need {step.collectionMinItems - lines.length} more
                </span>
              )}
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ── Render stepper ────────────────────────────────────────────────────────

  return (
    <Card className="border-l-[3px] border-l-phase-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{methodName}</CardTitle>
          <Badge variant="outline" className="text-[10px] shrink-0">
            Step {state.currentStep + 1} of {steps.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Stepper dots (desktop: horizontal, mobile: horizontal) ───── */}
        <div className="flex items-center gap-1">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => {
                  if (i <= Math.max(...state.completedSteps, state.currentStep)) {
                    setDirection(i > state.currentStep ? 1 : -1);
                    setState((prev) => ({ ...prev, currentStep: i }));
                  }
                }}
                disabled={i > Math.max(...state.completedSteps, state.currentStep, 0)}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all",
                  i === state.currentStep
                    ? "bg-phase-1 text-white"
                    : state.completedSteps.includes(i)
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground",
                  i <= Math.max(...state.completedSteps, state.currentStep, 0)
                    ? "cursor-pointer hover:ring-2 hover:ring-phase-1/30"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                {state.completedSteps.includes(i) && i !== state.currentStep ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    state.completedSteps.includes(i) ? "bg-success/40" : "bg-border/50",
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step title ──────────────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-medium text-foreground">
            {currentStepConfig.title}
          </h3>
        </div>

        {/* ── Step content (animated) ────────────────────────────────── */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={state.currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <div className="flex items-center gap-2">
            {state.currentStep > 0 && (
              <Button variant="secondary" size="sm" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          <div>
            {isLastStep && currentStepConfig.type === "paste-output" ? (
              <Button
                onClick={() => handleSaveFinalOutput(currentStepConfig.templateId || "", currentStepConfig.id)}
                disabled={!canProceed()}
              >
                <Save className="h-4 w-4" />
                Save & Finish
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
