"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  TrendingUp,
  GitMerge,
  PenLine,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  FileCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { generateScholarLabsPrompt, SCHOLAR_LABS_URL } from "@/lib/scholar-labs";
import { storage } from "@/lib/storage";
import { getProjectIdFromUrl } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { useProgressStore } from "@/stores/progress-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { PHASE_DEFINITIONS, GRANT_SCHEME_MAP } from "@/lib/constants";
import type { StepStatus } from "@/lib/types";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Progress } from "@/components/ui/progress";
import { StepExecutor } from "@/components/phase/StepExecutor";
import { QuickFillGI } from "@/components/shared/QuickFillGI";
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
    description: "Combine Gap-Based and Trend-Based Discovery outputs into a unified research direction.",
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
        return [generateScholarLabsPrompt(topic, discipline)];
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

function getMethod3Steps(): WizardStepConfig[] {
  return [
    // Step 1: Research Context (same as Method 1/2)
    {
      id: "m3-context",
      title: "Research Context",
      description: "Tell us about your research area.",
      type: "context-form",
    },
    // Step 2: Topic Brief Form (new step type)
    {
      id: "m3-topic-input",
      title: "Your Research Topic",
      description:
        "Provide the details of your existing research topic. The more specific you are, the better the analysis will be.",
      type: "topic-brief-form",
    },
    // Step 3: Direction Brief Prompt
    {
      id: "m3-brief-prompt",
      title: "Research Direction Brief Prompt",
      description:
        "We've compiled a prompt to analyze your topic and produce a structured Research Direction Brief. Copy it and paste into your AI tool (ChatGPT, Claude, Gemini). Use a thinking/reasoning model for best results.",
      type: "prompt-compile",
      templateId: "phase1.method3-topic-brief",
    },
    // Step 4: Paste output
    {
      id: "m3-final",
      title: "Paste Direction Brief Output",
      description:
        "Paste the Research Direction Brief from your AI tool. This will be saved as your research direction document.",
      type: "paste-output",
      templateId: "phase1.method3-topic-brief",
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

// ─── Next Step CTA ──────────────────────────────────────────────────────────

interface NextStepCTAProps {
  projectId: string;
  currentStep: number;
  phase1Steps: typeof PHASE_1.steps;
}

function NextStepCTA({ projectId, currentStep, phase1Steps }: NextStepCTAProps) {
  void projectId; // available for future use
  const nextStepDef = phase1Steps.find((s) => s.step > currentStep);
  if (!nextStepDef) return null;

  const handleNavigate = () => {
    window.dispatchEvent(
      new CustomEvent("grant-suite:expand-step", { detail: { step: nextStepDef.step } })
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mt-4"
    >
      <button
        onClick={handleNavigate}
        className={cn(
          "group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
          "border-[#4F7DF3]/30 bg-gradient-to-r from-[#F0F4FF] to-[#F8FAFF]",
          "dark:from-[#4F7DF3]/10 dark:to-[#4F7DF3]/5 dark:border-[#4F7DF3]/20",
          "hover:border-[#4F7DF3]/50 hover:shadow-md hover:shadow-[#4F7DF3]/10",
          "active:scale-[0.995]",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4F7DF3]/10 dark:bg-[#4F7DF3]/20 text-[#4F7DF3] transition-colors group-hover:bg-[#4F7DF3]/20">
          <ArrowRight className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Continue to {nextStepDef.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Proceed to the next step in Phase 1
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Phase1Client({ projectId: _pid }: { projectId: string }) {
  void _pid; // extracted from URL instead
  const [projectId] = useState(() => getProjectIdFromUrl());
  const { setActiveProject, activeProject } = useProjectStore();
  const { progress, loadProgress, getPhaseCompletion, updateStepStatus } = useProgressStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [activeStep, setActiveStep] = useState<number | null>(1);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [discoveryExpanded, setDiscoveryExpanded] = useState<boolean>(
    () => activeProject?.journeyMode !== "directed"
  );

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

  // ── Listen for next-step navigation events ────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ step: number }>).detail;
      setActiveStep(detail.step);
      setTimeout(() => {
        const el = document.getElementById(`phase1-step-${detail.step}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    };
    window.addEventListener("grant-suite:expand-step", handler);
    return () => window.removeEventListener("grant-suite:expand-step", handler);
  }, []);

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
    if (methodDocs.some((d) => d.canonicalName === "Method3_Research_Direction_Brief.md")) {
      completed.push("method3");
    }
    if (methodDocs.some((d) => d.canonicalName === "Method4_Convergence_Synthesis.md")) {
      completed.push("method4");
    }
    return completed;
  }, [documents, projectId]);

  const hasDirectionBrief = completedMethods.includes("method3");

  // ── Auto-open Method 3 for "directed" journey mode ────────────────────────
  // Runs as a synchronous state derivation during render (not in an effect)
  // to avoid the react-hooks/set-state-in-effect lint rule.

  if (
    activeProject?.journeyMode === "directed" &&
    !completedMethods.includes("method3") &&
    activeMethod === null
  ) {
    setActiveMethod("method3");
  }

  // ── Phase progress ────────────────────────────────────────────────────────

  const phaseCompletion = getPhaseCompletion(1);

  // ── Conditionally filter Phase 1 steps ──────────────────────────────────
  const phase1Steps = useMemo(() => {
    const scheme = activeProject?.grantScheme;
    const needsGrantMatching = !scheme || scheme === "Other" || scheme === "Undecided";
    if (needsGrantMatching) {
      return PHASE_1.steps;
    }
    // Hide Step 2 (Grant Matching) when user already has a specific scheme
    return PHASE_1.steps.filter(s => s.step !== 2);
  }, [activeProject?.grantScheme]);

  const getStepStatus = useCallback(
    (stepNum: number): StepStatus => {
      return progress.phases[1]?.steps[stepNum] || "not-started";
    },
    [progress],
  );

  // ── Method 4 availability ─────────────────────────────────────────────────

  const method4Available = completedMethods.includes("method1") && completedMethods.includes("method2");

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

  // ── Collect discovery outputs for Direction Brief context ──────────────

  const getDiscoveryOutputsForBrief = useCallback(() => {
    const outputs: Record<string, string> = {};
    for (const doc of documents) {
      if (doc.projectId !== projectId || doc.phase !== 1 || doc.step !== 1) continue;
      if (doc.canonicalName === "Method1_Gap_Synthesis.md") {
        outputs.method1_output = doc.content;
      }
      if (doc.canonicalName === "Method2_Trend_Discovery.md") {
        outputs.method2_output = doc.content;
      }
      if (doc.canonicalName === "Method4_Convergence_Synthesis.md") {
        outputs.method4_output = doc.content;
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
      // Step 3 unlocks after Step 2 is complete (or skipped), or if Step 2 is hidden
      if (stepNum === 3) {
        const scheme = activeProject?.grantScheme;
        const grantMatchingHidden = scheme && scheme !== "Other" && scheme !== "Undecided";
        if (grantMatchingHidden) {
          // Step 2 is hidden, so step 3 unlocks based on step 1
          return completedMethods.length > 0 || getStepStatus(1) !== "not-started";
        }
        const step2Status = getStepStatus(2);
        const step1Status = getStepStatus(1);
        return step2Status !== "not-started" || completedMethods.length > 0 || step1Status !== "not-started";
      }
      return true;
    },
    [getStepStatus, completedMethods, activeProject?.grantScheme],
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
    if (methodId === "method3") return "Research Direction Brief";
    return METHODS.find((m) => m.id === methodId)?.name || methodId;
  };



  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div className="space-y-8" {...fadeInUp}>
      {/* ── Phase Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <PhaseIcon phase={1} size="lg" active />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {PHASE_1.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover your research direction through systematic exploration of gaps, trends, and emerging frontiers.
          </p>
        </div>
      </div>

      {/* ── Progress Bar ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">Phase Progress</span>
          <span className="text-sm text-muted-foreground/70">
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
            <div key={stepDef.step} id={`phase1-step-${stepDef.step}`} className="relative">
              {/* Timeline line */}
              {i < phase1Steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-3.75 top-9 w-0.5 h-[calc(100%-20px)]",
                    isComplete ? "bg-phase-1" : "bg-border",
                  )}
                />
              )}

              {/* Step header (clickable) */}
              <button
                onClick={() => setActiveStep(isActive ? null : stepDef.step)}
                className={cn(
                  "flex w-full items-center gap-3 py-3 text-left transition-colors",
                  "hover:bg-muted/50 rounded-xl px-2 -mx-2",
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
                          ? "border-border bg-transparent text-muted-foreground"
                          : "border-border bg-transparent text-muted-foreground/50",
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
                        ? "text-foreground"
                        : isCurrent
                          ? "text-foreground"
                          : unlocked
                            ? "text-foreground/70"
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
                    <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
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
                        // ── Step 1: Discovery + Direction Brief ─────────
                        activeMethod ? (
                          <MethodWizard
                            methodId={activeMethod}
                            methodName={getMethodName(activeMethod)}
                            projectId={projectId}
                            steps={getMethodSteps(activeMethod)}
                            initialFormValues={
                              activeMethod === "method4"
                                ? getMethodOutputs()
                                : activeMethod === "method3"
                                  ? getDiscoveryOutputsForBrief()
                                  : undefined
                            }
                            onComplete={() => {
                              if (activeMethod === "method3") {
                                updateStepStatus(projectId, 1, 1, "complete");
                              }
                              setActiveMethod(null);
                              loadDocuments(projectId);
                            }}
                            onCancel={() => setActiveMethod(null)}
                          />
                        ) : (
                          <div className="space-y-6">
                            {/* ── Section A: Discovery Methods (Optional) ────────── */}
                            <div className="space-y-3">
                              <button
                                onClick={() => setDiscoveryExpanded(!discoveryExpanded)}
                                className="flex w-full items-center justify-between text-left group"
                              >
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-foreground">
                                    Explore Research Directions
                                  </h3>
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                                    Optional
                                  </Badge>
                                </div>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",
                                    discoveryExpanded && "rotate-180",
                                  )}
                                />
                              </button>
                              <p className="text-xs text-muted-foreground">
                                Use these tools to discover and validate potential research directions before formalizing below.
                              </p>

                              <AnimatePresence>
                                {discoveryExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                    className="overflow-hidden"
                                  >
                                    <div className="space-y-3 pt-1">
                                      {/* Completed methods summary */}
                                      {completedMethods.filter(m => m !== "method3").length > 0 && (
                                        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3">
                                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                                            Completed Discovery Methods
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {completedMethods.filter(m => m !== "method3").map((mId) => {
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

                                      {/* Discovery method cards */}
                                      <div className="grid gap-3 sm:grid-cols-2">
                                        {METHODS.map((method) => {
                                          const isCompleted = completedMethods.includes(method.id);
                                          const isLocked = method.id === "method4" && !method4Available;

                                          return (
                                            <Card
                                              key={method.id}
                                              className={cn(
                                                "cursor-pointer transition-all hover:ring-2 hover:ring-phase-1/30 hover:border-[#4F7DF3]/40 hover:shadow-sm",
                                                isCompleted && "ring-1 ring-emerald-200 dark:ring-emerald-800",
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
                                                      <p className="text-sm font-semibold text-foreground">
                                                        {method.name}
                                                      </p>
                                                      {isCompleted && (
                                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                      {method.description}
                                                    </p>
                                                    {isLocked && (
                                                      <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">
                                                        Only needed if you complete both Gap-Based and Trend-Based Discovery
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* ── Divider ──────────────────────────────────────────── */}
                            <div className="relative py-1">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                              </div>
                            </div>

                            {/* ── Section B: Research Direction Brief (Required) ──── */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-foreground">
                                  Define Your Research Direction
                                </h3>
                                <Badge
                                  variant={hasDirectionBrief ? "default" : "outline"}
                                  className={cn(
                                    "text-[10px]",
                                    hasDirectionBrief
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                      : "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700",
                                  )}
                                >
                                  {hasDirectionBrief ? "Complete" : "Required"}
                                </Badge>
                              </div>

                              <p className="text-xs text-muted-foreground">
                                {completedMethods.filter(m => m !== "method3").length > 0
                                  ? "Based on your discovery results, formalize the direction you want to pursue. This document guides every downstream phase."
                                  : "Formalize your research topic, objectives, questions, and gap justification. This document guides every downstream phase."
                                }
                              </p>

                              <button
                                onClick={() => setActiveMethod("method3")}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                                  hasDirectionBrief
                                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:ring-2 hover:ring-emerald-300/50"
                                    : "border-[#4F7DF3]/40 bg-[#F0F4FF] dark:bg-[#4F7DF3]/10 hover:ring-2 hover:ring-phase-1/30 hover:shadow-sm",
                                )}
                              >
                                <div className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                  hasDirectionBrief
                                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                                    : "bg-[#4F7DF3]/10 dark:bg-[#4F7DF3]/20 text-[#4F7DF3]",
                                )}>
                                  {hasDirectionBrief ? (
                                    <FileCheck className="h-4.5 w-4.5" />
                                  ) : (
                                    <PenLine className="h-4.5 w-4.5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-foreground">
                                      Research Direction Brief
                                    </p>
                                    {hasDirectionBrief && (
                                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {hasDirectionBrief
                                      ? "Your research direction is defined. Click to review or update."
                                      : "Provide your topic, objectives, research questions, gap justification, and key references."
                                    }
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              </button>
                            </div>

                            {/* Next step CTA when Step 1 is complete */}
                            {getStepStatus(1) === "complete" && (
                              <NextStepCTA
                                projectId={projectId}
                                currentStep={1}
                                phase1Steps={phase1Steps}
                              />
                            )}
                          </div>
                        )
                      ) : stepDef.step === 2 ? (
                        // ── Step 2: Grant Matching (uses StepExecutor) ──
                        <>
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
                              placeholder: "e.g., FRGS",
                              defaultValue: activeProject?.grantScheme && activeProject.grantScheme !== "Undecided" && activeProject.grantScheme !== "Other"
                                ? activeProject.grantScheme
                                : undefined,
                            },
                            {
                              name: "researchTopic",
                              label: "Research Topic / Title",
                              type: "text",
                              placeholder: "e.g., Machine Learning for Drug Discovery",
                              defaultValue: activeProject?.title || undefined,
                            },
                            {
                              name: "discipline",
                              label: "Discipline",
                              type: "text",
                              placeholder: "e.g., Computer Science",
                              defaultValue: activeProject?.discipline || undefined,
                            },
                            {
                              name: "country",
                              label: "Country",
                              type: "text",
                              placeholder: "e.g., Malaysia",
                              defaultValue: activeProject?.country || undefined,
                            },
                            {
                              name: "careerStage",
                              label: "Career Stage",
                              type: "text",
                              placeholder: "e.g., Associate Professor",
                              defaultValue: activeProject?.careerStage || undefined,
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
                        {/* Next step CTA when Step 2 is complete */}
                        {getStepStatus(2) === "complete" && (
                          <NextStepCTA
                            projectId={projectId}
                            currentStep={2}
                            phase1Steps={phase1Steps}
                          />
                        )}
                      </>
                      ) : stepDef.step === 3 ? (
                        // ── Step 3: Grant Intelligence (uses StepExecutor) ──
                        <div className="space-y-4">
                          {/* Quick-Fill option for users who bypassed this phase */}
                          {activeProject?.journeyMode &&
                            activeProject.journeyMode !== "explore" &&
                            activeProject.journeyMode !== "directed" &&
                            !getStepDocuments(3).some(
                              (d) => d.canonicalName === "Grant_Intelligence.md"
                            ) && (
                              <QuickFillGI
                                projectId={projectId}
                                defaults={{
                                  grantName: activeProject?.grantScheme || "",
                                  funder: activeProject?.targetFunder || "",
                                  country: activeProject?.country || "",
                                  budgetRange: activeProject?.budgetRange || "",
                                  grantScheme: activeProject?.grantScheme || "",
                                }}
                                onComplete={() => loadDocuments(projectId)}
                              />
                            )}

                          {/* Divider if Quick-Fill is shown */}
                          {activeProject?.journeyMode &&
                            activeProject.journeyMode !== "explore" &&
                            activeProject.journeyMode !== "directed" &&
                            !getStepDocuments(3).some(
                              (d) => d.canonicalName === "Grant_Intelligence.md"
                            ) && (
                              <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                  <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center">
                                  <span className="bg-background px-3 text-xs text-muted-foreground">
                                    or use the full Grant Intelligence workflow
                                  </span>
                                </div>
                              </div>
                            )}

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
                                placeholder: "e.g., FRGS",
                                defaultValue: activeProject?.grantScheme && activeProject.grantScheme !== "Undecided" && activeProject.grantScheme !== "Other"
                                  ? activeProject.grantScheme
                                  : undefined,
                              },
                              {
                                name: "grantName",
                                label: "Grant Program Name",
                                type: "text",
                                placeholder: "e.g., Fundamental Research Grant Scheme",
                                defaultValue: activeProject?.grantScheme && activeProject.grantScheme !== "Undecided" && activeProject.grantScheme !== "Other"
                                  ? (GRANT_SCHEME_MAP[activeProject.grantScheme]?.fullName || activeProject.grantScheme)
                                  : undefined,
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

                          {/* Next step CTA when Step 3 is complete — links to Phase 2 */}
                          {getStepStatus(3) === "complete" && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                              className="mt-4"
                            >
                              <button
                                onClick={() => window.location.assign(`/projects/${projectId}/phase/2`)}
                                className={cn(
                                  "group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
                                  "border-[#4F7DF3]/30 bg-gradient-to-r from-[#F0F4FF] to-[#F8FAFF]",
                                  "dark:from-[#4F7DF3]/10 dark:to-[#4F7DF3]/5 dark:border-[#4F7DF3]/20",
                                  "hover:border-[#4F7DF3]/50 hover:shadow-md hover:shadow-[#4F7DF3]/10",
                                  "active:scale-[0.995]",
                                )}
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4F7DF3]/10 dark:bg-[#4F7DF3]/20 text-[#4F7DF3] transition-colors group-hover:bg-[#4F7DF3]/20">
                                  <ArrowRight className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground">
                                    Continue to Phase 2: Strategic Positioning
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    All Phase 1 steps are complete. Proceed to the next phase.
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                              </button>
                            </motion.div>
                          )}
                        </div>
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
