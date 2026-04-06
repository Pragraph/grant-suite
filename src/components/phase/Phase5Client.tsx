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
  Download,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { getProjectIdFromUrl } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { useProgressStore } from "@/stores/progress-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { PHASE_DEFINITIONS } from "@/lib/constants";
import type { StepStatus } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StepExecutor } from "@/components/phase/StepExecutor";
import { PhaseCompleteCTA } from "@/components/shared/PhaseCompleteCTA";
import { PlaceholderTracker } from "@/components/shared/PlaceholderTracker";

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
      "Written after methods because impact claims must be grounded in what you'll actually do.",
  },
  6: {
    icon: DollarSign,
    description:
      "Draft the budget justification narrative connecting costs to methods.",
    tooltip:
      "Written after methods because every budget line must trace to a specific research activity.",
  },
  7: {
    icon: FolderOpen,
    description:
      "Compile supporting documents (data management plan, ethics, etc.).",
    tooltip:
      "Generated near the end because supporting documents reference the full proposal content.",
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
  { canonicalName: "Budget_Justification.md", label: "Budget Justification", phase: 4 },
];

const OPTIONAL_DOCS = [
  { canonicalName: "Partnership_Plan.md", label: "Partnership Plan", phase: "3A" },
  { canonicalName: "Patent_Analysis.md", label: "Patent & Novelty Analysis", phase: "3B" },
  { canonicalName: "SDG_Alignment.md", label: "SDG Alignment", phase: "3C" },
  { canonicalName: "National_Alignment.md", label: "National Priority Alignment", phase: "3C" },
  { canonicalName: "KPI_Plan.md", label: "KPI Plan", phase: "3C" },
  { canonicalName: "Researcher_Profile.md", label: "Researcher Profile", phase: "3C" },
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
            <p className="text-sm font-medium text-gray-900">Pre-Compilation Checklist</p>
          </div>
          <Badge
            className={cn(
              "text-[10px]",
              allRequired
                ? "bg-emerald-100 text-emerald-600"
                : "bg-red-100 text-red-600",
            )}
          >
            {allRequired ? "Ready to compile" : "Missing required documents"}
          </Badge>
        </div>

        {/* Required Documents */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50",
                )}
              >
                {exists ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                )}
                <span className="flex-1 font-medium text-gray-900">{doc.label}</span>
                <span className="text-gray-500">Phase {doc.phase}</span>
                {exists && (
                  <span className="text-gray-400">{words.toLocaleString()} words</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Optional Documents */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    : "border-gray-200 bg-transparent",
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
                    exists ? "text-gray-900" : "text-gray-400",
                  )}
                >
                  {doc.label}
                </span>
                <span className="text-gray-400">Phase {doc.phase}</span>
                {exists ? (
                  <span className="text-gray-400">{words.toLocaleString()} words</span>
                ) : (
                  <span className="text-gray-300 italic">Not completed</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Estimated prompt size */}
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-[11px] text-gray-500 space-y-1">
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
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <p className="text-xs font-medium text-amber-600">
            {citations.length} Citation{citations.length !== 1 ? "s" : ""} Needed
          </p>
        </div>
        <div className="space-y-1">
          {citations.slice(0, 10).map((c, i) => (
            <p key={i} className="text-[11px] text-gray-600 bg-amber-50 rounded px-2 py-1">
              {c}
            </p>
          ))}
          {citations.length > 10 && (
            <p className="text-[10px] text-gray-400 italic">
              ...and {citations.length - 10} more
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Phase5Client({ projectId: _pid }: { projectId: string }) {
  void _pid; // extracted from URL instead
  const [projectId] = useState(() => getProjectIdFromUrl());
  const { setActiveProject } = useProjectStore();
  const { progress, loadProgress, getPhaseCompletion } = useProgressStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [activeStep, setActiveStep] = useState<number | null>(1);

  // Step 1 — optional doc checkboxes
  const [optionalChecked, setOptionalChecked] = useState<Record<string, boolean>>({});

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
      { label: "Phase 5: Proposal Writing" },
    ]);
  }, [projectId, setActiveProject, loadProgress, loadDocuments, setBreadcrumbs]);


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
      case 5: return "phase5.step5-impact";
      case 6: return "phase5.step6-budget-justification";
      case 7: return "phase5.step7-supporting-documents";
      case 8: return "phase5.step8-assembly-polish";
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

  const step5Fields = useMemo(
    () => [
      {
        name: "wordLimit",
        label: "Word limit for impact section",
        type: "text" as const,
        placeholder: "e.g., 2000",
        required: true,
      },
    ],
    [],
  );

  const step6Fields = useMemo(
    () => [
      {
        name: "wordLimit",
        label: "Word limit for budget justification",
        type: "text" as const,
        placeholder: "e.g., 2000",
        required: true,
      },
    ],
    [],
  );

  // ── Step 7: Supporting documents checklist ────────────────────────────────

  const [selectedSupportDocs, setSelectedSupportDocs] = useState<Record<string, boolean>>({
    dmp: false,
    ethics: false,
    dissemination: false,
    risk: false,
    gantt: false,
    letters: false,
  });
  const [customDocTypes, setCustomDocTypes] = useState("");

  const SUPPORT_DOC_OPTIONS = useMemo(
    () => [
      { key: "dmp", label: "Data Management Plan (DMP)" },
      { key: "ethics", label: "Ethics Statement" },
      { key: "dissemination", label: "Dissemination & Impact Plan" },
      { key: "risk", label: "Risk Management Plan" },
      { key: "gantt", label: "Gantt Chart / Timeline" },
      { key: "letters", label: "Letters of Support (reference only — generated in Phase 3A/4)" },
    ],
    [],
  );

  const step7Fields = useMemo(() => {
    const selected = SUPPORT_DOC_OPTIONS.filter((o) => selectedSupportDocs[o.key])
      .map((o) => o.label);
    if (customDocTypes.trim()) {
      selected.push(...customDocTypes.split(",").map((s) => s.trim()).filter(Boolean));
    }
    const selectedDocString = selected.length > 0
      ? selected.map((s) => `- ${s}`).join("\n")
      : "No documents selected";

    return [
      {
        name: "selectedDocuments",
        label: "Selected supporting documents",
        type: "textarea" as const,
        placeholder: "Selected documents will appear here",
        required: true,
        defaultValue: selectedDocString,
      },
      ...(customDocTypes.trim()
        ? [
            {
              name: "customDocumentTypes",
              label: "Custom document types",
              type: "text" as const,
              placeholder: "",
              required: false,
              defaultValue: customDocTypes,
            },
          ]
        : []),
    ];
  }, [selectedSupportDocs, customDocTypes, SUPPORT_DOC_OPTIONS]);

  // ── Step 8: Assembly state ────────────────────────────────────────────────

  const SECTION_ORDER_DEFAULT = useMemo(
    () => [
      { key: "executive-summary", label: "Executive Summary", docName: "Executive_Summary_Draft.md" },
      { key: "background", label: "Background / Literature Review", docName: "Background_Draft.md" },
      { key: "methods", label: "Research Methods", docName: "Methods_Draft.md" },
      { key: "impact", label: "Expected Impact", docName: "Impact_Draft.md" },
      { key: "budget-justification", label: "Budget Justification", docName: "Budget_Justification_Draft.md" },
      { key: "supporting-docs", label: "Supporting Documents", docName: "Supporting_Documents.md" },
    ],
    [],
  );

  const [sectionOrder, setSectionOrder] = useState(SECTION_ORDER_DEFAULT);
  const [customSections, setCustomSections] = useState<{ key: string; label: string; afterIndex: number }[]>([]);
  const [assembledContent, setAssembledContent] = useState<string | null>(null);
  const [showPolishPrompt, setShowPolishPrompt] = useState(false);
  const [showCitationResolver, setShowCitationResolver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleAssemble = useCallback(() => {
    const parts: string[] = [];
    sectionOrder.forEach((section, i) => {
      // Insert any custom sections before this index
      customSections
        .filter((cs) => cs.afterIndex === i)
        .forEach((cs) => parts.push(`\n## ${cs.label}\n\n[USER INPUT NEEDED: Content for ${cs.label}]\n`));

      const content = getDocContent(section.docName);
      if (content) {
        parts.push(content);
      } else {
        parts.push(`\n## ${section.label}\n\n*Section not yet completed.*\n`);
      }
    });
    // Custom sections after the last section
    customSections
      .filter((cs) => cs.afterIndex === sectionOrder.length)
      .forEach((cs) => parts.push(`\n## ${cs.label}\n\n[USER INPUT NEEDED: Content for ${cs.label}]\n`));

    const assembled = `# Complete Proposal\n\n${parts.join("\n\n---\n\n")}`;
    setAssembledContent(assembled);
  }, [sectionOrder, customSections, getDocContent]);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    setSectionOrder(newOrder);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const addCustomSection = () => {
    setCustomSections((prev) => [
      ...prev,
      { key: `custom-${Date.now()}`, label: "New Section", afterIndex: sectionOrder.length },
    ]);
  };

  const handleDownloadMd = useCallback(() => {
    if (!assembledContent) return;
    const blob = new Blob([assembledContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Complete_Proposal.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [assembledContent]);

  const handleDownloadDocx = useCallback(async () => {
    if (!assembledContent) return;
    const { exportProposalAsDocx } = await import("@/lib/export-docx");
    const proj = storage.getProject(projectId);
    await exportProposalAsDocx({
      title: proj?.title || "Proposal",
      grantName: proj?.grantScheme || "Grant",
      discipline: proj?.discipline || "",
      content: assembledContent,
    });
  }, [assembledContent, projectId]);

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
            <h1 className="text-2xl font-bold text-gray-900">{PHASE_5.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Write your proposal section by section in a strategic order. Each section builds on
              the previous ones, ensuring narrative coherence and evidence alignment.
            </p>
          </div>
        </div>

        {/* ── Progress Bar ───────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">Phase Progress</span>
            <span className="text-sm text-gray-400">
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
              <div className="text-[11px] text-gray-500">
                <p className="font-medium text-gray-900 mb-1">Why this writing order?</p>
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
                      isComplete ? "bg-phase-5" : "bg-gray-200",
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
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isComplete
                        ? "border-phase-5 bg-phase-5 text-white"
                        : isCurrent
                          ? "border-phase-5 bg-transparent text-phase-5"
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
                        <p className="text-xs text-gray-400 truncate">
                          {producedDocNames[stepDef.step]} —{" "}
                          {docStats ? `${docStats.wordCount.toLocaleString()} words` : "saved"}
                        </p>
                        {docStats && (docStats.citationCount > 0 || docStats.inputCount > 0) && (
                          <div className="flex items-center gap-1">
                            {docStats.citationCount > 0 && (
                              <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-500 py-0 h-4">
                                {docStats.citationCount} citations
                              </Badge>
                            )}
                            {docStats.inputCount > 0 && (
                              <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-500 py-0 h-4">
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
                    {meta && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            <StepIcon
                              className={cn(
                                "h-4 w-4",
                                isComplete ? "text-phase-5" : "text-gray-300",
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
                    {status !== "not-started" && (
                      <Badge variant={isComplete ? "default" : "outline"} className="text-[10px]">
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
                                  <p className="text-sm font-medium text-gray-900">
                                    Proposal data compiled
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-6">
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

                        {/* ── Step 5: Impact Writer ──────────────────── */}
                        {stepDef.step === 5 && (
                          <>
                            {!unlocked ? (
                              <LockedStepMessage stepNum={5} />
                            ) : (
                              <>
                                <StepExecutor
                                  templateId={getTemplateId(5)}
                                  projectId={projectId}
                                  phase={5}
                                  step={5}
                                  title="Impact Writer"
                                  description={meta?.description}
                                  additionalFields={step5Fields}
                                  onComplete={() => {
                                    loadDocuments(projectId);
                                    setActiveStep(6);
                                  }}
                                />
                                {isComplete && (
                                  <PostStepStats
                                    canonicalName="Impact_Draft.md"
                                    getDocContent={getDocContent}
                                  />
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* ── Step 6: Budget Justification Writer ──────── */}
                        {stepDef.step === 6 && (
                          <>
                            {!unlocked ? (
                              <LockedStepMessage stepNum={6} />
                            ) : (
                              <>
                                <StepExecutor
                                  templateId={getTemplateId(6)}
                                  projectId={projectId}
                                  phase={5}
                                  step={6}
                                  title="Budget Justification Writer"
                                  description={meta?.description}
                                  additionalFields={step6Fields}
                                  onComplete={() => {
                                    loadDocuments(projectId);
                                    setActiveStep(7);
                                  }}
                                />
                                {isComplete && (
                                  <PostStepStats
                                    canonicalName="Budget_Justification_Draft.md"
                                    getDocContent={getDocContent}
                                  />
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* ── Step 7: Supporting Documents Generator ───── */}
                        {stepDef.step === 7 && (
                          <>
                            {!unlocked ? (
                              <LockedStepMessage stepNum={7} />
                            ) : (
                              <>
                                {/* Supporting docs checklist */}
                                <Card className="border-phase-5/20 bg-phase-5/5">
                                  <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center gap-2">
                                      <FolderOpen className="h-4 w-4 text-phase-5" />
                                      <p className="text-sm font-medium text-gray-900">
                                        Select supporting documents your grant requires
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      {SUPPORT_DOC_OPTIONS.map((opt) => (
                                        <div
                                          key={opt.key}
                                          className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs"
                                        >
                                          <Checkbox
                                            checked={selectedSupportDocs[opt.key] ?? false}
                                            onCheckedChange={(v) =>
                                              setSelectedSupportDocs((prev) => ({
                                                ...prev,
                                                [opt.key]: !!v,
                                              }))
                                            }
                                          />
                                          <span className="text-gray-900 font-medium">
                                            {opt.label}
                                          </span>
                                        </div>
                                      ))}
                                      {/* Custom document type input */}
                                      <div className="pt-2 space-y-1.5">
                                        <Label className="text-xs text-gray-500">
                                          Any other (comma-separated)
                                        </Label>
                                        <Input
                                          value={customDocTypes}
                                          onChange={(e) => setCustomDocTypes(e.target.value)}
                                          placeholder="e.g., Consortium Agreement, IP Plan"
                                          className="text-xs h-8"
                                        />
                                      </div>
                                    </div>
                                    {Object.values(selectedSupportDocs).some(Boolean) && (
                                      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-2.5">
                                        <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                        <p className="text-[11px] text-gray-500">
                                          {Object.values(selectedSupportDocs).filter(Boolean).length}
                                          {customDocTypes.trim()
                                            ? ` + ${customDocTypes.split(",").filter((s) => s.trim()).length} custom`
                                            : ""}{" "}
                                          document(s) selected. The prompt will generate all in one output.
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>

                                <StepExecutor
                                  templateId={getTemplateId(7)}
                                  projectId={projectId}
                                  phase={5}
                                  step={7}
                                  title="Supporting Documents Generator"
                                  description={meta?.description}
                                  additionalFields={step7Fields}
                                  onComplete={() => {
                                    loadDocuments(projectId);
                                    setActiveStep(8);
                                  }}
                                />
                                {isComplete && (
                                  <PostStepStats
                                    canonicalName="Supporting_Documents.md"
                                    getDocContent={getDocContent}
                                  />
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* ── Step 8: Full Proposal Assembly ───────────── */}
                        {stepDef.step === 8 && (
                          <>
                            {!unlocked ? (
                              <LockedStepMessage stepNum={8} />
                            ) : (
                              <div className="space-y-4">
                                {/* Section reorder */}
                                <Card className="border-phase-5/20 bg-phase-5/5">
                                  <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Layers className="h-4 w-4 text-phase-5" />
                                        <p className="text-sm font-medium text-gray-900">
                                          Proposal Section Order
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={addCustomSection}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add section
                                      </Button>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                      Drag to reorder sections if your grant requires a different order.
                                    </p>
                                    <div className="space-y-1">
                                      {sectionOrder.map((section, idx) => {
                                        const hasContent = !!getDocContent(section.docName);
                                        return (
                                          <div
                                            key={section.key}
                                            draggable
                                            onDragStart={() => handleDragStart(idx)}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDragEnd={handleDragEnd}
                                            className={cn(
                                              "flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-grab active:cursor-grabbing transition-colors",
                                              dragIdx === idx
                                                ? "border-phase-5/40 bg-phase-5/10"
                                                : hasContent
                                                  ? "border-emerald-200 bg-emerald-50"
                                                  : "border-gray-200 bg-white",
                                            )}
                                          >
                                            <GripVertical className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                                            <span className="text-gray-400 w-4">
                                              {idx + 1}.
                                            </span>
                                            <span
                                              className={cn(
                                                "flex-1 font-medium",
                                                hasContent ? "text-gray-900" : "text-gray-400",
                                              )}
                                            >
                                              {section.label}
                                            </span>
                                            {hasContent ? (
                                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                            ) : (
                                              <XCircle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Custom sections */}
                                    {customSections.length > 0 && (
                                      <div className="space-y-1.5 pt-2 border-t border-gray-200">
                                        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                                          Custom Sections
                                        </p>
                                        {customSections.map((cs, idx) => (
                                          <div
                                            key={cs.key}
                                            className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5"
                                          >
                                            <Input
                                              value={cs.label}
                                              onChange={(e) => {
                                                const updated = [...customSections];
                                                updated[idx] = { ...cs, label: e.target.value };
                                                setCustomSections(updated);
                                              }}
                                              className="text-xs h-7 flex-1"
                                              placeholder="Section title"
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                              onClick={() =>
                                                setCustomSections((prev) =>
                                                  prev.filter((_, i) => i !== idx),
                                                )
                                              }
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Assemble button */}
                                    <Button
                                      type="button"
                                      onClick={handleAssemble}
                                      className="w-full bg-phase-5 hover:bg-phase-5/90 text-white"
                                    >
                                      <Layers className="h-4 w-4 mr-2" />
                                      Assemble Proposal
                                    </Button>
                                  </CardContent>
                                </Card>

                                {/* Assembled preview */}
                                {assembledContent && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                  >
                                    {/* Stats bar */}
                                    <Card className="border-phase-5/20">
                                      <CardContent className="p-3">
                                        <div className="flex items-center gap-3 flex-wrap text-xs">
                                          <span className="text-gray-900 font-medium">
                                            Assembly Stats
                                          </span>
                                          <Badge variant="outline" className="text-[10px]">
                                            {countWords(assembledContent).toLocaleString()} words
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] border-amber-200 text-amber-500 bg-amber-50"
                                          >
                                            {countFlags(assembledContent, "CITATION NEEDED")} [CITATION
                                            NEEDED]
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] border-blue-200 text-blue-500 bg-blue-50"
                                          >
                                            {countFlags(assembledContent, "USER INPUT NEEDED")} [USER
                                            INPUT NEEDED]
                                          </Badge>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Placeholder Resolution Tracker */}
                                    <PlaceholderTracker projectId={projectId} />

                                    {/* AI Polish option */}
                                    {!showPolishPrompt ? (
                                      <Card className="border-phase-5/15 bg-phase-5/5">
                                        <CardContent className="p-3 flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-phase-5" />
                                            <div>
                                              <p className="text-xs font-medium text-gray-900">
                                                Polish with AI
                                              </p>
                                              <p className="text-[11px] text-gray-500">
                                                Generate a prompt to check consistency, flow, and
                                                cross-references.
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => setShowPolishPrompt(true)}
                                          >
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            Polish
                                          </Button>
                                        </CardContent>
                                      </Card>
                                    ) : (
                                      <StepExecutor
                                        templateId={getTemplateId(8)}
                                        projectId={projectId}
                                        phase={5}
                                        step={8}
                                        title="Proposal Polish"
                                        description="Review the assembled proposal for consistency, flow, and narrative coherence."
                                        additionalFields={[
                                          {
                                            name: "assembledProposal",
                                            label: "Assembled proposal (auto-filled from sections above)",
                                            type: "textarea" as const,
                                            placeholder: "",
                                            required: true,
                                            defaultValue: assembledContent || "",
                                          },
                                        ]}
                                        onComplete={() => {
                                          loadDocuments(projectId);
                                        }}
                                      />
                                    )}

                                    {/* Citation Resolution option */}
                                    {!showCitationResolver ? (
                                      <Card className="border-amber-200/50 bg-amber-50/50">
                                        <CardContent className="p-3 flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-amber-600" />
                                            <div>
                                              <p className="text-xs font-medium text-foreground">
                                                Resolve Citations
                                              </p>
                                              <p className="text-[11px] text-muted-foreground">
                                                Generate suggested references for all [CITATION NEEDED] markers.
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => setShowCitationResolver(true)}
                                          >
                                            <BookOpen className="h-3 w-3 mr-1" />
                                            Resolve
                                          </Button>
                                        </CardContent>
                                      </Card>
                                    ) : (
                                      <StepExecutor
                                        templateId="phase5.citation-resolver"
                                        projectId={projectId}
                                        phase={5}
                                        step={8}
                                        title="Citation Resolution Assistant"
                                        description="Generate suggested references for all [CITATION NEEDED] markers in your assembled proposal."
                                        additionalFields={[
                                          {
                                            name: "assembledProposal",
                                            label: "Assembled proposal (auto-filled)",
                                            type: "textarea" as const,
                                            placeholder: "",
                                            required: true,
                                            defaultValue: assembledContent || "",
                                          },
                                        ]}
                                        onComplete={() => {
                                          loadDocuments(projectId);
                                        }}
                                      />
                                    )}

                                    {/* Export options */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={handleDownloadMd}
                                      >
                                        <Download className="h-3.5 w-3.5 mr-1.5" />
                                        Download as .md
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={handleDownloadDocx}
                                      >
                                        <Download className="h-3.5 w-3.5 mr-1.5" />
                                        Download as .docx
                                      </Button>
                                    </div>

                                    {/* Post-step stats if complete */}
                                    {isComplete && (
                                      <PostStepStats
                                        canonicalName="Complete_Proposal.md"
                                        getDocContent={getDocContent}
                                      />
                                    )}
                                  </motion.div>
                                )}
                              </div>
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

        {/* ── Phase Complete CTA ─────────────────────────────────────────── */}
        <PhaseCompleteCTA projectId={projectId} phase={5} phaseCompletion={phaseCompletion} />
      </motion.div>
    </TooltipProvider>
  );
}

// ─── Locked Step Message ────────────────────────────────────────────────────

function LockedStepMessage({ stepNum }: { stepNum: number }) {
  const prevStepName = PHASE_5.steps[stepNum - 2]?.name || "previous step";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <Lock className="h-5 w-5 text-gray-300" />
      <div>
        <p className="text-sm font-medium text-gray-500">Step locked</p>
        <p className="text-xs text-gray-400">
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
        <span className="text-gray-900 font-medium">{canonicalName}</span>
        <Badge variant="outline" className="text-[10px]">
          {wc.toLocaleString()} words
        </Badge>
        {citCount > 0 && (
          <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-500 bg-amber-50">
            {citCount} [CITATION NEEDED]
          </Badge>
        )}
        {inputCount > 0 && (
          <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-500 bg-blue-50">
            {inputCount} [USER INPUT NEEDED]
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
