"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  AlertTriangle,
  Brain,
  Zap,
  Target,
  Layers,
  Shield,
  Sparkles,
  Quote,
  AlertOctagon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
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
import { PhaseCompleteCTA } from "@/components/shared/PhaseCompleteCTA";

// ─── Phase 2 definition ────────────────────────────────────────────────────

const PHASE_2 = PHASE_DEFINITIONS[1];

// ─── Step metadata ─────────────────────────────────────────────────────────

interface StepMeta {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const STEP_META: Record<number, StepMeta> = {
  1: {
    icon: Target,
    description: "Analyze grant requirements against your profile to find alignment and gaps.",
  },
  2: {
    icon: Shield,
    description: "Map the competitive landscape and identify differentiation strategies.",
  },
  3: {
    icon: Brain,
    description: "Profile evaluator mindset, biases, and decision patterns — a key differentiator.",
  },
  4: {
    icon: Zap,
    description: "Design a multi-dimensional impact framework that maximizes your proposal's appeal.",
  },
  5: {
    icon: Layers,
    description: "Synthesize all analyses into the Proposal Blueprint — the master strategy document.",
  },
};

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

// ─── Psychology output parser ───────────────────────────────────────────────

interface PsychologyHighlights {
  epDeploymentRows: { tag: string; principle: string; deployment: string; implementation: string }[];
  championPhrases: string[];
  lossFrameSeeds: string[];
}

function parsePsychologyOutput(content: string): PsychologyHighlights {
  const highlights: PsychologyHighlights = {
    epDeploymentRows: [],
    championPhrases: [],
    lossFrameSeeds: [],
  };

  // Parse EP Deployment Map table rows
  const epTableRegex = /\|\s*(EP-\d{2})\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/g;
  let match;
  while ((match = epTableRegex.exec(content)) !== null) {
    highlights.epDeploymentRows.push({
      tag: match[1].trim(),
      principle: match[2].trim(),
      deployment: match[3].trim(),
      implementation: match[4].trim(),
    });
  }

  // Parse champion phrases from blockquotes or quoted strings
  const phraseRegex = /[""]([^""]+)[""](?:\s*[—–-]\s*Why it works:)/g;
  while ((match = phraseRegex.exec(content)) !== null) {
    highlights.championPhrases.push(match[1].trim());
  }

  // Fallback: look for lines starting with "- " inside Champion sections
  if (highlights.championPhrases.length === 0) {
    const championSection = content.match(/###?\s*\d*\.?\d*\s*Champion Phrase[^#]*(?=###?\s|\n## |$)/is);
    if (championSection) {
      const lineRegex = /^-\s*[""]([^""]+)[""]/gm;
      while ((match = lineRegex.exec(championSection[0])) !== null) {
        highlights.championPhrases.push(match[1].trim());
      }
    }
  }

  // Parse loss-frame narrative seeds
  const lossSection = content.match(/###?\s*\d*\.?\d*\s*Loss-Frame[^#]*(?=###?\s|\n## |$)/is);
  if (lossSection) {
    const lossRegex = /\*\*The loss frame:\*\*\s*[""]([^""]+)[""]/g;
    while ((match = lossRegex.exec(lossSection[0])) !== null) {
      highlights.lossFrameSeeds.push(match[1].trim());
    }
    // Fallback: look for blockquoted loss frames
    if (highlights.lossFrameSeeds.length === 0) {
      const blockRegex = /^>\s*[""]?([^"\n]+)[""]?\s*$/gm;
      while ((match = blockRegex.exec(lossSection[0])) !== null) {
        if (match[1].trim().length > 20) {
          highlights.lossFrameSeeds.push(match[1].trim());
        }
      }
    }
  }

  return highlights;
}

// ─── Psychology Highlights UI ───────────────────────────────────────────────

function PsychologyHighlightsUI({ content }: { content: string }) {
  const highlights = useMemo(() => parsePsychologyOutput(content), [content]);

  const hasContent =
    highlights.epDeploymentRows.length > 0 ||
    highlights.championPhrases.length > 0 ||
    highlights.lossFrameSeeds.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4 mt-4">
      {/* EP Deployment Map */}
      {highlights.epDeploymentRows.length > 0 && (
        <Card className="border-phase-2/30 bg-phase-2/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-phase-2" />
              <p className="text-sm font-medium text-foreground">EP Deployment Map</p>
              <Badge className="text-[10px] bg-phase-2/20 text-phase-2">
                {highlights.epDeploymentRows.length} tags
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-phase-2/20">
                    <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Tag</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Principle</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Deploy At</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">How</th>
                  </tr>
                </thead>
                <tbody>
                  {highlights.epDeploymentRows.map((row) => (
                    <tr key={row.tag} className="border-b border-border/30">
                      <td className="py-1.5 px-2">
                        <Badge className="text-[10px] px-1.5 py-0">{row.tag}</Badge>
                      </td>
                      <td className="py-1.5 px-2 text-foreground">{row.principle}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{row.deployment}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{row.implementation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Champion Phrases */}
      {highlights.championPhrases.length > 0 && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Quote className="h-4 w-4 text-success" />
              <p className="text-sm font-medium text-foreground">Champion Phrases</p>
              <Badge className="text-[10px] bg-success/20 text-success">
                {highlights.championPhrases.length} phrases
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Phrases evaluators use when advocating for a proposal in panel discussions.
            </p>
            <div className="flex flex-wrap gap-2">
              {highlights.championPhrases.map((phrase, i) => (
                <div
                  key={i}
                  className="rounded-md border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-foreground"
                >
                  &ldquo;{phrase}&rdquo;
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loss-Frame Narrative Seeds */}
      {highlights.lossFrameSeeds.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertOctagon className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-foreground">Loss-Frame Narrative Seeds</p>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Loss framing is more psychologically powerful than gain framing. Use these to frame urgency.
            </p>
            <div className="space-y-2">
              {highlights.lossFrameSeeds.map((seed, i) => (
                <div
                  key={i}
                  className="rounded-md border-l-2 border-warning/50 bg-warning/10 px-3 py-2 text-xs text-foreground italic"
                >
                  &ldquo;{seed}&rdquo;
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Phase2Client({ projectId: projectIdProp }: { projectId: string }) {
  const params = useParams<{ id: string }>();
  const projectId = (params.id as string) ?? projectIdProp;
  const { setActiveProject, activeProject } = useProjectStore();
  const { progress, loadProgress, getPhaseCompletion } = useProgressStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [activeStep, setActiveStep] = useState<number | null>(1);
  const [mode, setMode] = useState<"individual" | "combined">("individual");
  const [step3Output, setStep3Output] = useState<string | null>(null);

  // ── Initialize ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!projectId || projectId === "_") return;
    const proj = storage.getProject(projectId);
    setActiveProject(projectId);
    loadProgress(projectId);
    loadDocuments(projectId);
    setBreadcrumbs([
      { label: "Projects", href: "/projects" },
      { label: proj?.title || "Project", href: `/projects/${projectId}` },
      { label: "Phase 2: Strategic Positioning" },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);


  // ── Track Step 3 output for psychology highlights ─────────────────────────

  useEffect(() => {
    const psyDoc = documents.find(
      (d) => d.projectId === projectId && d.phase === 2 && d.step === 3 && d.isCurrent,
    );
    setStep3Output(psyDoc?.content ?? null);
  }, [documents, projectId]);

  // ── Phase progress ────────────────────────────────────────────────────────

  const phaseCompletion = getPhaseCompletion(2);
  const phase2Steps = PHASE_2.steps;

  const getStepStatus = useCallback(
    (stepNum: number): StepStatus => {
      return progress.phases[2]?.steps[stepNum] || "not-started";
    },
    [progress],
  );

  // ── Step documents ────────────────────────────────────────────────────────

  const getStepDocuments = useCallback(
    (stepNum: number) => {
      return documents.filter(
        (d) => d.projectId === projectId && d.phase === 2 && d.step === stepNum && d.isCurrent,
      );
    },
    [documents, projectId],
  );

  // ── Step unlocking logic ──────────────────────────────────────────────────

  const isStepUnlocked = useCallback(
    (stepNum: number): boolean => {
      if (stepNum === 1) return true;
      // Each step unlocks after previous has at least started
      const prevStatus = getStepStatus(stepNum - 1);
      return prevStatus !== "not-started";
    },
    [getStepStatus],
  );

  // ── Template IDs ──────────────────────────────────────────────────────────

  const getTemplateId = (stepNum: number): string => {
    switch (stepNum) {
      case 1: return "phase2.step1-requirements";
      case 2: return "phase2.step2-competitive";
      case 3: return "phase2.step3-psychology";
      case 4: return "phase2.step4-impact";
      case 5: return "phase2.step5-synthesis";
      default: return "";
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div className="space-y-8" {...fadeInUp}>
      {/* ── Phase Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <PhaseIcon phase={2} size="lg" active />
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {PHASE_2.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze requirements, competition, evaluator psychology, and impact to build your strategic Proposal Blueprint.
          </p>
        </div>
      </div>

      {/* ── Mode Toggle ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/50 p-3">
        <button
          onClick={() => setMode("individual")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
            mode === "individual"
              ? "bg-phase-2 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Layers className="h-4 w-4" />
            Individual Steps
            <Badge variant="outline" className="text-[10px] ml-1">recommended</Badge>
          </span>
        </button>
        <button
          onClick={() => setMode("combined")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
            mode === "combined"
              ? "bg-phase-2 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Combined Session
          </span>
        </button>
      </div>

      {/* ── Progress Bar ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Phase Progress</span>
          <span>
            {phase2Steps.filter((s) => getStepStatus(s.step) === "complete").length} of{" "}
            {phase2Steps.length} steps
          </span>
        </div>
        <Progress value={phaseCompletion} className="h-1.5" />
      </div>

      {/* ── Combined Mode ──────────────────────────────────────────────── */}
      {mode === "combined" ? (
        <div className="space-y-4">
          {/* Context window warning */}
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Large Context Window Required
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Combined mode works best with AI tools that have large context windows (100K+ tokens).
                This produces the Proposal Blueprint in a single session, combining all 5 analysis steps.
                If your AI tool has limited context, use Individual Steps mode instead.
              </p>
            </div>
          </div>

          <StepExecutor
            templateId="phase2.combined-session"
            projectId={projectId}
            phase={2}
            step={5}
            title="Combined Strategic Positioning"
            description="Complete all 5 strategic analyses in a single session. The AI will analyze requirements, competition, evaluator psychology, impact, and synthesize everything into your Proposal Blueprint."
            additionalFields={[
              {
                name: "grantName",
                label: "Grant Program Name",
                type: "text",
                placeholder: activeProject?.targetFunder || "e.g., ERC Starting Grant",
                required: true,
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
                name: "cvSummary",
                label: "Your CV or Career Summary",
                type: "textarea",
                placeholder: "Paste a summary of your CV, key publications, grants received, and relevant experience...",
              },
            ]}
            onComplete={() => {
              loadDocuments(projectId);
            }}
          />
        </div>
      ) : (
        /* ── Individual Steps Mode ──────────────────────────────────────── */
        <div className="space-y-0">
          {phase2Steps.map((stepDef, i) => {
            const status = getStepStatus(stepDef.step);
            const isActive = activeStep === stepDef.step;
            const isComplete = status === "complete";
            const isCurrent = status !== "not-started" && status !== "complete";
            const stepDocs = getStepDocuments(stepDef.step);
            const unlocked = isStepUnlocked(stepDef.step);
            const meta = STEP_META[stepDef.step];
            const StepIcon = meta?.icon;

            return (
              <div key={stepDef.step} className="relative">
                {/* Timeline line */}
                {i < phase2Steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-3.75 top-9 w-0.5 h-[calc(100%-20px)]",
                      isComplete ? "bg-phase-2" : "bg-border/50",
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
                        ? "border-phase-2 bg-phase-2 text-white"
                        : isCurrent
                          ? "border-phase-2 bg-transparent text-phase-2"
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
                    <div className="flex items-center gap-2">
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
                      </p>
                      {stepDef.step === 3 && (
                        <Badge variant="outline" className="text-[10px] border-phase-2/30 text-phase-2">
                          Key Differentiator
                        </Badge>
                      )}
                      {stepDef.step === 5 && (
                        <Badge variant="outline" className="text-[10px] border-accent-500/30 text-accent-400">
                          Produces Blueprint
                        </Badge>
                      )}
                    </div>
                    {isComplete && stepDocs.length > 0 && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                        {stepDocs.map((d) => d.canonicalName).join(", ")} —{" "}
                        {stepDocs.reduce((sum, d) => sum + d.wordCount, 0).toLocaleString()} words
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {StepIcon && (
                      <StepIcon
                        className={cn(
                          "h-4 w-4",
                          isComplete ? "text-phase-2" : "text-muted-foreground/40",
                        )}
                      />
                    )}
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
                      <div className="pt-2 space-y-4">
                        {/* Step executor */}
                        <StepExecutor
                          templateId={getTemplateId(stepDef.step)}
                          projectId={projectId}
                          phase={2}
                          step={stepDef.step}
                          title={stepDef.name}
                          description={meta?.description}
                          additionalFields={getAdditionalFields(stepDef.step, activeProject)}
                          onComplete={() => {
                            loadDocuments(projectId);
                            // Auto-advance to next step
                            if (stepDef.step < 5) {
                              setActiveStep(stepDef.step + 1);
                            }
                          }}
                        />

                        {/* Step 3 psychology highlights (shown after save) */}
                        {stepDef.step === 3 && step3Output && isComplete && (
                          <PsychologyHighlightsUI content={step3Output} />
                        )}

                        {/* Step 5 Blueprint emphasis */}
                        {stepDef.step === 5 && isComplete && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-lg border border-accent-500/30 bg-accent-500/5 p-4"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-5 w-5 text-accent-400" />
                              <p className="text-sm font-medium text-foreground">
                                Proposal Blueprint Created
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              This document guides all proposal writing in subsequent phases.
                              Every section of your proposal will reference this strategic foundation.
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <PhaseCompleteCTA projectId={projectId} phase={2} phaseCompletion={phaseCompletion} />
    </motion.div>
  );
}

// ─── Additional fields per step ─────────────────────────────────────────────

function getAdditionalFields(
  stepNum: number,
  project: ReturnType<typeof useProjectStore.getState>["activeProject"],
) {
  const baseFields = [
    {
      name: "grantName",
      label: "Grant Program Name",
      type: "text" as const,
      placeholder: project?.targetFunder || "e.g., ERC Starting Grant",
      required: true,
    },
    {
      name: "discipline",
      label: "Discipline",
      type: "text" as const,
      placeholder: project?.discipline || "e.g., Computer Science",
    },
  ];

  switch (stepNum) {
    case 1:
      return [
        ...baseFields,
        {
          name: "country",
          label: "Country",
          type: "text" as const,
          placeholder: project?.country || "e.g., United States",
        },
        {
          name: "careerStage",
          label: "Career Stage",
          type: "text" as const,
          placeholder: project?.careerStage || "e.g., Early Career Researcher",
        },
        {
          name: "cvSummary",
          label: "Your CV or Career Summary",
          type: "textarea" as const,
          placeholder:
            "Paste a summary of your CV — publications, grants, teaching, supervision, and relevant experience. This helps identify alignment and gaps with the grant requirements.",
        },
      ];
    case 2:
      return [
        ...baseFields,
        {
          name: "country",
          label: "Country",
          type: "text" as const,
          placeholder: project?.country || "e.g., United States",
        },
        {
          name: "careerStage",
          label: "Career Stage",
          type: "text" as const,
          placeholder: project?.careerStage || "e.g., Early Career Researcher",
        },
      ];
    case 3:
      return [
        ...baseFields,
        {
          name: "careerStage",
          label: "Career Stage",
          type: "text" as const,
          placeholder: project?.careerStage || "e.g., Early Career Researcher",
        },
      ];
    case 4:
      return [
        ...baseFields,
        {
          name: "country",
          label: "Country",
          type: "text" as const,
          placeholder: project?.country || "e.g., United States",
        },
        {
          name: "careerStage",
          label: "Career Stage",
          type: "text" as const,
          placeholder: project?.careerStage || "e.g., Early Career Researcher",
        },
      ];
    case 5:
      return [
        ...baseFields,
        {
          name: "country",
          label: "Country",
          type: "text" as const,
          placeholder: project?.country || "e.g., United States",
        },
        {
          name: "careerStage",
          label: "Career Stage",
          type: "text" as const,
          placeholder: project?.careerStage || "e.g., Early Career Researcher",
        },
      ];
    default:
      return baseFields;
  }
}
