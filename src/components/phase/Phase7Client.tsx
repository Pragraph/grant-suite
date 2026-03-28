"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  MessageSquareText,
  GitFork,
  FileEdit,
  Lock,
  Info,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  PartyPopper,
  Download,
  LayoutDashboard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { getProjectIdFromUrl } from "@/lib/utils";
import { useProjectStore} from "@/stores/project-store";
import { useProgressStore } from "@/stores/progress-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { PHASE_DEFINITIONS } from "@/lib/constants";
import type { StepStatus } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StepExecutor, type FormFieldConfig } from "@/components/phase/StepExecutor";

// ─── Phase 7 definition ────────────────────────────────────────────────────

const PHASE_7 = PHASE_DEFINITIONS[6];

// ─── Types ─────────────────────────────────────────────────────────────────

interface StepMeta {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tooltip: string;
}

// ─── Step metadata ─────────────────────────────────────────────────────────

const STEP_META: Record<number, StepMeta> = {
  1: {
    icon: MessageSquareText,
    description:
      "Analyze reviewer feedback by categorizing strengths, weaknesses, required changes, and suggestions.",
    tooltip:
      "Structured analysis of reviewer comments helps prioritize revisions and identify consensus vs. outlier criticisms.",
  },
  2: {
    icon: GitFork,
    description:
      "Develop a resubmission strategy addressing all reviewer concerns for the same funder.",
    tooltip:
      "Choose between resubmitting to the same funder (with a response strategy) or pivoting to a different funder with your existing topic.",
  },
  3: {
    icon: FileEdit,
    description:
      "Generate a point-by-point response to reviewers and produce the revised proposal.",
    tooltip:
      "Creates both the formal response letter and the revised proposal, then optionally feeds back into Phase 6 for another review cycle.",
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

// ─── Feedback Analysis Result UI ──────────────────────────────────────────

function FeedbackAnalysisResultUI({ content }: { content: string }) {
  // Parse strengths
  const strengthsSection = content.match(/### STRENGTHS IDENTIFIED([\s\S]*?)(?=\n---|\n###)/i)?.[1] || "";
  const strengths = [...strengthsSection.matchAll(/\d+\.\s*\*\*(.+?)\*\*/g)].map((m) => m[1]);

  // Parse weaknesses
  const weaknessRegex = /\d+\.\s*\*\*\[(CRITICAL|MAJOR|MINOR)\]\*\*\s*(.+?)(?=\n\s*-|\n\s*\d+\.|\n\n|\n---)/gi;
  const weaknesses: { severity: string; text: string }[] = [];
  let m;
  while ((m = weaknessRegex.exec(content)) !== null) {
    weaknesses.push({ severity: m[1].toUpperCase(), text: m[2].trim() });
  }

  // Parse required changes
  const changesSection = content.match(/### REQUIRED CHANGES([\s\S]*?)(?=\n---|\n###)/i)?.[1] || "";
  const changes = [...changesSection.matchAll(/\d+\.\s*(.+?)(?=\n\s*\d+\.|\n\n|\n---)/g)].map((m) => m[1].trim());

  // Parse suggestions
  const suggestionsSection = content.match(/### SUGGESTIONS([\s\S]*?)(?=\n---|\n###)/i)?.[1] || "";
  const suggestions = [...suggestionsSection.matchAll(/\d+\.\s*(.+?)(?=\n\s*\d+\.|\n\n|\n---)/g)].map((m) => m[1].trim());

  return (
    <div className="space-y-4 mt-4">
      {/* Categorized Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Strengths */}
        {strengths.length > 0 && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Strengths ({strengths.length})
              </p>
              {strengths.map((s, i) => (
                <p key={i} className="text-[11px] text-gray-900 bg-emerald-50 rounded px-2 py-1">{s}</p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                Weaknesses ({weaknesses.length})
              </p>
              {weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <Badge
                    className={cn(
                      "text-[8px] shrink-0 mt-0.5",
                      w.severity === "CRITICAL"
                        ? "bg-red-100 text-red-500"
                        : w.severity === "MAJOR"
                          ? "bg-amber-100 text-amber-500"
                          : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {w.severity}
                  </Badge>
                  <span className="text-gray-900">{w.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Required Changes */}
        {changes.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-medium text-amber-500 flex items-center gap-1.5">
                <FileEdit className="h-3 w-3" />
                Required Changes ({changes.length})
              </p>
              {changes.map((c, i) => (
                <p key={i} className="text-[11px] text-gray-900 bg-amber-50 rounded px-2 py-1">{c}</p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-medium text-blue-500 flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                Suggestions ({suggestions.length})
              </p>
              {suggestions.map((s, i) => (
                <p key={i} className="text-[11px] text-gray-900 bg-blue-50 rounded px-2 py-1">{s}</p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Resubmission Decision Fork ───────────────────────────────────────────

function ResubmissionForkUI({
  projectId,
  onSameFunder,
}: {
  projectId: string;
  onSameFunder: () => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 mt-4">
      <Card
        className="border-phase-7/20 bg-phase-7/5 cursor-pointer hover:border-phase-7/40 transition-colors"
        onClick={onSameFunder}
      >
        <CardContent className="p-5 text-center space-y-3">
          <RotateCcw className="h-8 w-8 text-phase-7 mx-auto" />
          <h3 className="text-sm font-medium text-gray-900">Same Funder</h3>
          <p className="text-[11px] text-gray-500">
            Continue with a resubmission strategy addressing reviewer concerns for the same grant program.
          </p>
          <Button size="sm" className="bg-phase-7 hover:bg-phase-7/90 text-white">
            Develop Strategy
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white">
        <CardContent className="p-5 text-center space-y-3">
          <ExternalLink className="h-8 w-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-medium text-gray-900">Different Funder</h3>
          <p className="text-[11px] text-gray-500">
            Return to Phase 1 Step 2 (Grant Matching) with your existing research topic to find a better-suited funder.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.assign(`/projects/${projectId}/phase/1`)}
          >
            Go to Phase 1
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Response to Reviewers Result UI ──────────────────────────────────────

function ResponseResultUI({
  content,
  projectId,
}: {
  content: string;
  projectId: string;
}) {
  // Parse response sections
  const commentRegex = /\*\*Comment\s*\[?(\d+\.?\d*)\]?:\*\*\s*"?(.+?)"?\n+\*\*Response:\*\*\s*(.+?)\n+\*\*Change made:\*\*\s*(.+?)(?=\n\n|\n\*\*Comment|\n---|\n###)/gis;
  const responses: { id: string; comment: string; response: string; change: string }[] = [];
  let m;
  while ((m = commentRegex.exec(content)) !== null) {
    responses.push({
      id: m[1],
      comment: m[2].trim(),
      response: m[3].trim(),
      change: m[4].trim(),
    });
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Structured responses */}
      {responses.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Response to Reviewers ({responses.length} points)
          </p>
          {responses.slice(0, 10).map((r, i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Badge className="bg-red-100 text-red-500 text-[9px] shrink-0 mt-0.5">Comment</Badge>
                  <p className="text-[11px] text-gray-500 italic">{r.comment}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-phase-7/20 text-phase-7 text-[9px] shrink-0 mt-0.5">Response</Badge>
                  <p className="text-[11px] text-gray-900">{r.response}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-emerald-100 text-emerald-500 text-[9px] shrink-0 mt-0.5">Change</Badge>
                  <p className="text-[11px] text-gray-900">{r.change}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {responses.length > 10 && (
            <p className="text-[10px] text-gray-400 italic">
              ...and {responses.length - 10} more response points (see full document)
            </p>
          )}
        </div>
      )}

      {/* Re-run Phase 6 */}
      <Card className="border-phase-6/20 bg-phase-6/5">
        <CardContent className="p-4 flex items-center gap-3">
          <RotateCcw className="h-5 w-5 text-phase-6 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">Re-run Phase 6 with revised proposal?</p>
            <p className="text-[11px] text-gray-500">
              Run the review cycle again on the revised proposal for additional optimization.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.assign(`/projects/${projectId}/phase/6`)}
            className="text-xs border-phase-6/30 text-phase-6"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Re-run Phase 6
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Phase7Client({ projectId: _projectIdProp }: { projectId: string }) {
  const [projectId] = useState(() => getProjectIdFromUrl());
  const { setActiveProject } = useProjectStore();
  const { progress, loadProgress, getPhaseCompletion } = useProgressStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [activeStep, setActiveStep] = useState<number | null>(1);
  const [step2Choice, setStep2Choice] = useState<"pending" | "same-funder">("pending");

  // Pre-compute random values for decorative dots (avoids Math.random in render)
  const [decorativeDots] = useState(() =>
    Array.from({ length: 12 }, () => ({
      yRand: Math.random() * 40,
      xRand: (Math.random() - 0.5) * 40,
      durRand: Math.random(),
    })),
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
      { label: "Phase 7: Post-Submission" },
    ]);
  }, [projectId, setActiveProject, loadProgress, loadDocuments, setBreadcrumbs]);


  // ── Phase progress ────────────────────────────────────────────────────────

  const phaseCompletion = getPhaseCompletion(7);
  const phase7Steps = PHASE_7.steps;

  const getStepStatus = useCallback(
    (stepNum: number): StepStatus => {
      return progress.phases[7]?.steps[stepNum] || "not-started";
    },
    [progress],
  );

  const isStepUnlocked = useCallback(
    (stepNum: number): boolean => {
      if (stepNum === 1) return true;
      const prevStatus = getStepStatus(stepNum - 1);
      return prevStatus === "complete";
    },
    [getStepStatus],
  );

  const getDocContent = useCallback(
    (canonicalName: string): string | null => {
      const doc = documents.find(
        (d) => d.projectId === projectId && d.canonicalName === canonicalName && d.isCurrent,
      );
      return doc?.content ?? null;
    },
    [documents, projectId],
  );

  // ── Auto-detect which final document exists ──────────────────────────────

  const hasFinalProposal = !!getDocContent("Final_Proposal.md");
  const hasCompleteProposal = !!getDocContent("Complete_Proposal.md");
  const proposalSource = hasFinalProposal ? "Final_Proposal.md" : hasCompleteProposal ? "Complete_Proposal.md" : null;

  // ── Template IDs ──────────────────────────────────────────────────────────

  const getTemplateId = (stepNum: number): string => {
    switch (stepNum) {
      case 1: return "phase7.step1-feedback-analysis";
      case 2: return "phase7.step2-resubmission-strategy";
      case 3: return "phase7.step3-response-revised";
      default: return "";
    }
  };

  // ── Step 1 additional fields — reviewer feedback input ───────────────────

  const step1Fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "reviewerFeedback",
        label: "Paste Reviewer Feedback",
        type: "textarea" as const,
        placeholder: "Paste the reviewer comments / feedback you received here...",
        required: true,
      },
    ],
    [],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <motion.div className="space-y-8" {...fadeInUp}>
        {/* ── Phase Header ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <PhaseIcon phase={7} size="lg" active />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{PHASE_7.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Analyze reviewer feedback, develop a resubmission strategy, and produce a revised
              proposal with a formal response to reviewers.
            </p>
          </div>
        </div>

        {/* ── Progress Bar ───────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">Phase Progress</span>
            <span className="text-sm text-gray-400">
              {phase7Steps.filter((s) => getStepStatus(s.step) === "complete").length} of{" "}
              {phase7Steps.length} steps
            </span>
          </div>
          <Progress value={phaseCompletion} className="h-1.5" />
        </div>

        {/* ── Info Card ──────────────────────────────────────────────────── */}
        <Card className="border-phase-7/15 bg-phase-7/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-phase-7 mt-0.5 shrink-0" />
              <div className="text-[11px] text-gray-500">
                <p className="font-medium text-gray-900 mb-1">Post-submission workflow</p>
                <p>
                  Use this phase after receiving reviewer feedback. It helps you systematically
                  analyze feedback, decide on a resubmission strategy, and produce a revised
                  proposal with a formal point-by-point response to reviewers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Proposal Source Indicator ──────────────────────────────────── */}
        {proposalSource ? (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-3 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <p className="text-xs text-gray-900">
                Using <span className="font-mono text-[11px] text-emerald-500">{proposalSource}</span> from Phase 6
                as the submitted proposal reference.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <p className="text-xs text-gray-500">
                No submitted proposal found. Complete Phase 5 or 6 first to have a proposal to reference.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Steps ──────────────────────────────────────────────────────── */}
        <div className="space-y-0">
          {phase7Steps.map((stepDef, i) => {
            const status = getStepStatus(stepDef.step);
            const isActive = activeStep === stepDef.step;
            const isComplete = status === "complete";
            const isCurrent = status !== "not-started" && status !== "complete";
            const unlocked = isStepUnlocked(stepDef.step);
            const meta = STEP_META[stepDef.step];

            return (
              <div key={stepDef.step} className="relative">
                {/* Timeline line */}
                {i < phase7Steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-3.75 top-9 w-0.5 h-[calc(100%-20px)]",
                      isComplete ? "bg-phase-7" : "bg-gray-200",
                    )}
                  />
                )}

                {/* Step header */}
                <button
                  onClick={() => setActiveStep(isActive ? null : stepDef.step)}
                  className={cn(
                    "flex w-full items-center gap-3 py-3 text-left transition-colors",
                    "hover:bg-gray-50 rounded-xl px-2 -mx-2",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isComplete
                        ? "border-phase-7 bg-phase-7 text-white"
                        : isCurrent
                          ? "border-phase-7 bg-transparent text-phase-7"
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
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
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
                      </p>
                      {!unlocked && (
                        <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-400">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />
                          Locked
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] ml-auto",
                          isComplete
                            ? "border-phase-7/30 text-phase-7"
                            : isCurrent
                              ? "border-phase-7/20 text-phase-7/70"
                              : "border-gray-200 text-gray-400",
                        )}
                      >
                        {stepStatusLabels[status]}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                      {meta?.description}
                    </p>
                  </div>

                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform shrink-0",
                      isActive && "rotate-180",
                    )}
                  />
                </button>

                {/* Step content */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      variants={stepExpandVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="pl-11"
                    >
                      <div className="space-y-4 pb-6">
                        {!unlocked ? (
                          <Card className="border-gray-200 bg-white">
                            <CardContent className="p-4 text-center">
                              <Lock className="h-5 w-5 text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-400">
                                Complete step {stepDef.step - 1} to unlock this step.
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            {/* Step 1: Feedback Analysis with custom input */}
                            {stepDef.step === 1 && (
                              <>
                                {proposalSource && (
                                  <Card className="border-phase-7/15 bg-phase-7/5">
                                    <CardContent className="p-3 flex items-center gap-2">
                                      <Info className="h-3.5 w-3.5 text-phase-7 shrink-0" />
                                      <p className="text-[11px] text-gray-500">
                                        The prompt will automatically include{" "}
                                        <span className="font-mono text-phase-7">{proposalSource}</span>{" "}
                                        as the submitted proposal reference.
                                      </p>
                                    </CardContent>
                                  </Card>
                                )}
                                <StepExecutor
                                  templateId={getTemplateId(1)}
                                  projectId={projectId}
                                  phase={7}
                                  step={1}
                                  title={stepDef.name}
                                  description={meta?.description}
                                  additionalFields={step1Fields}
                                  onComplete={() => {
                                    loadDocuments(projectId);
                                    loadProgress(projectId);
                                  }}
                                />
                                {isComplete && (
                                  <FeedbackAnalysisResultUI
                                    content={getDocContent("Feedback_Analysis.md") || ""}
                                  />
                                )}
                              </>
                            )}

                            {/* Step 2: Resubmission Strategy with decision fork */}
                            {stepDef.step === 2 && (
                              <>
                                {step2Choice === "pending" ? (
                                  <ResubmissionForkUI
                                    projectId={projectId}
                                    onSameFunder={() => setStep2Choice("same-funder")}
                                  />
                                ) : (
                                  <StepExecutor
                                    templateId={getTemplateId(2)}
                                    projectId={projectId}
                                    phase={7}
                                    step={2}
                                    title={stepDef.name}
                                    description={meta?.description}
                                    onComplete={() => {
                                      loadDocuments(projectId);
                                      loadProgress(projectId);
                                    }}
                                  />
                                )}
                              </>
                            )}

                            {/* Step 3: Response & Revised Proposal */}
                            {stepDef.step === 3 && (
                              <>
                                <StepExecutor
                                  templateId={getTemplateId(3)}
                                  projectId={projectId}
                                  phase={7}
                                  step={3}
                                  title={stepDef.name}
                                  description={meta?.description}
                                  onComplete={() => {
                                    loadDocuments(projectId);
                                    loadProgress(projectId);
                                  }}
                                />
                                {isComplete && (
                                  <ResponseResultUI
                                    content={getDocContent("Revised_Proposal.md") || ""}
                                    projectId={projectId}
                                  />
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ── Project Complete Celebration ────────────────────────────────── */}
        {phaseCompletion === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center py-8"
          >
            <Card className="border-phase-7/30 bg-linear-to-b from-phase-7/10 to-phase-7/5 overflow-hidden relative">
              {/* Decorative dots */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {decorativeDots.map((dot, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1.5 w-1.5 rounded-full bg-phase-7/20"
                    initial={{ opacity: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [-20, -60 - dot.yRand],
                      x: [0, dot.xRand],
                    }}
                    transition={{
                      duration: 2 + dot.durRand,
                      delay: i * 0.15,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                    style={{
                      left: `${10 + (i / 12) * 80}%`,
                      bottom: 0,
                    }}
                  />
                ))}
              </div>

              <CardContent className="p-8 space-y-5 relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <PartyPopper className="h-12 w-12 text-phase-7 mx-auto" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    Congratulations! Your grant proposal is complete.
                  </h2>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    You&apos;ve successfully completed all 7 phases — from discovery through
                    post-submission. Your proposal has been written, reviewed, optimized, and
                    your resubmission materials are ready.
                  </p>
                </div>

                {/* Summary stats */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-phase-7">7</p>
                    <p className="text-[11px] text-gray-500">Phases Completed</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-phase-7">
                      {documents.filter((d) => d.projectId === projectId && d.isCurrent).length}
                    </p>
                    <p className="text-[11px] text-gray-500">Documents Generated</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => window.location.assign("/projects")}
                    className="text-xs"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                    Back to Dashboard
                  </Button>
                  <Button
                    onClick={() => window.location.assign(`/projects/${projectId}/export`)}
                    className="bg-phase-7 hover:bg-phase-7/90 text-white text-xs"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export All Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
