"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  Eye,
  FileSearch,
  BrainCircuit,
  Shield,
  Sparkles,
  Lock,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  ArrowRight,
  GitCompare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { useProgressStore } from "@/stores/progress-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { PHASE_DEFINITIONS } from "@/lib/constants";
import { storage } from "@/lib/storage";
import type { StepStatus } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StepExecutor } from "@/components/phase/StepExecutor";
import { MarkdownRenderer } from "@/components/document/MarkdownRenderer";

// ─── Phase 6 definition ────────────────────────────────────────────────────

const PHASE_6 = PHASE_DEFINITIONS[5];

// ─── Types ─────────────────────────────────────────────────────────────────

interface StepMeta {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tooltip: string;
}

// ─── Step metadata ─────────────────────────────────────────────────────────

const STEP_META: Record<number, StepMeta> = {
  1: {
    icon: Eye,
    description:
      "Simulate a 3-reviewer panel evaluating your proposal with scores, verdicts, and ranked weaknesses.",
    tooltip:
      "Mock reviews identify blind spots before real reviewers do. Three simulated reviewers with different perspectives expose weaknesses you might miss.",
  },
  2: {
    icon: BrainCircuit,
    description:
      "Audit deployment of all 16 Evaluator Psychology (EP) persuasion tags across your proposal.",
    tooltip:
      "EP tags are persuasion techniques that influence reviewers. This audit ensures you've deployed all 16 strategically.",
  },
  3: {
    icon: Shield,
    description:
      "Verify compliance with funder requirements and coverage of all evaluation criteria.",
    tooltip:
      "Administrative non-compliance causes instant rejection. This check catches formatting, content, and requirement gaps before submission.",
  },
  4: {
    icon: Sparkles,
    description:
      "Produce an optimized final version addressing all weaknesses from review, EP audit, and compliance reports.",
    tooltip:
      "Combines insights from all three reviews into a single, optimized proposal that addresses every identified weakness.",
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

// ─── Helpers ───────────────────────────────────────────────────────────────

function countWords(content: string): number {
  return content
    .replace(/[#*`>\-|=]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ─── Mock Review Result UI ─────────────────────────────────────────────────

function MockReviewResultUI({ content }: { content: string }) {
  // Parse reviewers
  const reviewerRegex = /####\s*REVIEWER\s*(\d):\s*(.+)\n([\s\S]*?)(?=####\s*REVIEWER|\n---|\n###)/gi;
  const reviewers: { name: string; expertise: string; disposition: string }[] = [];
  let match;
  while ((match = reviewerRegex.exec(content)) !== null) {
    const block = match[3];
    const expertise = block.match(/\*\*Expertise:\*\*\s*(.+)/i)?.[1] || "N/A";
    const disposition = block.match(/\*\*Disposition:\*\*\s*(.+)/i)?.[1] || "N/A";
    reviewers.push({ name: match[2].trim(), expertise: expertise.trim(), disposition: disposition.trim() });
  }

  // Parse verdict
  const verdictMatch = content.match(/VERDICT:\s*(WOULD FUND|BORDERLINE|WOULD NOT FUND)/i);
  const verdict = verdictMatch?.[1]?.toUpperCase() || "UNKNOWN";
  const verdictColor =
    verdict === "WOULD FUND"
      ? "bg-success/20 text-success border-success/30"
      : verdict === "BORDERLINE"
        ? "bg-warning/20 text-warning border-warning/30"
        : "bg-error/20 text-error border-error/30";

  // Parse score table rows
  const scoreRegex = /\|\s*(.+?)\s*\|\s*(\d+(?:\.\d+)?)\s*\/\s*10\s*\|\s*(\d+(?:\.\d+)?)\s*\/\s*10\s*\|\s*(\d+(?:\.\d+)?)\s*\/\s*10\s*\|\s*(\d+(?:\.\d+)?)\s*\/\s*10\s*\|/g;
  const scores: { criterion: string; r1: number; r2: number; r3: number; avg: number }[] = [];
  while ((match = scoreRegex.exec(content)) !== null) {
    if (match[1].includes("---") || match[1].toLowerCase().includes("criterion")) continue;
    scores.push({
      criterion: match[1].replace(/\*+/g, "").trim(),
      r1: parseFloat(match[2]),
      r2: parseFloat(match[3]),
      r3: parseFloat(match[4]),
      avg: parseFloat(match[5]),
    });
  }

  // Parse weakness list
  const weaknessRegex = /\d+\.\s*\*\*\[(CRITICAL|MAJOR|MINOR)\]\*\*\s*(.+)/gi;
  const weaknesses: { severity: string; text: string }[] = [];
  while ((match = weaknessRegex.exec(content)) !== null) {
    weaknesses.push({ severity: match[1].toUpperCase(), text: match[2].trim() });
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Reviewer Cards */}
      {reviewers.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {reviewers.map((r, i) => (
            <Card key={i} className="border-phase-6/20 bg-phase-6/5">
              <CardContent className="p-3 space-y-1.5">
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-[11px] text-muted-foreground">{r.expertise}</p>
                <Badge
                  className={cn(
                    "text-[10px]",
                    r.disposition.toLowerCase().includes("supportive")
                      ? "bg-success/20 text-success"
                      : r.disposition.toLowerCase().includes("critical")
                        ? "bg-error/20 text-error"
                        : "bg-info/20 text-info",
                  )}
                >
                  {r.disposition}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verdict */}
      <Card className={cn("border", verdictColor)}>
        <CardContent className="p-4 text-center">
          <p className="text-lg font-heading font-bold">{verdict}</p>
        </CardContent>
      </Card>

      {/* Score Table */}
      {scores.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border/30 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Criterion</th>
                {reviewers.slice(0, 3).map((r, i) => (
                  <th key={i} className="px-3 py-2 text-center font-medium text-muted-foreground">
                    R{i + 1}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-medium text-phase-6">Avg</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((row, i) => (
                <tr key={i} className={cn("border-t border-border/20", row.criterion.includes("OVERALL") && "bg-phase-6/5 font-medium")}>
                  <td className="px-3 py-2 text-foreground">{row.criterion}</td>
                  <td className="px-3 py-2 text-center">{row.r1}/10</td>
                  <td className="px-3 py-2 text-center">{row.r2}/10</td>
                  <td className="px-3 py-2 text-center">{row.r3}/10</td>
                  <td className="px-3 py-2 text-center text-phase-6 font-medium">{row.avg}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Ranked Weaknesses
          </p>
          {weaknesses.map((w, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
                w.severity === "CRITICAL"
                  ? "border-error/20 bg-error/5"
                  : w.severity === "MAJOR"
                    ? "border-warning/20 bg-warning/5"
                    : "border-border/30 bg-muted/5",
              )}
            >
              <Badge
                className={cn(
                  "text-[9px] shrink-0 mt-0.5",
                  w.severity === "CRITICAL"
                    ? "bg-error/20 text-error"
                    : w.severity === "MAJOR"
                      ? "bg-warning/20 text-warning"
                      : "bg-muted/30 text-muted-foreground",
                )}
              >
                {w.severity}
              </Badge>
              <span className="text-foreground">{w.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EP Audit Result UI ───────────────────────────────────────────────────

function EPAuditResultUI({ content }: { content: string }) {
  const EP_TAGS = [
    { id: "EP-01", name: "Anchoring" },
    { id: "EP-02", name: "Social Proof" },
    { id: "EP-03", name: "Authority Signaling" },
    { id: "EP-04", name: "Scarcity / Urgency" },
    { id: "EP-05", name: "Loss Framing" },
    { id: "EP-06", name: "Narrative Transportation" },
    { id: "EP-07", name: "Cognitive Ease" },
    { id: "EP-08", name: "Specificity Bias" },
    { id: "EP-09", name: "Reciprocity / Value-First" },
    { id: "EP-10", name: "Consistency / Commitment" },
    { id: "EP-11", name: "Liking / Similarity" },
    { id: "EP-12", name: "Peak-End Rule" },
    { id: "EP-13", name: "Chunking / Processing Fluency" },
    { id: "EP-14", name: "Bandwagon Effect" },
    { id: "EP-15", name: "Contrast Principle" },
    { id: "EP-16", name: "Halo Effect" },
  ];

  // Parse status for each EP tag from the content
  const getTagStatus = (tagId: string): "deployed" | "partial" | "missing" => {
    const pattern = new RegExp(`${tagId.replace("-", "[-\\s]?")}[^|]*\\|[^|]*\\|\\s*(DEPLOYED|PARTIAL|MISSING)`, "i");
    const match = content.match(pattern);
    if (!match) return "missing";
    const status = match[1].toUpperCase();
    if (status === "DEPLOYED") return "deployed";
    if (status === "PARTIAL") return "partial";
    return "missing";
  };

  const tagStatuses = EP_TAGS.map((tag) => ({
    ...tag,
    status: getTagStatus(tag.id),
  }));

  const deployed = tagStatuses.filter((t) => t.status === "deployed").length;
  const partial = tagStatuses.filter((t) => t.status === "partial").length;
  const missing = tagStatuses.filter((t) => t.status === "missing").length;

  // Parse champion phrases
  const championRegex = />\s*"(.+?)"\s*\n\s*\*\*Why it works:\*\*\s*(.+)/gi;
  const champions: { phrase: string; reason: string }[] = [];
  let m;
  while ((m = championRegex.exec(content)) !== null) {
    champions.push({ phrase: m[1], reason: m[2] });
  }

  // Parse loss-frame effectiveness
  const lossMatch = content.match(/\*\*Current strength:\*\*\s*(Strong|Moderate|Weak|Absent)/i);
  const lossStrength = lossMatch?.[1] || "Unknown";

  return (
    <div className="space-y-4 mt-4">
      {/* EP Tag Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            EP Tag Deployment
          </p>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-success">{deployed} deployed</span>
            <span className="text-warning">{partial} partial</span>
            <span className="text-error">{missing} missing</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {tagStatuses.map((tag) => (
            <div
              key={tag.id}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2.5 py-2 text-[11px]",
                tag.status === "deployed"
                  ? "border-success/20 bg-success/5"
                  : tag.status === "partial"
                    ? "border-warning/20 bg-warning/5"
                    : "border-error/20 bg-error/5",
              )}
            >
              <span
                className={cn(
                  "font-mono text-[10px] font-bold",
                  tag.status === "deployed"
                    ? "text-success"
                    : tag.status === "partial"
                      ? "text-warning"
                      : "text-error",
                )}
              >
                {tag.id}
              </span>
              <span className="text-muted-foreground truncate">{tag.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Champion Phrases */}
      {champions.length > 0 && (
        <Card className="border-phase-6/20 bg-phase-6/5">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-medium text-phase-6 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Champion Phrases
            </p>
            {champions.slice(0, 5).map((c, i) => (
              <div key={i} className="rounded-md bg-background/50 p-2.5 text-[11px] space-y-1">
                <p className="text-foreground italic">&ldquo;{c.phrase}&rdquo;</p>
                <p className="text-muted-foreground">{c.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Loss-Frame Indicator */}
      <Card
        className={cn(
          "border",
          lossStrength === "Strong"
            ? "border-success/20 bg-success/5"
            : lossStrength === "Moderate"
              ? "border-warning/20 bg-warning/5"
              : "border-error/20 bg-error/5",
        )}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <p className="text-xs text-muted-foreground">Loss-Frame Effectiveness (EP-05):</p>
          <Badge
            className={cn(
              "text-[10px]",
              lossStrength === "Strong"
                ? "bg-success/20 text-success"
                : lossStrength === "Moderate"
                  ? "bg-warning/20 text-warning"
                  : "bg-error/20 text-error",
            )}
          >
            {lossStrength}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Compliance Result UI ─────────────────────────────────────────────────

function ComplianceResultUI({ content }: { content: string }) {
  // Parse compliance checklist items
  const checkRegex = /\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(PASS|FAIL)\s*\|\s*(.+?)\s*\|/gi;
  const checks: { requirement: string; status: "PASS" | "FAIL"; notes: string }[] = [];
  let m;
  while ((m = checkRegex.exec(content)) !== null) {
    if (m[1].includes("---") || m[1].toLowerCase().includes("requirement")) continue;
    checks.push({
      requirement: m[1].trim(),
      status: m[2].toUpperCase() as "PASS" | "FAIL",
      notes: m[3].trim(),
    });
  }

  // Parse coverage matrix
  const coverageRegex = /\|\s*(.+?)\s*\|\s*(\d+%?|N\/A|-)\s*\|\s*(.+?)\s*\|\s*(Full|Partial|Missing)\s*\|\s*(\d+\/\d+|-|N\/A)\s*\|/gi;
  const coverage: { criterion: string; weight: string; sections: string; status: string; score: string }[] = [];
  while ((m = coverageRegex.exec(content)) !== null) {
    if (m[1].includes("---") || m[1].toLowerCase().includes("criterion")) continue;
    coverage.push({
      criterion: m[1].trim(),
      weight: m[2].trim(),
      sections: m[3].trim(),
      status: m[4].trim(),
      score: m[5].trim(),
    });
  }

  // Parse missing items
  const missingRegex = /\d+\.\s*\*\*\[(CRITICAL|MAJOR|MINOR)\]\*\*\s*(.+)/gi;
  const missingItems: { severity: string; text: string }[] = [];
  while ((m = missingRegex.exec(content)) !== null) {
    missingItems.push({ severity: m[1].toUpperCase(), text: m[2].trim() });
  }

  const passCount = checks.filter((c) => c.status === "PASS").length;

  return (
    <div className="space-y-4 mt-4">
      {/* Compliance Checklist */}
      {checks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Compliance Checklist
            </p>
            <Badge
              className={cn(
                "text-[10px]",
                passCount === checks.length
                  ? "bg-success/20 text-success"
                  : passCount > checks.length / 2
                    ? "bg-warning/20 text-warning"
                    : "bg-error/20 text-error",
              )}
            >
              {passCount}/{checks.length} passed
            </Badge>
          </div>
          <div className="space-y-1">
            {checks.map((c, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
                  c.status === "PASS"
                    ? "border-success/20 bg-success/5"
                    : "border-error/20 bg-error/5",
                )}
              >
                {c.status === "PASS" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-error shrink-0" />
                )}
                <span className="flex-1 font-medium text-foreground">{c.requirement}</span>
                <span className="text-muted-foreground/70 text-[10px] max-w-[200px] truncate">{c.notes}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coverage Matrix */}
      {coverage.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Evaluation Criteria Coverage
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border/30 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/30">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Criterion</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Weight</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Coverage</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((row, i) => (
                  <tr key={i} className="border-t border-border/20">
                    <td className="px-3 py-2 text-foreground">{row.criterion}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{row.weight}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge
                        className={cn(
                          "text-[9px]",
                          row.status === "Full"
                            ? "bg-success/20 text-success"
                            : row.status === "Partial"
                              ? "bg-warning/20 text-warning"
                              : "bg-error/20 text-error",
                        )}
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Missing Items */}
      {missingItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Missing or Incomplete Items
          </p>
          {missingItems.map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
                item.severity === "CRITICAL"
                  ? "border-error/20 bg-error/5"
                  : item.severity === "MAJOR"
                    ? "border-warning/20 bg-warning/5"
                    : "border-border/30 bg-muted/5",
              )}
            >
              <Badge
                className={cn(
                  "text-[9px] shrink-0 mt-0.5",
                  item.severity === "CRITICAL"
                    ? "bg-error/20 text-error"
                    : item.severity === "MAJOR"
                      ? "bg-warning/20 text-warning"
                      : "bg-muted/30 text-muted-foreground",
                )}
              >
                {item.severity}
              </Badge>
              <span className="text-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Optimization Diff View ───────────────────────────────────────────────

function OptimizationDiffView({
  originalContent,
  optimizedContent,
  projectId,
  onAccept,
  onKeepOriginal,
}: {
  originalContent: string;
  optimizedContent: string;
  projectId: string;
  onAccept: () => void;
  onKeepOriginal: () => void;
}) {
  const [view, setView] = useState<"side-by-side" | "optimized">("optimized");

  const handleDownloadMd = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={view === "optimized" ? "default" : "outline"}
          onClick={() => setView("optimized")}
          className="text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Optimized Version
        </Button>
        <Button
          size="sm"
          variant={view === "side-by-side" ? "default" : "outline"}
          onClick={() => setView("side-by-side")}
          className="text-xs"
        >
          <GitCompare className="h-3 w-3 mr-1" />
          Side by Side
        </Button>
      </div>

      {view === "optimized" ? (
        <Card className="border-phase-6/20">
          <CardContent className="p-4 max-h-[600px] overflow-y-auto">
            <MarkdownRenderer content={optimizedContent} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Original</p>
            <Card className="border-border/30">
              <CardContent className="p-3 max-h-[500px] overflow-y-auto text-xs">
                <MarkdownRenderer content={originalContent} />
              </CardContent>
            </Card>
          </div>
          <div>
            <p className="text-xs font-medium text-phase-6 mb-2">Optimized</p>
            <Card className="border-phase-6/20">
              <CardContent className="p-3 max-h-[500px] overflow-y-auto text-xs">
                <MarkdownRenderer content={optimizedContent} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={onAccept} className="bg-phase-6 hover:bg-phase-6/90 text-white">
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          Accept Optimized Version
        </Button>
        <Button variant="outline" onClick={onKeepOriginal}>
          Keep Original
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownloadMd(optimizedContent, "Final_Proposal.md")}
          className="text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Download .md
        </Button>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Phase6Client({ projectId }: { projectId: string }) {
  const { setActiveProject, activeProject } = useProjectStore();
  const { progress, loadProgress, getPhaseCompletion, updateStepStatus } = useProgressStore();
  const { documents, loadDocuments, saveDocument } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [activeStep, setActiveStep] = useState<number | null>(1);
  const [step4Decision, setStep4Decision] = useState<"pending" | "accepted" | "kept-original">("pending");

  // ── Initialize ────────────────────────────────────────────────────────────

  useEffect(() => {
    setActiveProject(projectId);
    loadProgress(projectId);
    loadDocuments(projectId);
    setBreadcrumbs([
      { label: "Projects", href: "/projects" },
      { label: activeProject?.title || "Project", href: `/projects/${projectId}` },
      { label: "Phase 6: Review & Optimization" },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Phase progress ────────────────────────────────────────────────────────

  const phaseCompletion = getPhaseCompletion(6);
  const phase6Steps = PHASE_6.steps;

  const getStepStatus = useCallback(
    (stepNum: number): StepStatus => {
      return progress.phases[6]?.steps[stepNum] || "not-started";
    },
    [progress],
  );

  const getStepDocuments = useCallback(
    (stepNum: number) => {
      return documents.filter(
        (d) => d.projectId === projectId && d.phase === 6 && d.step === stepNum && d.isCurrent,
      );
    },
    [documents, projectId],
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

  // ── Template IDs ──────────────────────────────────────────────────────────

  const getTemplateId = (stepNum: number): string => {
    switch (stepNum) {
      case 1: return "phase6.step1-mock-review";
      case 2: return "phase6.step2-ep-audit";
      case 3: return "phase6.step3-compliance";
      case 4: return "phase6.step4-optimization";
      default: return "";
    }
  };

  // ── Step 4 handlers ───────────────────────────────────────────────────────

  const originalProposal = getDocContent("Complete_Proposal.md");

  const handleAcceptOptimized = useCallback(async () => {
    const optimizedContent = getDocContent("Final_Proposal.md");
    if (optimizedContent) {
      setStep4Decision("accepted");
    }
  }, [getDocContent]);

  const handleKeepOriginal = useCallback(async () => {
    if (originalProposal) {
      await saveDocument(projectId, {
        canonicalName: "Final_Proposal.md",
        content: originalProposal,
        phase: 6,
        step: 4,
        projectId,
        isCurrent: true,
        wordCount: countWords(originalProposal),
        version: 1,
      });
      updateStepStatus(projectId, 6, 4, "complete");
      setStep4Decision("kept-original");
    }
  }, [originalProposal, projectId, saveDocument, updateStepStatus]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <motion.div className="space-y-8" {...fadeInUp}>
        {/* ── Phase Header ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <PhaseIcon phase={6} size="lg" active />
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">{PHASE_6.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Evaluate your proposal through simulated peer review, EP psychology audit, and
              compliance checks, then produce an optimized final version.
            </p>
          </div>
        </div>

        {/* ── Progress Bar ───────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Phase Progress</span>
            <span>
              {phase6Steps.filter((s) => getStepStatus(s.step) === "complete").length} of{" "}
              {phase6Steps.length} steps
            </span>
          </div>
          <Progress value={phaseCompletion} className="h-1.5" />
        </div>

        {/* ── Info Card ──────────────────────────────────────────────────── */}
        <Card className="border-phase-6/15 bg-phase-6/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-phase-6 mt-0.5 shrink-0" />
              <div className="text-[11px] text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Why review before submission?</p>
                <p>
                  Most rejected proposals have addressable weaknesses. Simulated peer review catches
                  blind spots, the EP audit ensures maximum persuasive impact, and the compliance check
                  prevents administrative rejection. The final optimization pass integrates all findings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Steps ──────────────────────────────────────────────────────── */}
        <div className="space-y-0">
          {phase6Steps.map((stepDef, i) => {
            const status = getStepStatus(stepDef.step);
            const isActive = activeStep === stepDef.step;
            const isComplete = status === "complete";
            const isCurrent = status !== "not-started" && status !== "complete";
            const unlocked = isStepUnlocked(stepDef.step);
            const meta = STEP_META[stepDef.step];
            const StepIcon = meta?.icon;

            return (
              <div key={stepDef.step} className="relative">
                {/* Timeline line */}
                {i < phase6Steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-3.75 top-9 w-0.5 h-[calc(100%-20px)]",
                      isComplete ? "bg-phase-6" : "bg-border/50",
                    )}
                  />
                )}

                {/* Step header */}
                <button
                  onClick={() => setActiveStep(isActive ? null : stepDef.step)}
                  className={cn(
                    "flex w-full items-center gap-3 py-3 text-left transition-colors",
                    "hover:bg-muted/50 rounded-lg px-2 -mx-2",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isComplete
                        ? "border-phase-6 bg-phase-6 text-white"
                        : isCurrent
                          ? "border-phase-6 bg-transparent text-phase-6"
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
                      {!unlocked && (
                        <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground/50">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />
                          Locked
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] ml-auto",
                          isComplete
                            ? "border-phase-6/30 text-phase-6"
                            : isCurrent
                              ? "border-phase-6/20 text-phase-6/70"
                              : "border-border/30 text-muted-foreground/50",
                        )}
                      >
                        {stepStatusLabels[status]}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1">
                      {meta?.description}
                    </p>
                  </div>

                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground/50 transition-transform shrink-0",
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
                          <Card className="border-border/30 bg-muted/5">
                            <CardContent className="p-4 text-center">
                              <Lock className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground/50">
                                Complete step {stepDef.step - 1} to unlock this step.
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            {/* Step 2 context warning */}
                            {stepDef.step === 2 && (
                              <Card className="border-warning/30 bg-warning/5">
                                <CardContent className="p-3 flex items-start gap-2">
                                  <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                                  <p className="text-[11px] text-muted-foreground">
                                    <strong className="text-warning">Large prompt warning:</strong> This prompt is ~15K+ words with the full proposal.
                                    Use an AI with a large context window (Claude, GPT-4, Gemini Pro).
                                  </p>
                                </CardContent>
                              </Card>
                            )}

                            {/* StepExecutor */}
                            <StepExecutor
                              templateId={getTemplateId(stepDef.step)}
                              projectId={projectId}
                              phase={6}
                              step={stepDef.step}
                              title={stepDef.name}
                              description={meta?.description}
                              onComplete={() => {
                                loadDocuments(projectId);
                                loadProgress(projectId);
                              }}
                            />

                            {/* Post-paste special UIs */}
                            {stepDef.step === 1 && isComplete && (
                              <MockReviewResultUI content={getDocContent("Mock_Review_Report.md") || ""} />
                            )}

                            {stepDef.step === 2 && isComplete && (
                              <EPAuditResultUI content={getDocContent("EP_Audit_Report.md") || ""} />
                            )}

                            {stepDef.step === 3 && isComplete && (
                              <ComplianceResultUI content={getDocContent("Compliance_Report.md") || ""} />
                            )}

                            {stepDef.step === 4 && isComplete && originalProposal && step4Decision === "pending" && (
                              <OptimizationDiffView
                                originalContent={originalProposal}
                                optimizedContent={getDocContent("Final_Proposal.md") || ""}
                                projectId={projectId}
                                onAccept={handleAcceptOptimized}
                                onKeepOriginal={handleKeepOriginal}
                              />
                            )}

                            {stepDef.step === 4 && step4Decision !== "pending" && (
                              <Card className="border-success/20 bg-success/5">
                                <CardContent className="p-3 flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                  <p className="text-xs text-foreground">
                                    {step4Decision === "accepted"
                                      ? "Optimized version accepted as Final_Proposal.md"
                                      : "Original kept as Final_Proposal.md"}
                                  </p>
                                </CardContent>
                              </Card>
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
        {phaseCompletion === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <Card className="border-phase-6/30 bg-phase-6/5">
              <CardContent className="p-6 space-y-3">
                <CheckCircle2 className="h-8 w-8 text-phase-6 mx-auto" />
                <h2 className="text-lg font-heading font-bold text-foreground">Phase 6 Complete!</h2>
                <p className="text-sm text-muted-foreground">
                  Your proposal has been reviewed and optimized. Continue to Phase 7 for post-submission tools.
                </p>
                <Button
                  onClick={() => window.location.assign(`/projects/${projectId}/phase/7`)}
                  className="bg-phase-7 hover:bg-phase-7/90 text-white"
                >
                  Continue to Phase 7
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
