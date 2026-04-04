"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";

import { storage } from "@/lib/storage";
import { useDocumentStore } from "@/stores/document-store";
import { useProgressStore } from "@/stores/progress-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuickFillGIProps {
  projectId: string;
  /** Pre-fill values from project metadata */
  defaults?: {
    grantName?: string;
    funder?: string;
    country?: string;
    budgetRange?: string;
    grantScheme?: string;
  };
  onComplete?: () => void;
}

interface GIFormValues {
  grantName: string;
  funder: string;
  grantUrl: string;
  eligibility: string;
  evaluationCriteria: string;
  budgetLimit: string;
  duration: string;
  deadline: string;
  strategicPriorities: string;
  requiredSections: string;
  otherRequirements: string;
}

// ─── Template ───────────────────────────────────────────────────────────────

function assembleGrantIntelligence(v: GIFormValues): string {
  const notProvided = "[NOT PROVIDED — fill this in later via Phase 1 Step 3 for stronger downstream outputs]";

  return `# Grant Intelligence Report
## Quick-Fill Version
> This document was generated via Quick-Fill. For a comprehensive analysis, run the full Grant Intelligence step in Phase 1.

---

## Grant Program Overview

- **Grant Name:** ${v.grantName || notProvided}
- **Funding Body:** ${v.funder || notProvided}
- **Grant URL/Portal:** ${v.grantUrl || notProvided}
- **Maximum Duration:** ${v.duration || notProvided}

${v.grantName ? `The ${v.grantName} is administered by ${v.funder || "[funder not specified]"}.` : notProvided}

---

## Eligibility Requirements

${v.eligibility?.trim() || notProvided}

---

## Evaluation Criteria

${v.evaluationCriteria?.trim() || notProvided}

---

## Funding Parameters

- **Budget Limit:** ${v.budgetLimit || notProvided}
- **Duration:** ${v.duration || notProvided}

---

## Strategic Priorities

${v.strategicPriorities?.trim() || notProvided}

---

## Application Requirements

${v.requiredSections?.trim() ? `### Required Sections/Documents\n${v.requiredSections}` : notProvided}

${v.otherRequirements?.trim() ? `### Other Requirements\n${v.otherRequirements}` : ""}

---

## Timeline & Deadlines

- **Application Deadline:** ${v.deadline || notProvided}

---

## Intelligence Gaps

> The following areas were not covered in Quick-Fill mode. Consider running the full Grant Intelligence step (Phase 1, Step 3) to fill these gaps:

${!v.eligibility?.trim() ? "- Detailed eligibility requirements not provided\n" : ""}${!v.evaluationCriteria?.trim() ? "- Evaluation criteria and weightings not provided\n" : ""}${!v.strategicPriorities?.trim() ? "- Funder strategic priorities not analyzed\n" : ""}${!v.requiredSections?.trim() ? "- Required application sections not specified\n" : ""}- Past success rates and reviewer patterns not analyzed
- Implicit requirements not identified
- Full competitive landscape not assessed
`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function QuickFillGI({ projectId, defaults, onComplete }: QuickFillGIProps) {
  const { saveDocument, loadDocuments } = useDocumentStore();
  const { updateStepStatus } = useProgressStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<GIFormValues>({
    grantName: defaults?.grantName || defaults?.grantScheme || "",
    funder: defaults?.funder || "",
    grantUrl: "",
    eligibility: "",
    evaluationCriteria: "",
    budgetLimit: defaults?.budgetRange || "",
    duration: "",
    deadline: "",
    strategicPriorities: "",
    requiredSections: "",
    otherRequirements: "",
  });

  const updateField = useCallback(
    (field: keyof GIFormValues, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!form.grantName.trim()) {
      toast.error("Grant name is required");
      return;
    }

    setSaving(true);

    try {
      const content = assembleGrantIntelligence(form);
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      const doc = {
        id: storage.createId(),
        projectId,
        phase: 1,
        step: 3,
        name: "Grant Intelligence (Quick-Fill)",
        canonicalName: "Grant_Intelligence.md",
        content,
        format: "md" as const,
        version: 1,
        isCurrent: true,
        wordCount,
        createdAt: new Date().toISOString(),
      };

      await saveDocument(projectId, doc);
      updateStepStatus(projectId, 1, 3, "complete");
      await loadDocuments(projectId);

      setSaved(true);
      toast.success("Grant Intelligence document created");
      onComplete?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save Grant Intelligence");
    } finally {
      setSaving(false);
    }
  }, [form, projectId, saveDocument, updateStepStatus, loadDocuments, onComplete]);

  // ── Saved state ───────────────────────────────────────────────────────

  if (saved) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">
              Grant Intelligence created
            </p>
            <p className="text-xs text-emerald-600">
              You can enhance this later by running the full Grant Intelligence step.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSaved(false)}
            className="text-emerald-600"
          >
            Edit
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#4F7DF3]" />
          Quick-Fill Grant Intelligence
        </CardTitle>
        <CardDescription className="text-xs">
          Fill in what you know about the grant. Empty fields will be marked as gaps.
          You can run the full Grant Intelligence step later for a more comprehensive analysis.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Row 1: Grant Name + Funder */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="qi-grant-name">
              Grant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="qi-grant-name"
              placeholder="e.g., FRGS, ERC Starting Grant"
              value={form.grantName}
              onChange={(e) => updateField("grantName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="qi-funder">
              Funding Body
            </Label>
            <Input
              id="qi-funder"
              placeholder="e.g., MOHE, European Research Council"
              value={form.funder}
              onChange={(e) => updateField("funder", e.target.value)}
            />
          </div>
        </div>

        {/* Row 2: URL + Deadline */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="qi-url">
              Grant URL / Portal
            </Label>
            <Input
              id="qi-url"
              placeholder="https://..."
              value={form.grantUrl}
              onChange={(e) => updateField("grantUrl", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="qi-deadline">
              Application Deadline
            </Label>
            <Input
              id="qi-deadline"
              placeholder="e.g., 30 June 2026"
              value={form.deadline}
              onChange={(e) => updateField("deadline", e.target.value)}
            />
          </div>
        </div>

        {/* Row 3: Budget + Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="qi-budget">
              Budget Limit
            </Label>
            <Input
              id="qi-budget"
              placeholder="e.g., RM 250,000 or $500,000"
              value={form.budgetLimit}
              onChange={(e) => updateField("budgetLimit", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="qi-duration">
              Maximum Duration
            </Label>
            <Input
              id="qi-duration"
              placeholder="e.g., 24 months, 3 years"
              value={form.duration}
              onChange={(e) => updateField("duration", e.target.value)}
            />
          </div>
        </div>

        {/* Eligibility */}
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="qi-eligibility">
            Eligibility Requirements
          </Label>
          <textarea
            id="qi-eligibility"
            placeholder="Paste or type the key eligibility criteria (who can apply, institutional requirements, career stage, etc.)"
            value={form.eligibility}
            onChange={(e) => updateField("eligibility", e.target.value)}
            className="w-full min-h-[80px] rounded-lg border border-border bg-background p-2.5 text-sm placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]/30"
          />
        </div>

        {/* Evaluation Criteria */}
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="qi-criteria">
            Evaluation Criteria
          </Label>
          <textarea
            id="qi-criteria"
            placeholder="Paste the evaluation criteria and their weightings if available (e.g., Novelty 30%, Methodology 25%, Impact 20%, Team 15%, Budget 10%)"
            value={form.evaluationCriteria}
            onChange={(e) => updateField("evaluationCriteria", e.target.value)}
            className="w-full min-h-[80px] rounded-lg border border-border bg-background p-2.5 text-sm placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]/30"
          />
        </div>

        {/* Strategic Priorities */}
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="qi-priorities">
            Funder Strategic Priorities
          </Label>
          <textarea
            id="qi-priorities"
            placeholder="Any stated priority areas, national agenda alignment, or thematic focus areas"
            value={form.strategicPriorities}
            onChange={(e) => updateField("strategicPriorities", e.target.value)}
            className="w-full min-h-[60px] rounded-lg border border-border bg-background p-2.5 text-sm placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]/30"
          />
        </div>

        {/* Required Sections */}
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="qi-sections">
            Required Application Sections
          </Label>
          <textarea
            id="qi-sections"
            placeholder="List the sections/documents required in the application (e.g., Executive Summary, Research Background, Methodology, Budget, CV, etc.)"
            value={form.requiredSections}
            onChange={(e) => updateField("requiredSections", e.target.value)}
            className="w-full min-h-[60px] rounded-lg border border-border bg-background p-2.5 text-sm placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]/30"
          />
        </div>

        {/* Save */}
        <Button
          className="w-full"
          disabled={!form.grantName.trim() || saving}
          onClick={handleSave}
        >
          {saving ? "Creating..." : "Create Grant Intelligence Document"}
        </Button>
      </CardContent>
    </Card>
  );
}
