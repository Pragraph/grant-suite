"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  TrendingUp,
  DollarSign,
  GitMerge,
  SkipForward,
  Check,
  ChevronDown,
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
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Progress } from "@/components/ui/progress";
import { StepExecutor } from "@/components/phase/StepExecutor";
import { MethodWizard, type WizardStepConfig } from "@/components/phase/MethodWizard";
import { PhaseCompleteCTA } from "@/components/shared/PhaseCompleteCTA";

// ─── Phase 1 definition ────────────────────────────────────────────────────

const PHASE_1 = PHASE_DEFINITIONS[0];

// ─── Method definitions ─────────────────────────────────────────────────────

interface MethodDef {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const METHODS: MethodDef[] = [
  {
    id: "method1",
    name: "Gap-Based Discovery",
    description: "Identify underexplored gaps in the literature to find compelling research questions.",
    icon: Search,
    color: "text-phase-1",
  },
  {
    id: "method2",
    name: "Trend-Based Discovery",
    description: "Analyze publication trends and citation patterns to spot emerging frontiers.",
    icon: TrendingUp,
    color: "text-accent-400",
  },
  {
    id: "method3",
    name: "Funding-Landscape Discovery",
    description: "Map funded project data to align your research with active funder priorities.",
    icon: DollarSign,
    color: "text-success",
  },
  {
    id: "method4",
    name: "Convergence Synthesis",
    description: "Combine outputs from 2+ methods into a unified research direction.",
    icon: GitMerge,
    color: "text-warning",
  },
];

// ─── Step timeline status helpers ───────────────────────────────────────────

const stepStatusLabels: Record<StepStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "prompt-copied": "Prompt Copied",
  "output-pasted": "Output Pasted",
  complete: "Complete",
};

// ─── Wizard step configs for each method ────────────────────────────────────

function getMethod1Steps(): WizardStepConfig[] {
  return [
    {
      id: "m1-context",
      title: "Research Context",
      description: "Tell us about your research area so we can identify relevant gaps.",
      type: "context-form",
    },
    {
      id: "m1-prompt",
      title: "Gap Discovery Prompt",
      description: "We've compiled a prompt to identify research gaps. Copy it and paste into your AI tool.",
      type: "prompt-compile",
      templateId: "phase1.method1-gap-discovery",
    },
    {
      id: "m1-paste-initial",
      title: "Paste AI Output",
      description: "Paste the complete gap analysis output from your AI tool below.",
      type: "paste-output",
    },
    {
      id: "m1-scholar",
      title: "Google Scholar Search",
      description: "Use these search queries in Google Scholar Labs to validate and expand the identified gaps. Copy each query, run the search, and collect the most relevant gaps you find.",
      type: "external-tool",
      externalTool: {
        name: "Google Scholar",
        url: "https://scholar.google.com/",
        instructions: "Search for each query below. Look for systematic reviews, meta-analyses, and recent papers that explicitly mention research gaps, limitations, or future directions. Note any gaps that appear frequently across studies.",
      },
      generateQueries: (formValues) => {
        const d = formValues.discipline || "research";
        const a = formValues.areaOfInterest || "";
        return [
          `"research gap" "${d}" ${a} systematic review`,
          `"future research" "${d}" ${a} limitations`,
          `"underexplored" OR "understudied" "${d}" ${a}`,
          `"calls for research" "${d}" ${a}`,
          `${d} ${a} "remains unclear" OR "poorly understood"`,
        ];
      },
    },
    {
      id: "m1-gaps-collection",
      title: "Collect Research Gaps",
      description: "Enter the research gaps you've discovered from the AI analysis and Google Scholar search. List each gap on a separate line.",
      type: "paste-collection",
      formInputName: "collectedGaps",
      collectionLabel: "Research Gaps",
      collectionMinItems: 5,
    },
    {
      id: "m1-synthesis-prompt",
      title: "Synthesis Prompt",
      description: "We'll synthesize your collected gaps into refined research directions. Copy this prompt.",
      type: "prompt-compile",
      templateId: "phase1.method1-gap-synthesis",
    },
    {
      id: "m1-final",
      title: "Final Synthesis Output",
      description: "Paste the synthesis output from your AI tool. This will be saved as your Method 1 result.",
      type: "paste-output",
      templateId: "phase1.method1-gap-synthesis",
    },
  ];
}

function getMethod2Steps(): WizardStepConfig[] {
  return [
    {
      id: "m2-context",
      title: "Research Context",
      description: "Tell us about your research area so we can identify relevant trends.",
      type: "context-form",
    },
    {
      id: "m2-pop",
      title: "Publish or Perish Search",
      description: "Use these queries in Publish or Perish to collect bibliometric data. Copy results including h-index, citation counts, and publication counts.",
      type: "external-tool",
      externalTool: {
        name: "Publish or Perish",
        url: "https://harzing.com/resources/publish-or-perish",
        instructions: "Download and run Publish or Perish. Use Google Scholar or Scopus as the data source. For each query below, run the search and note: total papers, total citations, h-index, papers per year trend, and the top 5 most-cited papers. Copy all results.",
      },
      generateQueries: (formValues) => {
        const d = formValues.discipline || "research";
        const a = formValues.areaOfInterest || "";
        return [
          `${d} ${a}`,
          `${d} ${a} (2022-2025)`,
          `${d} ${a} emerging trends`,
          `${d} ${a} novel approach`,
          `${d} ${a} machine learning OR AI`,
        ];
      },
    },
    {
      id: "m2-paste-data",
      title: "Paste Trend Data",
      description: "Paste the bibliometric data you collected from Publish or Perish.",
      type: "paste-output",
      formInputName: "trendData",
    },
    {
      id: "m2-analysis-prompt",
      title: "Trend Analysis Prompt",
      description: "We'll analyze your trend data to identify research opportunities. Copy this prompt.",
      type: "prompt-compile",
      templateId: "phase1.method2-trend-discovery",
    },
    {
      id: "m2-final",
      title: "Paste Analysis Output",
      description: "Paste the trend analysis output from your AI tool. This will be saved as your Method 2 result.",
      type: "paste-output",
      templateId: "phase1.method2-trend-discovery",
    },
  ];
}

function getMethod3Steps(): WizardStepConfig[] {
  return [
    {
      id: "m3-context",
      title: "Research Context",
      description: "Tell us about your research area so we can explore funding opportunities.",
      type: "context-form",
    },
    {
      id: "m3-dimensions",
      title: "Dimensions.ai Search",
      description: "Search Dimensions.ai for funded projects in your area. Copy the results including project titles, funders, amounts, and abstracts.",
      type: "external-tool",
      externalTool: {
        name: "Dimensions.ai",
        url: "https://app.dimensions.ai/discover/grant",
        instructions: "Use the free version of Dimensions.ai. Filter by Grants, then search using the queries below. Sort by start date (newest first). For the top 15-20 results, copy: project title, funder, funding amount, start year, and a summary of the research focus.",
      },
      generateQueries: (formValues) => {
        const d = formValues.discipline || "research";
        const a = formValues.areaOfInterest || "";
        const country = formValues.country || "";
        return [
          `${d} ${a}`,
          `${d} ${a} ${country}`,
          `${d} ${a} innovation`,
          `${d} ${a} interdisciplinary`,
        ];
      },
    },
    {
      id: "m3-paste-data",
      title: "Paste Funding Data",
      description: "Paste the funded project data you collected from Dimensions.ai.",
      type: "paste-output",
      formInputName: "fundingData",
    },
    {
      id: "m3-analysis-prompt",
      title: "Landscape Analysis Prompt",
      description: "We'll analyze the funding landscape to identify opportunities. Copy this prompt.",
      type: "prompt-compile",
      templateId: "phase1.method3-funding-discovery",
    },
    {
      id: "m3-final",
      title: "Paste Analysis Output",
      description: "Paste the funding landscape analysis from your AI tool. This will be saved as your Method 3 result.",
      type: "paste-output",
      templateId: "phase1.method3-funding-discovery",
    },
  ];
}

function getMethod4Steps(): WizardStepConfig[] {
  // Method 4 is a simpler wizard: compile the convergence prompt with injected outputs, then paste
  return [
    {
      id: "m4-prompt",
      title: "Convergence Synthesis Prompt",
      description:
        "We've compiled a prompt that combines your discovery method outputs. Copy it and paste into your AI tool.",
      type: "prompt-compile",
      templateId: "phase1.method4-convergence",
    },
    {
      id: "m4-final",
      title: "Paste Convergence Output",
      description:
        "Paste the convergence synthesis from your AI tool. This will identify your top research directions.",
      type: "paste-output",
      templateId: "phase1.method4-convergence",
    },
  ];
}

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

// ─── Component ──────────────────────────────────────────────────────────────

export function Phase1Client({ projectId: projectIdProp }: { projectId: string }) {
  const params = useParams<{ id: string }>();
  const projectId = (params.id as string) ?? projectIdProp;
  const { setActiveProject, activeProject, _hasHydrated } = useProjectStore();
  const { progress, loadProgress, getPhaseCompletion } = useProgressStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [activeStep, setActiveStep] = useState<number | null>(1);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [completedMethods, setCompletedMethods] = useState<string[]>([]);

  // ── Initialize ────────────────────────────────────────────────────────────

  useEffect(() => {
    setActiveProject(projectId);
    loadProgress(projectId);
    loadDocuments(projectId);
    setBreadcrumbs([
      { label: "Projects", href: "/projects" },
      { label: activeProject?.title || "Project", href: `/projects/${projectId}` },
      { label: "Phase 1: Foundation & Discovery" },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Re-resolve after Zustand persist hydration
  useEffect(() => {
    if (_hasHydrated) setActiveProject(projectId);
  }, [_hasHydrated, projectId, setActiveProject]);

  // ── Load completed methods from documents ─────────────────────────────────

  useEffect(() => {
    const methodDocs = documents.filter(
      (d) => d.projectId === projectId && d.phase === 1 && d.step === 1,
    );
    const completed: string[] = [];
    if (methodDocs.some((d) => d.canonicalName === "Method1_Gap_Synthesis.md")) {
      completed.push("method1");
    }
    if (methodDocs.some((d) => d.canonicalName === "Method2_Trend_Discovery.md")) {
      completed.push("method2");
    }
    if (methodDocs.some((d) => d.canonicalName === "Method3_Funding_Discovery.md")) {
      completed.push("method3");
    }
    if (methodDocs.some((d) => d.canonicalName === "Method4_Convergence_Synthesis.md")) {
      completed.push("method4");
    }
    setCompletedMethods(completed);
  }, [documents, projectId]);

  // ── Phase progress ────────────────────────────────────────────────────────

  const phaseCompletion = getPhaseCompletion(1);
  const phase1Steps = PHASE_1.steps;

  const getStepStatus = useCallback(
    (stepNum: number): StepStatus => {
      return progress.phases[1]?.steps[stepNum] || "not-started";
    },
    [progress],
  );

  // ── Method 4 availability ─────────────────────────────────────────────────

  const method4Available = completedMethods.filter((m) => m !== "method4").length >= 2;

  // ── Collect method outputs for convergence ────────────────────────────────

  const getMethodOutputs = useCallback(() => {
    const outputs: Record<string, string> = {};
    for (const doc of documents) {
      if (doc.projectId !== projectId || doc.phase !== 1 || doc.step !== 1) continue;
      if (doc.canonicalName === "Method1_Gap_Synthesis.md") {
        outputs.method1_output = doc.content;
      }
      if (doc.canonicalName === "Method2_Trend_Discovery.md") {
        outputs.method2_output = doc.content;
      }
      if (doc.canonicalName === "Method3_Funding_Discovery.md") {
        outputs.method3_output = doc.content;
      }
    }
    return outputs;
  }, [documents, projectId]);

  // ── Step document summaries ───────────────────────────────────────────────

  const getStepDocuments = useCallback(
    (stepNum: number) => {
      return documents.filter(
        (d) => d.projectId === projectId && d.phase === 1 && d.step === stepNum && d.isCurrent,
      );
    },
    [documents, projectId],
  );

  // ── Step unlocking logic ──────────────────────────────────────────────────

  const isStepUnlocked = useCallback(
    (stepNum: number): boolean => {
      if (stepNum === 1) return true;
      // Step 2 unlocks after Step 1 has at least one method done (or was skipped)
      if (stepNum === 2) {
        const step1Status = getStepStatus(1);
        return completedMethods.length > 0 || step1Status !== "not-started";
      }
      // Step 3 unlocks after Step 2 is complete (or skipped)
      if (stepNum === 3) {
        const step2Status = getStepStatus(2);
        const step1Status = getStepStatus(1);
        return step2Status !== "not-started" || completedMethods.length > 0 || step1Status !== "not-started";
      }
      return true;
    },
    [getStepStatus, completedMethods],
  );

  // ── Method wizard config ──────────────────────────────────────────────────

  const getMethodSteps = (methodId: string): WizardStepConfig[] => {
    switch (methodId) {
      case "method1":
        return getMethod1Steps();
      case "method2":
        return getMethod2Steps();
      case "method3":
        return getMethod3Steps();
      case "method4":
        return getMethod4Steps();
      default:
        return [];
    }
  };

  const getMethodName = (methodId: string): string => {
    return METHODS.find((m) => m.id === methodId)?.name || methodId;
  };

  // ── Skip handlers ─────────────────────────────────────────────────────────

  const handleSkipToStep = (stepNum: number) => {
    setActiveStep(stepNum);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div className="space-y-8" {...fadeInUp}>
      {/* ── Phase Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <PhaseIcon phase={1} size="lg" active />
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {PHASE_1.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover your research direction through systematic exploration of gaps, trends, and funding landscapes.
          </p>
        </div>
      </div>

      {/* ── Progress Bar ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Phase Progress</span>
          <span>
            {phase1Steps.filter((s) => getStepStatus(s.step) === "complete").length} of{" "}
            {phase1Steps.length} steps
          </span>
        </div>
        <Progress value={phaseCompletion} className="h-1.5" />
      </div>

      {/* ── Step Timeline ──────────────────────────────────────────────── */}
      <div className="space-y-0">
        {phase1Steps.map((stepDef, i) => {
          const status = getStepStatus(stepDef.step);
          const isActive = activeStep === stepDef.step;
          const isComplete = status === "complete";
          const isCurrent = status !== "not-started" && status !== "complete";
          const stepDocs = getStepDocuments(stepDef.step);
          const unlocked = isStepUnlocked(stepDef.step);

          return (
            <div key={stepDef.step} className="relative">
              {/* Timeline line */}
              {i < phase1Steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-3.75 top-9 w-0.5 h-[calc(100%-20px)]",
                    isComplete ? "bg-phase-1" : "bg-border/50",
                  )}
                />
              )}

              {/* Step header (clickable) */}
              <button
                onClick={() => setActiveStep(isActive ? null : stepDef.step)}
                className={cn(
                  "flex w-full items-center gap-3 py-3 text-left transition-colors",
                  "hover:bg-muted/50 rounded-lg px-2 -mx-2",
                )}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isComplete
                      ? "border-phase-1 bg-phase-1 text-white"
                      : isCurrent
                        ? "border-phase-1 bg-transparent text-phase-1"
                        : unlocked
                          ? "border-border/50 bg-transparent text-muted-foreground/50"
                          : "border-border/30 bg-transparent text-muted-foreground/30",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{stepDef.step}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isComplete
                        ? "text-foreground"
                        : isCurrent
                          ? "text-foreground"
                          : unlocked
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50",
                    )}
                  >
                    {stepDef.name}
                    {stepDef.type === "multi-method" && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Multi-method
                      </Badge>
                    )}
                  </p>
                  {isComplete && stepDocs.length > 0 && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                      {stepDocs.map((d) => d.canonicalName).join(", ")} —{" "}
                      {stepDocs.reduce((sum, d) => sum + d.wordCount, 0).toLocaleString()} words
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {status !== "not-started" && (
                    <Badge
                      variant={isComplete ? "default" : "outline"}
                      className="text-[10px]"
                    >
                      {stepStatusLabels[status]}
                    </Badge>
                  )}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isActive && "rotate-180",
                    )}
                  />
                </div>
              </button>

              {/* Step content (expanded) */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    variants={stepExpandVariants}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="ml-10 mb-4"
                  >
                    <div className="pt-2">
                      {stepDef.step === 1 ? (
                        // ── Step 1: Method selector / wizard ───────────
                        activeMethod ? (
                          <MethodWizard
                            methodId={activeMethod}
                            methodName={getMethodName(activeMethod)}
                            projectId={projectId}
                            steps={getMethodSteps(activeMethod)}
                            initialFormValues={activeMethod === "method4" ? getMethodOutputs() : undefined}
                            onComplete={() => {
                              setActiveMethod(null);
                              loadDocuments(projectId);
                            }}
                            onCancel={() => setActiveMethod(null)}
                          />
                        ) : (
                          <div className="space-y-4">
                            {/* Completed methods summary */}
                            {completedMethods.length > 0 && (
                              <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                                <p className="text-xs font-medium text-success mb-1">
                                  Completed Methods
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {completedMethods.map((mId) => {
                                    const method = METHODS.find((m) => m.id === mId);
                                    return (
                                      <Badge key={mId} className="text-[10px]">
                                        <Check className="h-3 w-3 mr-1" />
                                        {method?.name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Method cards */}
                            <div className="grid gap-3 sm:grid-cols-2">
                              {METHODS.map((method) => {
                                const isCompleted = completedMethods.includes(method.id);
                                const isLocked = method.id === "method4" && !method4Available;

                                return (
                                  <Card
                                    key={method.id}
                                    className={cn(
                                      "cursor-pointer transition-all hover:ring-2 hover:ring-phase-1/30",
                                      isCompleted && "ring-1 ring-success/30",
                                      isLocked && "opacity-50 cursor-not-allowed hover:ring-0",
                                    )}
                                    onClick={() => {
                                      if (isLocked) return;
                                      setActiveMethod(method.id);
                                    }}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <div
                                          className={cn(
                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted",
                                            method.color,
                                          )}
                                        >
                                          <method.icon className="h-4.5 w-4.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-foreground">
                                              {method.name}
                                            </p>
                                            {isCompleted && (
                                              <Check className="h-3.5 w-3.5 text-success" />
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {method.description}
                                          </p>
                                          {isLocked && (
                                            <p className="text-[10px] text-warning mt-1">
                                              Requires 2+ completed methods
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>

                            {/* Skip option */}
                            <button
                              onClick={() => handleSkipToStep(2)}
                              className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border/50 p-3 text-left transition-colors hover:bg-muted/50"
                            >
                              <SkipForward className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  I already have a research topic
                                </p>
                                <p className="text-xs text-muted-foreground/60">
                                  Skip discovery and go directly to Step 2: Grant Matching
                                </p>
                              </div>
                            </button>
                          </div>
                        )
                      ) : stepDef.step === 2 ? (
                        // ── Step 2: Grant Matching (uses StepExecutor) ──
                        <StepExecutor
                          templateId="phase1.grant-matching"
                          projectId={projectId}
                          phase={1}
                          step={2}
                          title="Grant Matching"
                          description="Identify and rank grant opportunities that best match your research profile and topic."
                          additionalFields={[
                            {
                              name: "researchTopic",
                              label: "Research Topic / Title",
                              type: "text",
                              placeholder: activeProject?.title || "e.g., Machine Learning for Drug Discovery",
                            },
                            {
                              name: "discipline",
                              label: "Discipline",
                              type: "text",
                              placeholder: activeProject?.discipline || "e.g., Computer Science",
                            },
                            {
                              name: "country",
                              label: "Country",
                              type: "text",
                              placeholder: activeProject?.country || "e.g., United States",
                            },
                            {
                              name: "careerStage",
                              label: "Career Stage",
                              type: "text",
                              placeholder: activeProject?.careerStage || "e.g., Early Career Researcher",
                            },
                            {
                              name: "budgetRange",
                              label: "Funding Range",
                              type: "select",
                              options: [
                                { label: "Less than $50K", value: "<$50K" },
                                { label: "$50K - $200K", value: "$50K-$200K" },
                                { label: "$200K - $500K", value: "$200K-$500K" },
                                { label: "$500K+", value: "$500K+" },
                              ],
                            },
                            {
                              name: "keywords",
                              label: "Keywords (comma-separated)",
                              type: "textarea",
                              placeholder: "e.g., deep learning, protein folding, computational biology",
                            },
                          ]}
                          onComplete={() => {
                            loadDocuments(projectId);
                            setActiveStep(3);
                          }}
                        />
                      ) : stepDef.step === 3 ? (
                        // ── Step 3: Grant Intelligence (uses StepExecutor) ──
                        <StepExecutor
                          templateId="phase1.grant-intelligence"
                          projectId={projectId}
                          phase={1}
                          step={3}
                          title="Grant Intelligence Gathering"
                          description="Analyze grant guidelines to produce the foundational Grant_Intelligence.md document. This is the most important step in Phase 1 — every subsequent phase depends on it."
                          additionalFields={[
                            {
                              name: "grantName",
                              label: "Grant Program Name",
                              type: "text",
                              placeholder: "e.g., ERC Starting Grant",
                              required: true,
                            },
                            {
                              name: "grant_guidelines_text",
                              label: "Paste Grant Guidelines",
                              type: "file-upload-text",
                              placeholder: "Paste the full grant guidelines text here (from PDF or website)...",
                            },
                            {
                              name: "grant_url",
                              label: "Grant URL",
                              type: "text",
                              placeholder: "e.g., https://erc.europa.eu/apply-grant/starting-grant",
                            },
                            {
                              name: "evaluation_criteria_text",
                              label: "Paste Evaluation Criteria",
                              type: "file-upload-text",
                              placeholder: "Paste specific evaluation criteria text here...",
                            },
                            {
                              name: "application_form_text",
                              label: "Paste Application Form Details",
                              type: "file-upload-text",
                              placeholder: "Paste application form or template requirements here...",
                            },
                          ]}
                          onComplete={() => {
                            loadDocuments(projectId);
                          }}
                        />
                      ) : null}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <PhaseCompleteCTA projectId={projectId} phase={1} phaseCompletion={phaseCompletion} />
    </motion.div>
  );
}
