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
  Plus,
  Save,
  Trash2,
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
  type: "context-form" | "prompt-compile" | "paste-output" | "external-tool" | "paste-collection" | "gap-citation-collection" | "topic-brief-form";
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
  hideQueryText?: boolean;
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
      if (!initial.formValues.areaOfInterest && project.areaOfInterest) {
        updates.areaOfInterest = project.areaOfInterest;
      }
      if (!initial.formValues.country && project.country) {
        updates.country = project.country;
      }
      if (!initial.formValues.currency && project.currency) {
        updates.currency = project.currency;
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
          areaOfInterest: activeProject.areaOfInterest || "",
          country: activeProject.country,
          careerStage: activeProject.careerStage || "",
          currency: activeProject.currency || "",
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
        method3: "Method3_Research_Direction_Brief.md",
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
        if (step.formInputName) {
          return !!(state.formValues[step.formInputName]?.trim());
        }
        return true;
      case "paste-collection":
        if (!state.formValues[step.formInputName || step.id]) return false;
        if (step.collectionMinItems) {
          const lines = state.formValues[step.formInputName || step.id]
            .split("\n")
            .filter((l) => l.trim());
          return lines.length >= step.collectionMinItems;
        }
        return true;
      case "gap-citation-collection": {
        const inputName = step.formInputName || step.id;
        const minItems = step.collectionMinItems || 5;
        try {
          const entries = JSON.parse(state.formValues[inputName] || "[]");
          const filled = entries.filter(
            (e: { gap: string; citation: string }) =>
              e.gap.trim().length > 10 && e.citation.trim().length > 10,
          );
          return filled.length >= minItems;
        } catch {
          return false;
        }
      }
      case "topic-brief-form":
        return !!(
          state.formValues.researchTopic?.trim() &&
          state.formValues.researchObjectives?.trim() &&
          state.formValues.researchQuestions?.trim() &&
          state.formValues.gapJustification?.trim() &&
          state.formValues.keyReferences?.trim()
        );
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
              <Label htmlFor="wizard-discipline" className="text-xs font-medium text-gray-500">
                Field / Discipline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="wizard-discipline"
                value={state.formValues.discipline || ""}
                onChange={(e) => setFormValue("discipline", e.target.value)}
                placeholder="e.g., Computational Biology"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-area" className="text-xs font-medium text-gray-500">
                Area of Interest <span className="text-red-500">*</span>
              </Label>
              <Input
                id="wizard-area"
                value={state.formValues.areaOfInterest || ""}
                onChange={(e) => setFormValue("areaOfInterest", e.target.value)}
                placeholder="e.g., AI in disability sports, Student motivation in online learning"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500">
                Research Type <span className="text-red-500">*</span>
              </Label>
              <div className="grid gap-2">
                {[
                  {
                    value: "fundamental",
                    label: "Fundamental / Basic",
                    description: "Builds new knowledge or theory without immediate practical use.",
                    example: "e.g., FRGS",
                  },
                  {
                    value: "applied",
                    label: "Applied",
                    description: "Uses existing knowledge to solve a specific real-world problem.",
                    example: "e.g., PRGS, industry-partnered grants",
                  },
                  {
                    value: "translational",
                    label: "Translational",
                    description: "Turns laboratory or theoretical findings into real-world applications.",
                    example: "e.g., TRGS",
                  },
                  {
                    value: "mixed",
                    label: "Mixed Methods",
                    description: "Combines fundamental understanding with practical application in one study.",
                    example: "e.g., LRGS, multi-phase grants",
                  },
                ].map((option) => {
                  const isSelected = state.formValues.researchType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormValue("researchType", option.value)}
                      className={cn(
                        "w-full text-left rounded-lg border p-3 transition-all",
                        isSelected
                          ? "border-[#4F7DF3] bg-[#F0F4FF] ring-1 ring-[#4F7DF3]/30"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-[#4F7DF3]" : "text-gray-800",
                          )}>
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {option.description}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {option.example}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4F7DF3] mt-0.5">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
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
              <p className="text-sm text-gray-500">{step.description}</p>
              <Button onClick={() => handleCompile(step.templateId!, step.id)}>
                Compile Prompt
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="max-h-80 overflow-auto rounded-xl bg-gray-50 border border-gray-200 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
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
            <p className="text-xs text-gray-400">
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
            <p className="text-sm text-gray-500">{step.description}</p>

            {previewMode && output ? (
              <div className="min-h-50 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-6">
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
                  "w-full min-h-50 resize-y rounded-lg border border-gray-200 bg-gray-50 p-4",
                  "font-mono text-sm text-gray-800 placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-2 focus:ring-offset-white",
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
            <p className="text-sm text-gray-500">{step.description}</p>

            {step.formInputName && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
                <Label htmlFor={`wizard-${step.formInputName}`} className="text-xs font-medium text-gray-700 mb-2 block">
                  {step.collectionLabel || "Input"} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`wizard-${step.formInputName}`}
                  value={state.formValues[step.formInputName] || ""}
                  onChange={(e) => setFormValue(step.formInputName!, e.target.value)}
                  placeholder={step.description}
                />
                {step.collectionMinItems && (
                  <p className="text-xs text-blue-600 mt-2">
                    Copy exactly from the &ldquo;Emerging Keyword/Topic&rdquo; or &ldquo;Recommended Topic&rdquo; column in the AI output
                  </p>
                )}
              </div>
            )}

            {tool && (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#F0F4FF] px-4 py-2.5 text-sm font-medium text-[#4F7DF3] transition-colors hover:bg-[#4F7DF3]/10"
              >
                <ExternalLink className="h-4 w-4" />
                Open {tool.name}
              </a>
            )}

            {tool?.instructions && (
              tool.instructions.includes("\n---\n") ? (
                /* Split mode: render each block as a separate styled card */
                <div className="space-y-4">
                  {tool.instructions.split("\n---\n").map((block, i) => {
                    const lines = block.trim().split("\n");
                    const heading = lines[0];
                    const body = lines.slice(1).join("\n").trim();
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                      >
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          {heading}
                        </h4>
                        <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                          {body}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Default: single block */
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 whitespace-pre-line">
                  {tool.instructions}
                </div>
              )
            )}

            {queries.length > 0 && (
              <div className="space-y-2">
                {step.hideQueryText ? (
                  /* Hidden mode: show only a copy button, not the full text */
                  queries.map((query, i) => (
                    <Button
                      key={i}
                      size="lg"
                      onClick={() => handleCopy(query, `query-${i}`)}
                      className="min-w-45"
                    >
                      {copyFeedback === `query-${i}` ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Search Strings Prompt
                        </>
                      )}
                    </Button>
                  ))
                ) : (
                  /* Default mode: show query text with copy button */
                  <>
                    <p className="text-xs font-medium text-gray-500">Search queries to use:</p>
                    {queries.map((query, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg"
                      >
                        <code className="flex-1 text-sm text-gray-800">{query}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={() => handleCopy(query, `query-${i}`)}
                        >
                          {copyFeedback === `query-${i}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </>
                )}
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
            <p className="text-sm text-gray-500">{step.description}</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                {step.collectionLabel || "Items"}{" "}
                {step.collectionMinItems && (
                  <span className="text-gray-400">
                    (minimum {step.collectionMinItems})
                  </span>
                )}
              </Label>
              <textarea
                value={value}
                onChange={(e) => setFormValue(inputName, e.target.value)}
                placeholder="Enter one item per line..."
                className={cn(
                  "w-full min-h-50 resize-y rounded-lg border border-gray-200 bg-gray-50 p-4",
                  "font-mono text-sm text-gray-800 placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-2 focus:ring-offset-white",
                )}
              />
            </div>

            <p className="text-xs text-gray-500">
              {lines.length} item{lines.length !== 1 ? "s" : ""} entered
              {step.collectionMinItems && lines.length < step.collectionMinItems && (
                <span className="text-amber-500">
                  {" "}— need {step.collectionMinItems - lines.length} more
                </span>
              )}
            </p>
          </div>
        );
      }

      // ── Gap + Citation Collection ─────────────────────────────────────
      case "gap-citation-collection": {
        const inputName = step.formInputName || step.id;
        const minItems = step.collectionMinItems || 5;

        // Parse existing data from formValues (stored as JSON string)
        let entries: { gap: string; citation: string }[] = [];
        try {
          const stored = state.formValues[inputName];
          if (stored) {
            entries = JSON.parse(stored);
          }
        } catch {
          entries = [];
        }

        // Ensure at least one empty entry
        if (entries.length === 0) {
          entries = [{ gap: "", citation: "" }];
        }

        const filledEntries = entries.filter(
          (e) => e.gap.trim().length > 10 && e.citation.trim().length > 10,
        );

        const updateEntries = (newEntries: { gap: string; citation: string }[]) => {
          // Store JSON for the UI to re-parse on re-render
          setFormValue(inputName, JSON.stringify(newEntries));

          // Also store a human-readable version for the prompt template
          const formatted = newEntries
            .filter((e) => e.gap.trim() && e.citation.trim())
            .map(
              (e, i) =>
                `${i + 1}. Research Gap: ${e.gap.trim()}\n   Source: ${e.citation.trim()}`,
            )
            .join("\n\n");
          setFormValue(`${inputName}_formatted`, formatted);
        };

        const updateEntry = (index: number, field: "gap" | "citation", value: string) => {
          const updated = [...entries];
          updated[index] = { ...updated[index], [field]: value };
          updateEntries(updated);
        };

        const addEntry = () => {
          updateEntries([...entries, { gap: "", citation: "" }]);
        };

        const removeEntry = (index: number) => {
          if (entries.length <= 1) return;
          const updated = entries.filter((_, i) => i !== index);
          updateEntries(updated);
        };

        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{step.description}</p>

            {/* Entry cards */}
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Gap {index + 1}
                    </span>
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(index)}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label={`Remove gap ${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`gap-text-${index}`}
                      className="text-xs font-medium text-gray-600"
                    >
                      Research Gap <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id={`gap-text-${index}`}
                      value={entry.gap}
                      onChange={(e) => updateEntry(index, "gap", e.target.value)}
                      placeholder="Paste the research gap or future research recommendation from Scholar Labs..."
                      className={cn(
                        "w-full min-h-20 resize-y rounded-lg border border-gray-200 bg-white p-3",
                        "text-sm text-gray-800 placeholder:text-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`gap-cite-${index}`}
                      className="text-xs font-medium text-gray-600"
                    >
                      APA Citation <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id={`gap-cite-${index}`}
                      value={entry.citation}
                      onChange={(e) => updateEntry(index, "citation", e.target.value)}
                      placeholder="Paste the APA citation here (click Cite → APA in Scholar Labs)..."
                      className={cn(
                        "w-full min-h-14 resize-y rounded-lg border border-gray-200 bg-white p-3",
                        "font-mono text-xs text-gray-700 placeholder:text-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={addEntry}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm text-gray-500 transition-colors hover:border-[#4F7DF3]/40 hover:text-[#4F7DF3] hover:bg-[#F0F4FF]/50"
            >
              <Plus className="h-4 w-4" />
              Add Another Gap
            </button>

            {/* Counter */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg p-3 border",
                filledEntries.length >= minItems
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-gray-50 border-gray-200",
              )}
            >
              <span
                className={cn(
                  "text-xl font-bold",
                  filledEntries.length >= minItems ? "text-emerald-600" : "text-gray-400",
                )}
              >
                {filledEntries.length}
              </span>
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    filledEntries.length >= minItems ? "text-emerald-700" : "text-gray-600",
                  )}
                >
                  gaps collected
                </p>
                <p className="text-xs text-gray-500">
                  {filledEntries.length >= minItems
                    ? "✓ Ready to proceed"
                    : `Minimum ${minItems} required — need ${minItems - filledEntries.length} more`}
                </p>
              </div>
            </div>
          </div>
        );
      }

      // ── Topic Brief Form ──────────────────────────────────────────────────
      case "topic-brief-form":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{step.description}</p>

            {/* ── Required Fields ─────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="wizard-topic" className="text-xs font-medium text-muted-foreground">
                Research Topic / Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="wizard-topic"
                value={state.formValues.researchTopic || ""}
                onChange={(e) => setFormValue("researchTopic", e.target.value)}
                placeholder="e.g., Performance-Relevant Glucose Signatures in Non-Diabetic Endurance Athletes"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-objectives" className="text-xs font-medium text-muted-foreground">
                Research Objectives <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="wizard-objectives"
                value={state.formValues.researchObjectives || ""}
                onChange={(e) => setFormValue("researchObjectives", e.target.value)}
                placeholder={"State 2–4 specific, measurable objectives.\n\ne.g.,\nRO1: To determine the interstitial glucose patterns associated with training adaptation in endurance athletes.\nRO2: To develop a predictive model for recovery readiness using continuous glucose monitoring data."}
                className={cn(
                  "w-full min-h-24 resize-y rounded-lg border border-border bg-background p-3",
                  "text-sm text-foreground placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                )}
              />
              <p className="text-[11px] text-muted-foreground/60">
                Objectives define what you aim to achieve. They should be specific and measurable, distinct from research questions.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-rqs" className="text-xs font-medium text-muted-foreground">
                Research Questions <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="wizard-rqs"
                value={state.formValues.researchQuestions || ""}
                onChange={(e) => setFormValue("researchQuestions", e.target.value)}
                placeholder={"Enter 1–3 research questions, one per line.\n\ne.g.,\nRQ1: What interstitial glucose patterns are associated with training adaptation?\nRQ2: Can ML models predict recovery readiness from CGM data?"}
                className={cn(
                  "w-full min-h-24 resize-y rounded-lg border border-border bg-background p-3",
                  "text-sm text-foreground placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-gap" className="text-xs font-medium text-muted-foreground">
                Gap Justification <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="wizard-gap"
                value={state.formValues.gapJustification || ""}
                onChange={(e) => setFormValue("gapJustification", e.target.value)}
                placeholder="Explain why this is an unresolved gap. What has the literature missed, overlooked, or not yet addressed?"
                className={cn(
                  "w-full min-h-24 resize-y rounded-lg border border-border bg-background p-3",
                  "text-sm text-foreground placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-refs" className="text-xs font-medium text-muted-foreground">
                Key References <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="wizard-refs"
                value={state.formValues.keyReferences || ""}
                onChange={(e) => setFormValue("keyReferences", e.target.value)}
                placeholder={"Paste 3–5 key APA references that support your topic and gap justification.\n\ne.g.,\nHelleputte, S., Podlogar, T., & Gonzalez, J. (2025). Application potential of CGM in elite endurance athletes. Performance Nutrition, 1(1), 13."}
                className={cn(
                  "w-full min-h-28 resize-y rounded-lg border border-border bg-background p-3",
                  "font-mono text-xs text-foreground/80 placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                )}
              />
              <p className="text-[11px] text-muted-foreground/60">
                Minimum 3 references. These will be used by the AI to evaluate your gap justification.
              </p>
            </div>

            {/* ── Optional Fields ─────────────────────────────────────────── */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs text-muted-foreground">
                  Optional — improves downstream quality
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-population" className="text-xs font-medium text-muted-foreground">
                Target Population / Sample
              </Label>
              <textarea
                id="wizard-population"
                value={state.formValues.targetPopulation || ""}
                onChange={(e) => setFormValue("targetPopulation", e.target.value)}
                placeholder="e.g., 30 male endurance athletes aged 18–35, recruited from university sports teams in Selangor, Malaysia"
                className={cn(
                  "w-full min-h-16 resize-y rounded-lg border border-border bg-background p-3",
                  "text-sm text-foreground placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-framework" className="text-xs font-medium text-muted-foreground">
                Theoretical / Conceptual Framework
              </Label>
              <Input
                id="wizard-framework"
                value={state.formValues.theoreticalFramework || ""}
                onChange={(e) => setFormValue("theoreticalFramework", e.target.value)}
                placeholder="e.g., Self-Determination Theory, Technology Acceptance Model, Ecological Systems Theory"
              />
              <p className="text-[11px] text-muted-foreground/60">
                Name the theory or framework grounding your study. Important for MOHE grants (especially FRGS).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-method" className="text-xs font-medium text-muted-foreground">
                Proposed Methodology
              </Label>
              <textarea
                id="wizard-method"
                value={state.formValues.proposedMethodology || ""}
                onChange={(e) => setFormValue("proposedMethodology", e.target.value)}
                placeholder="Describe your proposed approach, design, or methodology if you have one in mind."
                className={cn(
                  "w-full min-h-20 resize-y rounded-lg border border-border bg-background p-3",
                  "text-sm text-foreground placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-outcomes" className="text-xs font-medium text-muted-foreground">
                Expected Outcomes
              </Label>
              <textarea
                id="wizard-outcomes"
                value={state.formValues.expectedOutcomes || ""}
                onChange={(e) => setFormValue("expectedOutcomes", e.target.value)}
                placeholder={"e.g.,\n- A validated ML model for predicting recovery readiness\n- 2 ISI/Scopus journal publications\n- Patent filing for the prediction algorithm"}
                className={cn(
                  "w-full min-h-20 resize-y rounded-lg border border-border bg-background p-3",
                  "text-sm text-foreground placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wizard-scope" className="text-xs font-medium text-muted-foreground">
                Study Scope & Boundaries
              </Label>
              <textarea
                id="wizard-scope"
                value={state.formValues.studyScope || ""}
                onChange={(e) => setFormValue("studyScope", e.target.value)}
                placeholder="Define time frame, geography, variables, and any known limitations or exclusions."
                className={cn(
                  "w-full min-h-16 resize-y rounded-lg border border-border bg-background p-3",
                  "text-sm text-foreground placeholder:text-muted-foreground/60",
                  "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3] focus:ring-offset-1",
                )}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render stepper ────────────────────────────────────────────────────────

  return (
    <Card className="border-l-[3px] border-l-phase-1 bg-white border border-gray-200 rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-gray-900">{methodName}</CardTitle>
          <Badge variant="outline" className="text-[10px] shrink-0 text-gray-500 border-gray-200">
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
                      ? "bg-emerald-100 text-emerald-500"
                      : "bg-gray-100 text-gray-400",
                  i <= Math.max(...state.completedSteps, state.currentStep, 0)
                    ? "cursor-pointer hover:ring-2 hover:ring-[#4F7DF3]/30"
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
                    state.completedSteps.includes(i) ? "bg-emerald-300" : "bg-gray-200",
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step title ──────────────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-medium text-gray-900">
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
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
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
