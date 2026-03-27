"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Database,
  FileText,
  FlaskConical,
  BookOpen,
  Zap,
  DollarSign,
  FolderOpen,
  Layers,
  Lock,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { useProgressStore } from "@/stores/progress-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { PHASE_DEFINITIONS } from "@/lib/constants";
import type { StepStatus } from "@/lib/types";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StepExecutor } from "@/components/phase/StepExecutor";

// ─── Phase 5 definition ────────────────────────────────────────────────────

const PHASE_5 = PHASE_DEFINITIONS[4];

// ─── Types ─────────────────────────────────────────────────────────────────

interface StepMeta {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tooltip: string;
}

// ─── Step metadata ─────────────────────────────────────────────────────────

const STEP_META: Record<number, StepMeta> = {
  1: {
    icon: Database,
    description:
      "Compile ALL upstream documents into a single Proposal_Data.md that feeds every writing step.",
    tooltip:
      "Compiled first because all writing steps need a single, consistent data source. This prevents contradictions between sections.",
  },
  2: {
    icon: FileText,
    description:
      "Draft the executive summary that establishes the narrative arc for the entire proposal.",
    tooltip:
      "Written first because it establishes the narrative arc that all other sections must follow. The executive summary is the reviewer's first impression.",
  },
  3: {
    icon: FlaskConical,
    description:
      "Draft the methods/methodology section with detailed procedures and timeline.",
    tooltip:
      "Written second because the methods define what you'll do, which the background must justify and the impact must project from.",
  },
  4: {
    icon: BookOpen,
    description:
      "Draft the background section that justifies the methods and supports the executive summary.",
    tooltip:
      "Written third because it must justify the methods and support the executive summary's claims. Writing it after methods ensures every method is backed by literature.",
  },
  5: {
    icon: Zap,
    description:
      "Draft the impact statement projecting outcomes and broader significance.",
    tooltip:
      "Written fourth because it must project from the specific methods and connect back to the executive summary's promises.",
  },
  6: {
    icon: DollarSign,
    description:
      "Draft the budget justification narrative connecting costs to methods.",
    tooltip:
      "Written fifth because it must justify every cost in terms of the methods and impact already described.",
  },
  7: {
    icon: FolderOpen,
    description:
      "Compile supporting documents (data management plan, ethics, etc.).",
    tooltip:
      "Written sixth because supporting documents reference details from all previous sections.",
  },
  8: {
    icon: Layers,
    description:
      "Assemble all sections into the complete proposal with coherence checks.",
    tooltip:
      "Assembled last to ensure all sections are coherent, cross-referenced, and within word limits.",
  },
};

// ─── Required documents for Step 1 pre-compilation ─────────────────────────

const REQUIRED_DOCS = [
  { canonicalName: "Grant_Intelligence.md", label: "Grant Intelligence", phase: 1 },
  { canonicalName: "Proposal_Blueprint.md", label: "Proposal Blueprint", phase: 2 },
  { canonicalName: "Research_Design.md", label: "Research Design", phase: 3 },
  { canonicalName: "Budget_Team_Plan.md", label: "Budget & Team Plan", phase: 4 },
];

const OPTIONAL_DOCS = [
  { canonicalName: "Partnership_Plan.md", label: "Partnership Plan", phase: "3A" },
  { canonicalName: "Patent_Analysis.md", label: "Patent & Novelty Analysis", phase: "3B" },
  { canonicalName: "SDG_Alignment.md", label: "SDG Alignment", phase: "3C" },
  { canonicalName: "National_Alignment.md", label: "National Priority Alignment", phase: "3C" },
  { canonicalName: "KPI_Plan.md", label: "KPI Plan", phase: "3C" },
];

// ─── Status helpers ────────────────────────────────────────────────────────

const stepStatusLabels: Record<StepStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "prompt-copied": "Prompt Copied",
  "output-pasted": "Output Pasted",
  complete: "Complete",
};

// ─── Animation variants ─────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

const stepExpandVariants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" as const },
  expanded: { height: "auto", opacity: 1, overflow: "visible" as const },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function countFlags(content: string, flag: string): number {
  const regex = new RegExp(`\\[${flag}[^\\]]*\\]`, "g");
  return (content.match(regex) || []).length;
}

function countWords(content: string): number {
  return content
    .replace(/[#*`>\-|=]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ─── Pre-Compilation Checklist ─────────────────────────────────────────────

function PreCompilationChecklist({
  projectId,
  documents,
  optionalChecked,
  setOptionalChecked,
}: {
  projectId: string;
  documents: { canonicalName: string; projectId: string; isCurrent: boolean; wordCount: number }[];
  optionalChecked: Record<string, boolean>;
  setOptionalChecked: (v: Record<string, boolean>) => void;
}) {
  const hasDoc = (canonicalName: string) =>
    documents.some(
      (d) => d.projectId === projectId && d.canonicalName === canonicalName && d.isCurrent,
    );

  const getDocWords = (canonicalName: string) => {
    const doc = documents.find(
      (d) => d.projectId === projectId && d.canonicalName === canonicalName && d.isCurrent,
    );
    return doc?.wordCount || 0;
  };

  const allRequired = REQUIRED_DOCS.every((d) => hasDoc(d.canonicalName));
  const totalWords = [...REQUIRED_DOCS, ...OPTIONAL_DOCS]
    .filter((d) => hasDoc(d.canonicalName))
    .reduce((sum, d) => sum + getDocWords(d.canonicalName), 0);

  return (
    <Card className="border-phase-5/20 bg-phase-5/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-phase-5" />
            <p className="text-sm font-medium text-foreground">Pre-Compilation Checklist</p>
          </div>
          <Badge
            className={cn(
              "text-[10px]",
              allRequired
                ? "bg-success/20 text-success"
                : "bg-error/20 text-error",
            )}
          >
            {allRequired ? "Ready to compile" : "Missing required documents"}
          </Badge>
        </div>

        {/* Required Documents */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Required Documents
          </p>
          {REQUIRED_DOCS.map((doc) => {
            const exists = hasDoc(doc.canonicalName);
            const words = getDocWords(doc.canonicalName);
            return (
              <div
                key={doc.canonicalName}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
                  exists
                    ? "border-success/20 bg-success/5"
                    : "border-error/20 bg-error/5",
                )}
              >
                {exists ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-error shrink-0" />
                )}
                <span className="flex-1 font-medium text-foreground">{doc.label}</span>
                <span className="text-muted-foreground">Phase {doc.phase}</span>
                {exists && (
                  <span className="text-muted-foreground/70">{words.toLocaleString()} words</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Optional Documents */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Optional Documents
          </p>
          {OPTIONAL_DOCS.map((doc) => {
            const exists = hasDoc(doc.canonicalName);
            const words = getDocWords(doc.canonicalName);
            const checked = optionalChecked[doc.canonicalName] ?? exists;
            return (
              <div
                key={doc.canonicalName}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
                  exists
                    ? "border-phase-5/15 bg-phase-5/5"
                    : "border-border/30 bg-transparent",
                )}
              >
                <Checkbox
                  checked={checked && exists}
                  disabled={!exists}
                  onCheckedChange={(v) =>
                    setOptionalChecked({ ...optionalChecked, [doc.canonicalName]: !!v })
                  }
                />
                <span
                  className={cn(
                    "flex-1 font-medium",
                    exists ? "text-foreground" : "text-muted-foreground/50",
                  )}
                >
                  {doc.label}
                </span>
                <span className="text-muted-foreground/70">Phase {doc.phase}</span>
                {exists ? (
                  <span className="text-muted-foreground/70">{words.toLocaleString()} words</span>
                ) : (
                  <span className="text-muted-foreground/40 italic">Not completed</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Estimated prompt size */}
        <div className="flex items-start gap-2 rounded-md border border-info/30 bg-info/5 p-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-info mt-0.5 shrink-0" />
          <div className="text-[11px] text-muted-foreground space-y-1">
            <p>
              <strong>Estimated prompt size:</strong> ~{totalWords.toLocaleString()} words from{" "}
              {[...REQUIRED_DOCS, ...OPTIONAL_DOCS].filter((d) => hasDoc(d.canonicalName)).length}{" "}
              documents.
            </p>
            <p>
              This prompt is large. Use an AI tool with a large context window (Claude, GPT-4,
              Gemini Pro).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Citation Highlight Display ────────────────────────────────────────────

function CitationHighlights({ content }: { content: string }) {
  const citations = content.match(/\[CITATION NEEDED[^\]]*\]/g) || [];
  if (citations.length === 0) return null;

  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <p className="text-xs font-medium text-warning">
            {citations.length} Citation{citations.length !== 1 ? "s" : ""} Needed
          </p>
        </div>
        <div className="space-y-1">
          {citations.slice(0, 10).map((c, i) => (
            <p key={i} className="text-[11px] text-muted-foreground bg-warning/10 rounded px-2 py-1">
              {c}
            </p>
          ))}
          {citations.length > 10 && (
            <p className="text-[10px] text-muted-foreground/70 italic">
              ...and {citations.length - 10} more
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Phase5Client({ projectId }: { projectId: string }) {
  const { setActiveProject, activeProject } = useProjectStore();
  const { progress, loadProgress, getPhaseCompletion } = useProgressStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [activeStep, setActiveStep] = useState<number | null>(1);

  // Step 1 — optional doc checkboxes
  const [optionalChecked, setOptionalChecked] = useState<Record<string, boolean>>({});

  // ── Initialize ────────────────────────────────────────────────────────────

  useEffect(() => {
    setActiveProject(projectId);
    loadProgress(projectId);
    loadDocuments(projectId);
    setBreadcrumbs([
      { label: "Projects", href: "/projects" },
      { label: activeProject?.title || "Project", href: `/projects/${projectId}` },
      { label: "Phase 5: Proposal Writing" },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Phase progress ────────────────────────────────────────────────────────

  const phaseCompletion = getPhaseCompletion(5);
  const phase5Steps = PHASE_5.steps;

  const getStepStatus = useCallback(
    (stepNum: number): StepStatus => {
      return progress.phases[5]?.steps[stepNum] || "not-started";
    },
    [progress],
  );

  const getStepDocuments = useCallback(
    (stepNum: number) => {
      return documents.filter(
        (d) => d.projectId === projectId && d.phase === 5 && d.step === stepNum && d.isCurrent,
      );
    },
    [documents, projectId],
  );

  // Strict sequential locking: step N requires step N-1 to be complete
  const isStepUnlocked = useCallback(
    (stepNum: number): boolean => {
      if (stepNum === 1) return true;
      const prevStatus = getStepStatus(stepNum - 1);
      return prevStatus === "complete";
    },
    [getStepStatus],
  );

  // Get saved document content for a canonical name
  const getDocContent = useCallback(
    (canonicalName: string): string | null => {
      const doc = documents.find(
        (d) => d.projectId === projectId && d.canonicalName === canonicalName && d.isCurrent,
      );
      return doc?.content ?? null;
    },
    [documents, projectId],
  );

  // ── Template IDs ──────────────────────────────────────────────────────────

  const getTemplateId = (stepNum: number): string => {
    switch (stepNum) {
      case 1: return "phase5.step1-data-compiler";
      case 2: return "phase5.step2-executive-summary";
      case 3: return "phase5.step3-methods";
      case 4: return "phase5.step4-background";
      default: return "";
    }
  };

  // ── Additional form fields per step ────────────────────────────────────────

  const step2Fields = useMemo(
    () => [
      {
        name: "wordLimit",
        label: "Word limit for executive summary",
        type: "text" as const,
        placeholder: "e.g., 500",
        required: true,
      },
    ],
    [],
  );

  const step3Fields = useMemo(
    () => [
      {
        name: "wordLimit",
        label: "Word limit for methods section",
        type: "text" as const,
        placeholder: "e.g., 3000",
        required: true,
      },
    ],
    [],
  );

  const step4Fields = useMemo(
    () => [
      {
        name: "wordLimit",
        label: "Word limit for background section",
        type: "text" as const,
        placeholder: "e.g., 3000",
        required: true,
      },
      {
        name: "keyReferences",
        label: "Key references to include (optional — paste citation list)",
        type: "textarea" as const,
        placeholder: "Paste your key references here...",
        required: false,
      },
    ],
    [],
  );

  // ── Document stats for completed steps ──────────────────────────────────

  const getDocStats = useCallback(
    (canonicalName: string) => {
      const content = getDocContent(canonicalName);
      if (!content) return null;
      return {
        wordCount: countWords(content),
        citationCount: countFlags(content, "CITATION NEEDED"),
        inputCount: countFlags(content, "USER INPUT NEEDED"),
      };
    },
    [getDocContent],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <motion.div className="space-y-8" {...fadeInUp}>
        {/* ── Phase Header ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <PhaseIcon phase={5} size="lg" active />
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">{PHASE_5.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Write your proposal section by section in a strategic order. Each section builds on
              the previous ones, ensuring narrative coherence and evidence alignment.
            </p>
          </div>
        </div>

        {/* ── Progress Bar ───────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Phase Progress</span>
            <span>
              {phase5Steps.filter((s) => getStepStatus(s.step) === "complete").length} of{" "}
              {phase5Steps.length} steps
            </span>
          </div>
          <Progress value={phaseCompletion} className="h-1.5" />
        </div>

        {/* ── Writing Order Rationale ─────────────────────────────────────── */}
        <Card className="border-phase-5/15 bg-phase-5/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-phase-5 mt-0.5 shrink-0" />
              <div className="text-[11px] text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Why this writing order?</p>
                <p>
                  Sections are written in a specific sequence so each builds on the previous. The
                  executive summary sets the narrative arc, methods define the work, background
                  justifies the methods, and impact projects from them. Writing out of order leads to
                  contradictions and wasted revisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Steps ──────────────────────────────────────────────────────── */}
        <div className="space-y-0">
          {phase5Steps.map((stepDef, i) => {
            const status = getStepStatus(stepDef.step);
            const isActive = activeStep === stepDef.step;
            const isComplete = status === "complete";
            const isCurrent = status !== "not-started" && status !== "complete";
            const stepDocs = getStepDocuments(stepDef.step);
            const unlocked = isStepUnlocked(stepDef.step);
            const meta = STEP_META[stepDef.step];
            const StepIcon = meta?.icon;
            const isSession16 = stepDef.step > 4;

            // Get document stats for completed steps
            const producedDocNames: Record<number, string> = {
              1: "Proposal_Data.md",
              2: "Executive_Summary_Draft.md",
              3: "Methods_Draft.md",
              4: "Background_Draft.md",
              5: "Impact_Draft.md",
              6: "Budget_Justification_Draft.md",
              7: "Supporting_Documents.md",
              8: "Complete_Proposal.md",
            };
            const docStats = isComplete ? getDocStats(producedDocNames[stepDef.step]) : null;

            return (
              <div key={stepDef.step} className="relative">
                {/* Timeline line */}
                {i < phase5Steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-3.75 top-9 w-0.5 h-[calc(100%-20px)]",
                      isComplete ? "bg-phase-5" : "bg-border/50",
                    )}
                  />
                )}

                {/* Step header */}
                <button
                  onClick={() => {
                    if (isSession16) return;
                    setActiveStep(isActive ? null : stepDef.step);
                  }}
                  disabled={isSession16}
                  className={cn(
                    "flex w-full items-center gap-3 py-3 text-left transition-colors",
                    "hover:bg-muted/50 rounded-lg px-2 -mx-2",
                    isSession16 && "opacity-50 cursor-not-allowed hover:bg-transparent",
                  )}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isSession16
                        ? "border-border/20 bg-transparent text-muted-foreground/20"
                        : isComplete
                          ? "border-phase-5 bg-phase-5 text-white"
                          : isCurrent
                            ? "border-phase-5 bg-transparent text-phase-5"
                            : unlocked
                              ? "border-border/50 bg-transparent text-muted-foreground/50"
                              : "border-border/30 bg-transparent text-muted-foreground/30",
                    )}
                  >
                    {isSession16 ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{stepDef.step}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isSession16
                            ? "text-muted-foreground/30"
                            : isComplete
                              ? "text-foreground"
                              : isCurrent
                                ? "text-foreground"
                                : unlocked
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/50",
                        )}
                      >
                        {stepDef.name}
                      </p>
                      {!unlocked && !isSession16 && (
                        <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground/50">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />
                          Locked
                        </Badge>
                      )}
                      {isSession16 && (
                        <Badge variant="outline" className="text-[10px] border-border/20 text-muted-foreground/30">
                          Coming soon
                        </Badge>
                      )}
                      {stepDef.step === 1 && isComplete && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-accent-500/30 text-accent-400"
                        >
                          Feeds all writing steps
                        </Badge>
                      )}
                    </div>
                    {/* Completed doc info */}
                    {isComplete && stepDocs.length > 0 && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground/70 truncate">
                          {producedDocNames[stepDef.step]} —{" "}
                          {docStats ? `${docStats.wordCount.toLocaleString()} words` : "saved"}
                        </p>
                        {docStats && (docStats.citationCount > 0 || docStats.inputCount > 0) && (
                          <div className="flex items-center gap-1">
                            {docStats.citationCount > 0 && (
                              <Badge variant="outline" className="text-[9px] border-warning/30 text-warning py-0 h-4">
                                {docStats.citationCount} citations
                              </Badge>
                            )}
                            {docStats.inputCount > 0 && (
                              <Badge variant="outline" className="text-[9px] border-info/30 text-info py-0 h-4">
                                {docStats.inputCount} inputs
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Writing order tooltip */}
                    {meta && !isSession16 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            <StepIcon
                              className={cn(
                                "h-4 w-4",
                                isComplete ? "text-phase-5" : "text-muted-foreground/40",
                              )}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs text-xs">
                          <p className="font-medium mb-1">Writing Order Rationale</p>
                          <p>{meta.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {status !== "not-started" && !isSession16 && (
                      <Badge variant={isComplete ? "default" : "outline"} className="text-[10px]">
                        {stepStatusLabels[status]}
                      </Badge>
                    )}
                    {!isSession16 && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isActive && "rotate-180",
                        )}
                      />
                    )}
                  </div>
                </button>

                {/* Step content (expanded) */}
                <AnimatePresence>
                  {isActive && !isSession16 && (
                    <motion.div
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      variants={stepExpandVariants}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="ml-10 mb-4"
                    >
                      <div className="pt-2 space-y-4">
                        {/* ── Step 1: Proposal Data Compiler ───────────── */}
                        {stepDef.step === 1 && (
                          <>
                            <PreCompilationChecklist
                              projectId={projectId}
                              documents={documents}
                              optionalChecked={optionalChecked}
                              setOptionalChecked={setOptionalChecked}
                            />
                            <StepExecutor
                              templateId={getTemplateId(1)}
                              projectId={projectId}
                              phase={5}
                              step={1}
                              title="Proposal Data Compiler"
                              description={meta?.description}
                              onComplete={() => {
                                loadDocuments(projectId);
                                setActiveStep(2);
                              }}
                            />
                            {isComplete && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-lg border border-phase-5/30 bg-phase-5/5 p-4"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-phase-5" />
                                  <p className="text-sm font-medium text-foreground">
                                    Proposal data compiled
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 ml-6">
                                  This document feeds all writing steps. Steps 2-8 are now available
                                  in sequence.
                                </p>
                              </motion.div>
                            )}
                          </>
                        )}

                        {/* ── Step 2: Executive Summary ────────────────── */}
                        {stepDef.step === 2 && (
                          <>
                            {!unlocked ? (
                              <LockedStepMessage stepNum={2} />
                            ) : (
                              <>
                                <StepExecutor
                                  templateId={getTemplateId(2)}
                                  projectId={projectId}
                                  phase={5}
                                  step={2}
                                  title="Executive Summary Writer"
                                  description={meta?.description}
                                  additionalFields={step2Fields}
                                  onComplete={() => {
                                    loadDocuments(projectId);
                                    setActiveStep(3);
                                  }}
                                />
                                {isComplete && (
                                  <PostStepStats
                                    canonicalName="Executive_Summary_Draft.md"
                                    getDocContent={getDocContent}
                                  />
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* ── Step 3: Methods ──────────────────────────── */}
                        {stepDef.step === 3 && (
                          <>
                            {!unlocked ? (
                              <LockedStepMessage stepNum={3} />
                            ) : (
                              <>
                                <StepExecutor
                                  templateId={getTemplateId(3)}
                                  projectId={projectId}
                                  phase={5}
                                  step={3}
                                  title="Methods Writer"
                                  description={meta?.description}
                                  additionalFields={step3Fields}
                                  onComplete={() => {
                                    loadDocuments(projectId);
                                    setActiveStep(4);
                                  }}
                                />
                                {isComplete && (
                                  <PostStepStats
                                    canonicalName="Methods_Draft.md"
                                    getDocContent={getDocContent}
                                  />
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* ── Step 4: Background ──────────────────────── */}
                        {stepDef.step === 4 && (
                          <>
                            {!unlocked ? (
                              <LockedStepMessage stepNum={4} />
                            ) : (
                              <>
                                <StepExecutor
                                  templateId={getTemplateId(4)}
                                  projectId={projectId}
                                  phase={5}
                                  step={4}
                                  title="Background Writer"
                                  description={meta?.description}
                                  additionalFields={step4Fields}
                                  onComplete={() => {
                                    loadDocuments(projectId);
                                  }}
                                />
                                {isComplete && (
                                  <>
                                    <PostStepStats
                                      canonicalName="Background_Draft.md"
                                      getDocContent={getDocContent}
                                    />
                                    {getDocContent("Background_Draft.md") && (
                                      <CitationHighlights
                                        content={getDocContent("Background_Draft.md")!}
                                      />
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* Steps 5-8 are not built in this session */}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}

// ─── Locked Step Message ────────────────────────────────────────────────────

function LockedStepMessage({ stepNum }: { stepNum: number }) {
  const prevStepName = PHASE_5.steps[stepNum - 2]?.name || "previous step";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/30 p-4">
      <Lock className="h-5 w-5 text-muted-foreground/40" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">Step locked</p>
        <p className="text-xs text-muted-foreground/70">
          Complete &quot;{prevStepName}&quot; first. Steps must be completed in order to maintain
          narrative coherence.
        </p>
      </div>
    </div>
  );
}

// ─── Post-Step Stats ────────────────────────────────────────────────────────

function PostStepStats({
  canonicalName,
  getDocContent,
}: {
  canonicalName: string;
  getDocContent: (name: string) => string | null;
}) {
  const content = getDocContent(canonicalName);
  if (!content) return null;

  const wc = countWords(content);
  const citCount = countFlags(content, "CITATION NEEDED");
  const inputCount = countFlags(content, "USER INPUT NEEDED");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-phase-5/20 bg-phase-5/5 p-3"
    >
      <div className="flex items-center gap-3 flex-wrap text-xs">
        <span className="text-foreground font-medium">{canonicalName}</span>
        <Badge variant="outline" className="text-[10px]">
          {wc.toLocaleString()} words
        </Badge>
        {citCount > 0 && (
          <Badge variant="outline" className="text-[10px] border-warning/30 text-warning bg-warning/5">
            {citCount} [CITATION NEEDED]
          </Badge>
        )}
        {inputCount > 0 && (
          <Badge variant="outline" className="text-[10px] border-info/30 text-info bg-info/5">
            {inputCount} [USER INPUT NEEDED]
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
