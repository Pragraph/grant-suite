"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  TrendingUp,
  GitMerge,
  SkipForward,
  Check,
  ChevronDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { generateScholarLabsPrompt, getScholarLabsCharInfo, SCHOLAR_LABS_URL } from "@/lib/scholar-labs";
import { storage } from "@/lib/storage";
import { getProjectIdFromUrl } from "@/lib/utils";
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
    // Step 1: Research Context (simplified — no country/career stage shown)
    {
      id: "m1-context",
      title: "Research Context",
      description: "Tell us about your research area so we can identify emerging topics.",
      type: "context-form",
    },
    // Step 2: Topic Discovery Prompt (produces table of emerging areas)
    {
      id: "m1-topic-prompt",
      title: "Topic Discovery Prompt",
      description: "We've compiled a prompt to identify emerging research topics. Copy it and paste into your AI tool (ChatGPT, Claude, Gemini). Use a thinking/reasoning model for best results.",
      type: "prompt-compile",
      templateId: "phase1.method1-gap-discovery",
    },
    // Step 3: Select topic + Scholar Labs search
    {
      id: "m1-scholar-labs",
      title: "Scholar Labs Search",
      description: "Copy exactly from the 'Emerging Keyword/Topic' or 'Recommended Topic' column in the AI output above.",
      type: "external-tool",
      formInputName: "selectedTopic",
      collectionLabel: "Your Selected Topic",
      collectionMinItems: 1,
      externalTool: {
        name: "Google Scholar Labs",
        url: SCHOLAR_LABS_URL,
        instructions: "1. Copy the generated search prompt below.\n2. Open Scholar Labs (AI-powered Google Scholar).\n3. Paste the prompt and search.\n4. Scroll through ALL results — look for bullet points describing research gaps, future research recommendations, and limitations.\n5. For each relevant gap, ALSO copy the citation (click 'Cite' → select APA format).\n6. Collect 5+ gaps with their APA citations to paste in the next step.",
      },
      generateQueries: (formValues) => {
        const topic = formValues.selectedTopic || "";
        const discipline = formValues.discipline || "";
        if (!topic.trim()) return [];
        const prompt = generateScholarLabsPrompt(topic, discipline);
        const charInfo = getScholarLabsCharInfo(prompt);
        return [`${prompt}  [${charInfo.length}/${charInfo.max} chars]`];
      },
    },
    // Step 5: Collect research gaps WITH citations
    {
      id: "m1-gaps-collection",
      title: "Collect Research Gaps with Citations",
      description: "Add research gaps from Scholar Labs. For each gap, paste the research recommendation in the first field and the APA citation (click Cite → APA in Scholar Labs) in the second field.",
      type: "gap-citation-collection",
      formInputName: "collectedGapsWithCitations",
      collectionLabel: "Research Gaps with APA Citations",
      collectionMinItems: 5,
    },
    // Step 6: Synthesis Prompt
    {
      id: "m1-synthesis-prompt",
      title: "Gap Synthesis Prompt",
      description: "We'll synthesise your collected gaps and citations into refined research directions. Copy this prompt.",
      type: "prompt-compile",
      templateId: "phase1.method1-gap-synthesis",
    },
    // Step 7: Paste final synthesis
    {
      id: "m1-final",
      title: "Final Synthesis Output",
      description: "Paste the synthesis output from your AI tool. This will be saved as your Gap-Based Discovery result.",
      type: "paste-output",
      templateId: "phase1.method1-gap-synthesis",
    },
  ];
}

function getMethod2Steps(): WizardStepConfig[] {
  const currentYear = new Date().getFullYear();
  return [
    // ── Step 1: Research Context ────────────────────────────────────
    {
      id: "m2-context",
      title: "Research Context",
      description: "Tell us about your research area so we can identify emerging trends.",
      type: "context-form",
    },
    // ── Step 2: Topic Discovery Prompt ──────────────────────────────
    {
      id: "m2-topic-prompt",
      title: "Topic Discovery Prompt",
      description:
        "We've compiled a prompt to identify emerging research topics with citation momentum. Copy it and paste into your AI tool (ChatGPT, Claude, Gemini). Use a thinking/reasoning model for best results.",
      type: "prompt-compile",
      templateId: "phase1.method2-topic-discovery",
    },
    // ── Step 3: Select Topic + Copy Search String Prompt ────────────
    // User enters topic. Prompt is hidden behind a copy button.
    // User copies it and pastes into the SAME AI chat from Step 2.
    {
      id: "m2-select-and-search",
      title: "Select Topic & Get Search Strings",
      description:
        "Paste your selected topic below. Then click the button to copy the search strings prompt and paste it into the SAME AI chat you used in the previous step.",
      type: "external-tool",
      formInputName: "selectedTrendTopic",
      collectionLabel: "Your Selected Topic",
      collectionMinItems: 1,
      hideQueryText: true,
      generateQueries: (formValues) => {
        const topic = formValues.selectedTrendTopic || "";
        const discipline = formValues.discipline || "";
        const area = formValues.areaOfInterest || "";
        const researchType = formValues.researchType || "";
        if (!topic.trim()) return [];

        return [`Based on the user's selected topic: "${topic}"

Context:
- Field/Discipline: ${discipline}
- Area of Interest: ${area}
- Research Type: ${researchType}

TASK: Generate optimized search strings for bibliometric validation. The strings will be used in BOTH Publish or Perish desktop software (Google Scholar) and Citation Impact Analyzer web tool (Semantic Scholar).

CRITICAL RULES:
1. Generate TWO versions:
   a) FULL VERSION (for Publish or Perish / Google Scholar) — can handle longer Boolean queries with OR/AND operators
   b) SIMPLE VERSION (for Citation Impact Analyzer / Semantic Scholar) — MUST be short and simple, under 200 characters total, minimal Boolean operators. Semantic Scholar does not support lengthy Boolean queries.
2. Intelligently adapt scope: if the topic is niche with likely few publications, use BROADER terms to capture more papers. If well-established, use more precise terms.
3. Do NOT include review exclusion operators (no -"review", -"meta-analysis", etc.) — users will screen results manually.
4. Title Words: maximum ONE AND operator. OR-only chains preferred.
5. Keywords: OR-only chains for broad context filtering.
6. Each string must be a SINGLE LINE with no line breaks.
7. Multi-word phrases in double quotes. Single-word abbreviations without quotes.

OUTPUT FORMAT (follow this structure exactly):

## SEARCH STRINGS: ${topic}

### FOR PUBLISH OR PERISH (Google Scholar)
| Field | Value (copy exactly) |
|-------|---------------------|
| Title Words | [Boolean string with OR/AND operators] |
| Keywords | [OR-only context string] |

### FOR CITATION IMPACT ANALYZER (Semantic Scholar)
| Field | Value (copy exactly) |
|-------|---------------------|
| Title Words | [short simple string, under 200 chars] |
| Keywords | [short string or leave empty] |

### SEARCH SETTINGS
| Setting | Recommendation |
|---------|---------------|
| Years | Start with ${currentYear - 2}–${currentYear}. If too few results, expand to ${currentYear - 4}–${currentYear}, or set both to 0 for all years. |
| Max results | 200 to 500 |
| Sort by | Citations per year (Per Year) |`];
      },
    },
    // ── Step 4: Bibliometric Search ─────────────────────────────────
    // Dual-path instructions in separate cards using --- separator.
    {
      id: "m2-bibliometric-search",
      title: "Run Bibliometric Search",
      description:
        "Use the search strings from the AI output to find relevant papers. Choose one of the two options below.",
      type: "external-tool",
      externalTool: {
        name: "Citation Impact Analyzer",
        url: "https://citationimpact.online/",
        instructions: `OPTION A — Citation Impact Analyzer (Web, Recommended)\n\n1. Click "Open Citation Impact Analyzer" above.\n2. Paste the SIMPLE VERSION search strings from the AI output into the Title Words field.\n3. Set year range: start with the last 3 years (e.g., ${new Date().getFullYear() - 2}–${new Date().getFullYear()}).\n4. If too few results, widen to 5 years or leave both year fields empty to search all.\n5. Results are automatically sorted by Per Year (citation impact).\n6. Tick the checkboxes next to relevant papers (aim for 5–15 papers).\n7. Click the "Copy Excel" button at the top right.\n8. Proceed to the next step and paste your results.\n---\nOPTION B — Publish or Perish (Desktop Software)\n\n1. Download and install from harzing.com/resources/publish-or-perish (free).\n2. Open the software and select "Google Scholar" as the data source.\n3. Paste the FULL VERSION search strings into the Title Words and Keywords fields.\n4. Set year range: start with the last 3 years. Widen if too few results.\n5. Set max results to 200.\n6. Click Search, then sort results by the "Per Year" column.\n7. Hold Cmd (Mac) or Ctrl (Windows) and click to select relevant papers.\n8. Right-click your selection → Copy Results → Results as APA Reference.\n9. Proceed to the next step and paste your results.`,
      },
    },
    // ── Step 5: Paste Search Results ────────────────────────────────
    {
      id: "m2-paste-results",
      title: "Paste Search Results",
      description:
        "Paste the results you copied from Publish or Perish (APA references) or Citation Impact Analyzer (Excel data). These will feed into the synthesis prompt.",
      type: "paste-collection",
      formInputName: "trendSearchResults",
      collectionLabel: "Search results (APA references or Excel data)",
      collectionMinItems: 3,
    },
    // ── Step 6: Trend Synthesis Prompt ──────────────────────────────
    {
      id: "m2-synthesis-prompt",
      title: "Trend Synthesis Prompt",
      description:
        "We'll synthesise your collected publications into refined research directions. Copy this prompt and paste into your AI tool.",
      type: "prompt-compile",
      templateId: "phase1.method2-trend-discovery",
    },
    // ── Step 7: Final Synthesis Output ──────────────────────────────
    {
      id: "m2-final",
      title: "Final Synthesis Output",
      description:
        "Paste the trend synthesis output from your AI tool. This will be saved as your Trend-Based Discovery result.",
      type: "paste-output",
      templateId: "phase1.method2-trend-discovery",
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

export function Phase1Client({ projectId: _pid }: { projectId: string }) {
  void _pid; // extracted from URL instead
  const [projectId] = useState(() => getProjectIdFromUrl());
  const { setActiveProject, activeProject } = useProjectStore();
  const { progress, loadProgress, getPhaseCompletion } = useProgressStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [activeStep, setActiveStep] = useState<number | null>(1);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);

  // ── Initialize ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!projectId) return;
    const proj = storage.getProject(projectId);
    setActiveProject(projectId);
    loadProgress(projectId);
    loadDocuments(projectId);
    setBreadcrumbs([
      { label: "Projects", href: "/projects" },
      { label: proj?.title || "Project", href: `/projects/${projectId}` },
      { label: "Phase 1: Foundation & Discovery" },
    ]);
  }, [projectId, setActiveProject, loadProgress, loadDocuments, setBreadcrumbs]);


  // ── Load completed methods from documents ─────────────────────────────────

  const completedMethods = useMemo(() => {
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
    if (methodDocs.some((d) => d.canonicalName === "Method4_Convergence_Synthesis.md")) {
      completed.push("method4");
    }
    return completed;
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
          <h1 className="text-2xl font-bold text-gray-900">
            {PHASE_1.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Discover your research direction through systematic exploration of gaps, trends, and emerging frontiers.
          </p>
        </div>
      </div>

      {/* ── Progress Bar ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">Phase Progress</span>
          <span className="text-sm text-gray-400">
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
                    isComplete ? "bg-phase-1" : "bg-gray-200",
                  )}
                />
              )}

              {/* Step header (clickable) */}
              <button
                onClick={() => setActiveStep(isActive ? null : stepDef.step)}
                className={cn(
                  "flex w-full items-center gap-3 py-3 text-left transition-colors",
                  "hover:bg-gray-50 rounded-xl px-2 -mx-2",
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
                          ? "border-gray-200 bg-transparent text-gray-400"
                          : "border-gray-200 bg-transparent text-gray-300",
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
                      "text-sm font-semibold",
                      isComplete
                        ? "text-gray-900"
                        : isCurrent
                          ? "text-gray-900"
                          : unlocked
                            ? "text-gray-600"
                            : "text-gray-400",
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
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
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
                      "h-4 w-4 text-gray-400 transition-transform",
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
                              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                <p className="text-xs font-medium text-emerald-600 mb-1">
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
                                      "cursor-pointer transition-all hover:ring-2 hover:ring-phase-1/30 hover:border-[#4F7DF3]/40 hover:shadow-sm",
                                      isCompleted && "ring-1 ring-emerald-200",
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
                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100",
                                            method.color,
                                          )}
                                        >
                                          <method.icon className="h-4.5 w-4.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900">
                                              {method.name}
                                            </p>
                                            {isCompleted && (
                                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            {method.description}
                                          </p>
                                          {isLocked && (
                                            <p className="text-[10px] text-red-500 mt-1">
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
                              className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
                            >
                              <SkipForward className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-500">
                                  I already have a research topic
                                </p>
                                <p className="text-xs text-gray-400">
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
                              name: "grantScheme",
                              label: "Grant Scheme",
                              type: "text",
                              placeholder: activeProject?.grantScheme || "e.g., FRGS",
                            },
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
                              placeholder: activeProject?.country || "e.g., Malaysia",
                            },
                            {
                              name: "careerStage",
                              label: "Career Stage",
                              type: "text",
                              placeholder: activeProject?.careerStage || "e.g., Associate Professor",
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
                              name: "grantScheme",
                              label: "Grant Scheme",
                              type: "text",
                              placeholder: activeProject?.grantScheme || "e.g., FRGS",
                            },
                            {
                              name: "grantName",
                              label: "Grant Program Name",
                              type: "text",
                              placeholder: activeProject?.grantScheme ? `e.g., ${activeProject.grantScheme}` : "e.g., FRGS, ERC Starting Grant",
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
