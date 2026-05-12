"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Users,
  DollarSign,
  FileCheck,
  Plus,
  Trash2,
  Download,
  Eye,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { getProjectIdFromUrl } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { useProgressStore } from "@/stores/progress-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { PHASE_DEFINITIONS, CURRENCIES } from "@/lib/constants";
import type { StepStatus } from "@/lib/types";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/document/MarkdownRenderer";
import { StepExecutor } from "@/components/phase/StepExecutor";
import { JumpToStartButton } from "@/components/shared/JumpToStartButton";
import { PhaseCompleteCTA } from "@/components/shared/PhaseCompleteCTA";
import { PhaseDangerZone } from "@/components/shared/PhaseDangerZone";

// ─── Phase 4 definition ────────────────────────────────────────────────────

const PHASE_4 = PHASE_DEFINITIONS[3];

// ─── Types ─────────────────────────────────────────────────────────────────

interface StepMeta {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface TeamRole {
  id: string;
  role: string;
  name: string;
  institution: string;
  responsibility: string;
  effort: number;
}

// Round 15.2: parsed from the Section 7 JSON scaffold in Team_Strategy.md.
// Recommendation only — the user overrides everything in the Role Matrix.
interface RoleRecommendation {
  role: string;
  responsibility: string;
  suggested_effort_pct: number;
}

interface BudgetRow {
  id: string;
  category: BudgetCategory;
  item: string;
  amounts: number[]; // one per year
  justification: string;
  vot?: string; // Round 17: MOHE Vot code (e.g. "11000"). Optional for backward compat with pre-R17 saves.
}

type BudgetCategory =
  | "Personnel"
  | "Equipment"
  | "Travel"
  | "Materials"
  | "Publication"
  | "Other";

const BUDGET_CATEGORIES: BudgetCategory[] = [
  "Personnel",
  "Equipment",
  "Travel",
  "Materials",
  "Publication",
  "Other",
];

// Round 17: per-scheme cap percentages. Cap display in BudgetTableUI is gated on
// the project's grantScheme matching one of these keys. For schemes not listed,
// cap chips do not render. Source: MOHE GET 2026 Transformative scheme guidelines
// (Travel ≤ 20% of project budget, Equipment ≤ 30%, no overheads).
type SchemeCaps = {
  travelPct: number;
  equipmentPct: number;
};

const SCHEME_CAPS: Record<string, SchemeCaps> = {
  GET: { travelPct: 20, equipmentPct: 30 },
};

function getSchemeCaps(grantScheme: string | null | undefined): SchemeCaps | null {
  if (!grantScheme) return null;
  // Resilient matching: project's grantScheme may be "GET", "MOHE GET", "GET 2026", etc.
  if (grantScheme.includes("GET")) return SCHEME_CAPS.GET;
  return null;
}

// ─── Step metadata ─────────────────────────────────────────────────────────

const STEP_META: Record<number, StepMeta> = {
  1: {
    icon: Users,
    description:
      "Commit to four team-shape decisions that drive your budget and your proposal collaborator section.",
  },
  2: {
    icon: DollarSign,
    description:
      "Construct a detailed, multi-year budget with itemized costs and justifications.",
  },
  3: {
    icon: FileCheck,
    description:
      "Write budget justification narrative, verify compliance, and assemble Budget_Justification.md.",
  },
};

// ─── Status helpers ────────────────────────────────────────────────────────

const stepStatusLabels: Record<StepStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "prompt-copied": "Prompt Copied",
  "output-pasted": "Output Pasted",
  complete: "Complete",
  "not-applicable": "Not Applicable",
};

// ─── Animation variants ─────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

const stepExpandVariants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" as const },
  expanded: { height: "auto", opacity: 1, overflow: "visible" as const },
};

// ─── localStorage helpers ──────────────────────────────────────────────────

function getRolesKey(projectId: string) {
  return `grant-suite-phase4-roles-${projectId}`;
}
function getBudgetKey(projectId: string) {
  return `grant-suite-phase4-budget-${projectId}`;
}
function getBudgetMetaKey(projectId: string) {
  return `grant-suite-phase4-budget-meta-${projectId}`;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return fallback;
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Round 15.3: extract the highest digit run from a budget range string.
// Handles formats from CreateProjectDrawer's getBudgetRangesForScheme:
//   "RM 100,000 – RM 250,000" → 250000
//   "Up to RM 60,000" → 60000
//   "< RM 100,000" → 100000
// Returns 0 if nothing parseable.

function parseBudgetCeiling(rangeStr: string | undefined): number {
  if (!rangeStr) return 0;
  const matches = rangeStr.replace(/[^\d,–-]/g, " ").match(/[\d,]+/g);
  if (!matches) return 0;
  const numbers = matches
    .map((m) => parseInt(m.replace(/,/g, ""), 10))
    .filter((n) => !isNaN(n) && n > 0);
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
}

// ─── Role Matrix UI ────────────────────────────────────────────────────────
//
// Round 15 (2026-05-12): the previous auto-extraction parser was removed.
// Team_Strategy.md is a SHAPE commitment document (four [USER INPUT NEEDED]
// decisions about team architecture), not a roster. Names, institutions, and
// effort percentages are entered directly here by the user and filed into the
// MyGRANTS submission form. The roster does not exist in the strategy doc by
// design (see v20 Round 14 / Round 15 notes).

function RoleMatrixUI({
  roles,
  setRoles,
  step1Output,
}: {
  roles: TeamRole[];
  setRoles: (roles: TeamRole[]) => void;
  step1Output: string | null;
}) {
  const updateRole = (id: string, field: keyof TeamRole, value: string | number) => {
    setRoles(
      roles.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const addRole = () => {
    setRoles([
      ...roles,
      {
        id: crypto.randomUUID(),
        role: "",
        name: "",
        institution: "",
        responsibility: "",
        effort: 0,
      },
    ]);
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
  };

  // Round 15.2: import recommendations from the Section 7 JSON scaffold in
  // Team_Strategy.md. Appends rows with role/responsibility/effort pre-filled,
  // leaves name and institution blank for the user to fill.
  const recommendations = useMemo(
    () => (step1Output ? parseTeamRecommendations(step1Output) : []),
    [step1Output],
  );
  const hasRecommendations = recommendations.length > 0;

  const importRecommendations = () => {
    if (recommendations.length === 0) return;
    const newRoles: TeamRole[] = recommendations.map((rec) => ({
      id: crypto.randomUUID(),
      role: rec.role,
      name: "",
      institution: "",
      responsibility: rec.responsibility,
      effort: rec.suggested_effort_pct,
    }));
    setRoles([...roles, ...newRoles]);
  };

  return (
    <Card className="border-phase-4/30 bg-phase-4/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-phase-4" />
            <p className="text-sm font-medium text-foreground">Role Matrix</p>
            <Badge className="text-[10px] bg-phase-4/20 text-phase-4">
              {roles.length} roles
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {hasRecommendations && (
              <Button
                size="sm"
                variant="ghost"
                onClick={importRecommendations}
                className="h-7 text-xs gap-1"
                title={`Append ${recommendations.length} recommended role${recommendations.length === 1 ? "" : "s"} from Team_Strategy.md (you fill name and institution)`}
              >
                <Sparkles className="h-3 w-3" /> Import from Team Strategy
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={addRole} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Add Role
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-phase-4/20">
                <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Role</th>
                <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Name</th>
                <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">
                  Institution
                </th>
                <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">
                  Responsibility
                </th>
                <th className="text-left py-1.5 px-2 text-muted-foreground font-medium w-20">
                  Effort %
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b border-border">
                  <td className="py-1.5 px-1">
                    <Input
                      value={role.role}
                      onChange={(e) => updateRole(role.id, "role", e.target.value)}
                      className="h-7 text-xs"
                      placeholder="e.g., PI"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <Input
                      value={role.name}
                      onChange={(e) => updateRole(role.id, "name", e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Name"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <Input
                      value={role.institution}
                      onChange={(e) => updateRole(role.id, "institution", e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Institution"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <Input
                      value={role.responsibility}
                      onChange={(e) => updateRole(role.id, "responsibility", e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Responsibility"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <Input
                      type="number"
                      value={role.effort || ""}
                      onChange={(e) => updateRole(role.id, "effort", parseInt(e.target.value) || 0)}
                      className="h-7 text-xs w-16"
                      min={0}
                      max={100}
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRole(role.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {roles.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Your Team Strategy commits to team shape, not specific names. Add each
            team member you&apos;ll list in your MyGRANTS submission form here.
          </p>
        )}
        {/* Round 15.3: explicit advance trigger to Phase 4 Step 2 */}
        <div className="mt-3 pt-3 border-t border-phase-4/20 flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("grant-suite:expand-step", {
                  detail: { phase: 4, step: 2 },
                }),
              );
            }}
            className="h-8 gap-1 bg-phase-4 hover:bg-phase-4/90 text-white"
          >
            Continue
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Budget Table UI ───────────────────────────────────────────────────────

function BudgetTableUI({
  rows,
  setRows,
  years,
  budgetLimit,
  currency,
  grantScheme,
}: {
  rows: BudgetRow[];
  setRows: (rows: BudgetRow[]) => void;
  years: number;
  budgetLimit: number;
  currency: string;
  grantScheme: string | null | undefined;
}) {
  const schemeCaps = getSchemeCaps(grantScheme);
  const updateRow = (id: string, field: string, value: string | number | number[]) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const updateAmount = (id: string, yearIdx: number, value: number) => {
    setRows(
      rows.map((r) => {
        if (r.id !== id) return r;
        const amounts = [...r.amounts];
        amounts[yearIdx] = value;
        return { ...r, amounts };
      }),
    );
  };

  const addRow = (category: BudgetCategory) => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        category,
        item: "",
        amounts: Array(years).fill(0),
        justification: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const grandTotal = rows.reduce(
    (sum, r) => sum + r.amounts.reduce((a, b) => a + b, 0),
    0,
  );

  const yearTotals = Array.from({ length: years }, (_, yi) =>
    rows.reduce((sum, r) => sum + (r.amounts[yi] || 0), 0),
  );

  const isOverBudget = budgetLimit > 0 && grandTotal > budgetLimit;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const exportCSV = () => {
    const headers = [
      "Category",
      "Item",
      ...Array.from({ length: years }, (_, i) => `Year ${i + 1}`),
      "Total",
      "Justification",
    ];
    const csvRows = [headers.join(",")];

    for (const row of rows) {
      const rowTotal = row.amounts.reduce((a, b) => a + b, 0);
      csvRows.push(
        [
          `"${row.category}"`,
          `"${row.item}"`,
          ...row.amounts.map(String),
          String(rowTotal),
          `"${row.justification.replace(/"/g, '""')}"`,
        ].join(","),
      );
    }

    // Totals row
    csvRows.push(
      ["", "TOTAL", ...yearTotals.map(String), String(grandTotal), ""].join(","),
    );

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budget.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-phase-4/30 bg-phase-4/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-phase-4" />
            <p className="text-sm font-medium text-foreground">Budget Table</p>
          </div>
          <Button size="sm" variant="ghost" onClick={exportCSV} className="h-7 text-xs gap-1">
            <Download className="h-3 w-3" /> Export CSV
          </Button>
        </div>

        {/* Budget vs limit indicator + per-year totals */}
        {budgetLimit > 0 && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 mb-3 text-xs space-y-1",
              isOverBudget
                ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                : "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
            )}
          >
            <div className="flex items-center justify-between">
              <span>
                Total: {currency} {fmt(grandTotal)}
              </span>
              <span>
                Limit: {currency} {fmt(budgetLimit)}
              </span>
              <span>
                {isOverBudget
                  ? `Over by ${currency} ${fmt(grandTotal - budgetLimit)}`
                  : `Remaining: ${currency} ${fmt(budgetLimit - grandTotal)}`}
              </span>
            </div>
            {/* Round 17: per-year totals strip */}
            <div className="flex items-center justify-between text-[10px] opacity-80 pt-1 border-t border-current/10">
              {yearTotals.map((yt, i) => (
                <span key={i}>
                  Year {i + 1}: {currency} {fmt(yt)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Round 17: scheme-cap compliance chip strip (GET only for now) */}
        {schemeCaps && grandTotal > 0 && (() => {
          const travelTotal = rows
            .filter((r) => r.category === "Travel")
            .reduce((sum, r) => sum + r.amounts.reduce((a, b) => a + b, 0), 0);
          const equipmentTotal = rows
            .filter((r) => r.category === "Equipment")
            .reduce((sum, r) => sum + r.amounts.reduce((a, b) => a + b, 0), 0);
          const travelPct = (travelTotal / grandTotal) * 100;
          const equipmentPct = (equipmentTotal / grandTotal) * 100;
          const chipClass = (pct: number, cap: number) => {
            if (pct > cap)
              return "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400";
            if (pct > cap * 0.8)
              return "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400";
            return "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400";
          };
          return (
            <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px]">
              <span className="text-muted-foreground">Funder caps:</span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5",
                  chipClass(travelPct, schemeCaps.travelPct),
                )}
              >
                Travel {travelPct.toFixed(1)}% / {schemeCaps.travelPct}%
                {travelPct > schemeCaps.travelPct ? " over" : ""}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5",
                  chipClass(equipmentPct, schemeCaps.equipmentPct),
                )}
              >
                Equipment {equipmentPct.toFixed(1)}% / {schemeCaps.equipmentPct}%
                {equipmentPct > schemeCaps.equipmentPct ? " over" : ""}
              </span>
            </div>
          );
        })()}

        {/* Categories */}
        <div className="space-y-4 overflow-x-auto">
          {BUDGET_CATEGORIES.map((cat) => {
            const catRows = rows.filter((r) => r.category === cat);
            const catTotal = catRows.reduce(
              (sum, r) => sum + r.amounts.reduce((a, b) => a + b, 0),
              0,
            );

            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-foreground">{cat}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {currency} {fmt(catTotal)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addRow(cat)}
                      className="h-5 text-[10px] gap-0.5 px-1.5"
                    >
                      <Plus className="h-2.5 w-2.5" /> Add
                    </Button>
                  </div>
                </div>
                {catRows.length > 0 && (
                  <table className="w-full text-xs mb-1">
                    <thead>
                      <tr className="border-b border-phase-4/20">
                        <th className="text-left py-1 px-1 text-muted-foreground font-medium w-56">
                          Item
                        </th>
                        {Array.from({ length: years }, (_, i) => (
                          <th
                            key={i}
                            className="text-right py-1 px-1 text-muted-foreground font-medium w-20"
                          >
                            Year {i + 1}
                          </th>
                        ))}
                        <th className="text-right py-1 px-1 text-muted-foreground font-medium w-20">
                          Total
                        </th>
                        <th className="text-left py-1 px-1 text-muted-foreground font-medium">
                          Justification
                        </th>
                        <th className="w-6" />
                      </tr>
                    </thead>
                    <tbody>
                      {catRows.map((row) => {
                        const rowTotal = row.amounts.reduce((a, b) => a + b, 0);
                        return (
                          <tr key={row.id} className="border-b border-border">
                            <td className="py-1 px-0.5">
                              <div className="flex items-center gap-1">
                                {row.vot && (
                                  <span
                                    className="shrink-0 rounded bg-phase-4/15 text-phase-4 px-1 py-0.5 text-[9px] font-mono"
                                    title={`MOHE Vot ${row.vot}`}
                                  >
                                    {row.vot}
                                  </span>
                                )}
                                <Input
                                  value={row.item}
                                  onChange={(e) => updateRow(row.id, "item", e.target.value)}
                                  className="h-6 text-[11px]"
                                  placeholder="Item name"
                                  title={row.item || undefined}
                                />
                              </div>
                            </td>
                            {Array.from({ length: years }, (_, yi) => (
                              <td key={yi} className="py-1 px-0.5">
                                <Input
                                  type="number"
                                  value={row.amounts[yi] || ""}
                                  onChange={(e) =>
                                    updateAmount(row.id, yi, parseFloat(e.target.value) || 0)
                                  }
                                  className="h-6 text-[11px] text-right"
                                  min={0}
                                />
                              </td>
                            ))}
                            <td className="py-1 px-1 text-right text-foreground font-medium">
                              {fmt(rowTotal)}
                            </td>
                            <td className="py-1 px-0.5">
                              <Input
                                value={row.justification}
                                onChange={(e) =>
                                  updateRow(row.id, "justification", e.target.value)
                                }
                                className="h-6 text-[11px]"
                                placeholder="Justification"
                                title={row.justification || undefined}
                              />
                            </td>
                            <td className="py-1 px-0.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeRow(row.id)}
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {catRows.length === 0 && (
                  <p className="text-[10px] text-muted-foreground mb-1 pl-1">
                    No items. Click Add to add a row.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Grand totals */}
        <div className="mt-3 pt-3 border-t border-phase-4/20">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground flex-1">Grand Total</span>
            {yearTotals.map((yt, i) => (
              <span key={i} className="w-20 text-right text-muted-foreground">
                {fmt(yt)}
              </span>
            ))}
            <span
              className={cn(
                "w-20 text-right font-bold",
                isOverBudget ? "text-red-500" : "text-foreground",
              )}
            >
              {currency} {fmt(grandTotal)}
            </span>
          </div>
        </div>

        {/* Round 17: canonical Step 2→3 advance trigger (mirrors Round 15.3 Role Matrix Continue) */}
        <div className="mt-3 pt-3 border-t border-phase-4/20 flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("grant-suite:expand-step", {
                  detail: { phase: 4, step: 3 },
                }),
              );
            }}
            className="h-8 gap-1 bg-phase-4 hover:bg-phase-4/90 text-white"
          >
            Continue
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Team recommendations parser ───────────────────────────────────────────
//
// Round 15.2: parses the Section 7 JSON scaffold at the end of Team_Strategy.md.
// The team-assembly.ts prompt commits to appending a fenced ```json block with
// recommended_roles[] entries. This function extracts the array safely:
// JSON-fenced regex captures only the block contents (no cross-section
// consumption risk like the removed parseRoleMatrix had), defensive try/catch
// on JSON.parse, per-field type guards. Returns [] on any failure (missing
// block, malformed JSON, wrong shape, empty array).

function parseTeamRecommendations(content: string): RoleRecommendation[] {
  const match = content.match(/```json\s*\n([\s\S]+?)\n\s*```/);
  if (!match) return [];

  try {
    const data = JSON.parse(match[1]);
    if (
      !data ||
      typeof data !== "object" ||
      !Array.isArray((data as { recommended_roles?: unknown }).recommended_roles)
    ) {
      return [];
    }
    const arr = (data as { recommended_roles: unknown[] }).recommended_roles;
    return arr
      .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
      .map((r) => ({
        role: typeof r.role === "string" ? r.role : "",
        responsibility: typeof r.responsibility === "string" ? r.responsibility : "",
        suggested_effort_pct:
          typeof r.suggested_effort_pct === "number" ? r.suggested_effort_pct : 0,
      }))
      .filter((r) => r.role.length > 0);
  } catch {
    return [];
  }
}

// ─── Budget rows parser from Section R JSON block ──────────────────────────
//
// Round 16 (2026-05-12): replaced parseBudgetRows (line-by-line markdown-table
// iteration) with parseBudgetJson. Round 15.3 paste-test exposed the line-by-line
// parser as vulnerable to trailing-table consumption: any markdown table appearing
// after the last legitimate category section (In-kind contributions, Compliance
// checks, Budget Summary) was parsed as additional "Other" rows because
// currentCategory persisted past the last header it recognized, yielding a
// Budget Table total of MYR 500,064 against an intended MYR 250,000 ceiling.
//
// parseBudgetJson mirrors parseTeamRecommendations' structural safety (Round 15.2):
// JSON-fenced regex with unambiguous delimiters, defensive try/catch on JSON.parse,
// per-field type guards, category-enum validation, returns [] on any failure.
// The post-Round-16 budget-construction.ts prompt outputs a single fenced JSON
// block at the end (Part 3, OUTPUT STRUCTURE) which is the source of truth. The
// narrative markdown tables in Part 1 are for human reading only; the parser
// does not touch them.

function parseBudgetJson(content: string, years: number): BudgetRow[] {
  const match = content.match(/```json\s*\n([\s\S]+?)\n\s*```/);
  if (!match) return [];

  try {
    const data = JSON.parse(match[1]);
    if (
      !data ||
      typeof data !== "object" ||
      !Array.isArray((data as { budget_rows?: unknown }).budget_rows)
    ) {
      return [];
    }

    const arr = (data as { budget_rows: unknown[] }).budget_rows;
    const validCategories: readonly BudgetCategory[] = [
      "Personnel",
      "Equipment",
      "Travel",
      "Materials",
      "Publication",
      "Other",
    ];

    return arr
      .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
      .map((r) => {
        const rawCategory = typeof r.category === "string" ? r.category : "";
        const category = (validCategories as readonly string[]).includes(rawCategory)
          ? (rawCategory as BudgetCategory)
          : "Other";
        const rawAmounts = Array.isArray(r.amounts) ? r.amounts : [];
        const amounts: number[] = rawAmounts
          .slice(0, years)
          .map((n) => (typeof n === "number" && !isNaN(n) ? n : 0));
        while (amounts.length < years) amounts.push(0);
        const rawVot = typeof r.vot === "string" ? r.vot.trim() : "";
        // Round 17: capture Vot code, treat "—" / "-" / empty as undefined (no badge displayed).
        const vot = rawVot && rawVot !== "—" && rawVot !== "-" ? rawVot : undefined;
        return {
          id: crypto.randomUUID(),
          category,
          item: typeof r.item === "string" ? r.item : "",
          amounts,
          justification: typeof r.justification === "string" ? r.justification : "",
          vot,
        };
      })
      .filter((r) => r.item.length > 0 && r.amounts.some((a) => a > 0));
  } catch {
    return [];
  }
}

// ─── Budget to markdown ────────────────────────────────────────────────────

function budgetToMarkdown(rows: BudgetRow[], years: number, currency: string): string {
  const yearHeaders = Array.from({ length: years }, (_, i) => `Year ${i + 1}`);
  let md = `## Budget Breakdown\n\n`;

  const fmt = (n: number) => n.toLocaleString();

  // Round 17: include Vot column in markdown only when at least one row carries
  // a Vot code. Keeps non-MOHE projects' assembled docs clean.
  const hasAnyVot = rows.some((r) => r.vot);

  for (const cat of BUDGET_CATEGORIES) {
    const catRows = rows.filter((r) => r.category === cat);
    if (catRows.length === 0) continue;

    md += `### ${cat}\n\n`;
    if (hasAnyVot) {
      md += `| Item | ${yearHeaders.join(" | ")} | Total | Vot | Justification |\n`;
      md += `|------|${yearHeaders.map(() => "-------").join("|")}|-------|-----|---------------|\n`;
    } else {
      md += `| Item | ${yearHeaders.join(" | ")} | Total | Justification |\n`;
      md += `|------|${yearHeaders.map(() => "-------").join("|")}|-------|---------------|\n`;
    }

    for (const row of catRows) {
      const total = row.amounts.reduce((a, b) => a + b, 0);
      if (hasAnyVot) {
        md += `| ${row.item} | ${row.amounts.map((a) => fmt(a)).join(" | ")} | ${fmt(total)} | ${row.vot || "—"} | ${row.justification} |\n`;
      } else {
        md += `| ${row.item} | ${row.amounts.map((a) => fmt(a)).join(" | ")} | ${fmt(total)} | ${row.justification} |\n`;
      }
    }
    md += "\n";
  }

  // Summary table
  md += `### Budget Summary\n\n`;
  md += `| Category | ${yearHeaders.join(" | ")} | Total |\n`;
  md += `|----------|${yearHeaders.map(() => "-------").join("|")}|-------|\n`;

  let grandTotals = Array(years).fill(0);
  for (const cat of BUDGET_CATEGORIES) {
    const catRows = rows.filter((r) => r.category === cat);
    if (catRows.length === 0) continue;
    const catYearTotals = Array.from({ length: years }, (_, yi) =>
      catRows.reduce((sum, r) => sum + (r.amounts[yi] || 0), 0),
    );
    const catTotal = catYearTotals.reduce((a, b) => a + b, 0);
    grandTotals = grandTotals.map((g, i) => g + catYearTotals[i]);
    md += `| ${cat} | ${catYearTotals.map((a) => fmt(a)).join(" | ")} | ${fmt(catTotal)} |\n`;
  }
  const gt = grandTotals.reduce((a: number, b: number) => a + b, 0);
  md += `| **TOTAL** | ${grandTotals.map((a: number) => `**${fmt(a)}**`).join(" | ")} | **${currency} ${fmt(gt)}** |\n`;

  return md;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function Phase4Client({ projectId: _pid }: { projectId: string }) {
  void _pid; // extracted from URL instead
  const [projectId] = useState(() => getProjectIdFromUrl());
  const { setActiveProject, activeProject } = useProjectStore();
  const { progress, loadProgress, getPhaseCompletion } = useProgressStore();
  const { documents, loadDocuments, saveDocument } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();

  const [activeStep, setActiveStep] = useState<number | null>(1);

  // Step 1 state
  const [roles, setRoles] = useState<TeamRole[]>(() => loadJson(getRolesKey(projectId), []));

  // Step 2 state
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>(() =>
    loadJson(getBudgetKey(projectId), []),
  );
  const [budgetMeta, setBudgetMeta] = useState<{
    budgetLimit: number;
    duration: number;
    currency: string;
  }>(() => loadJson(getBudgetMetaKey(projectId), { budgetLimit: 0, duration: 3, currency: "USD" }));

  // Step 3 / assembly state
  const [showAssemblyPreview, setShowAssemblyPreview] = useState(false);
  const [assembledContent, setAssembledContent] = useState("");

  // Round 15.3: prefill budgetMeta from activeProject when it becomes available.
  // Uses the React docs "Adjusting state when a prop changes" pattern (setState
  // during render, guarded by a previous-value comparison) instead of useEffect,
  // which would trigger the react-hooks/set-state-in-effect lint rule. The
  // pristine check (values matching the initial defaults { 0, 3, "USD" })
  // preserves customized values across re-mounts via localStorage. activeProject
  // arrives in a post-mount useEffect via setActiveProject(projectId), so this
  // render-time conditional fires once on the render immediately after that.
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (activeProject && prefilledFor !== activeProject.id) {
    setPrefilledFor(activeProject.id);
    const isPristine =
      budgetMeta.budgetLimit === 0 &&
      budgetMeta.duration === 3 &&
      budgetMeta.currency === "USD";
    if (isPristine) {
      setBudgetMeta({
        budgetLimit: parseBudgetCeiling(activeProject.budgetRange),
        duration: 3,
        currency: activeProject.currency || "MYR",
      });
    }
  }

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
      { label: "Phase 4: Budget & Team Planning" },
    ]);
  }, [projectId, setActiveProject, loadProgress, loadDocuments, setBreadcrumbs]);

  // ── Listen for next-step navigation events ────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ phase?: number; step: number }>).detail;
      if (detail.phase !== undefined && detail.phase !== 4) return;
      setActiveStep(detail.step);
      setTimeout(() => {
        const el = document.getElementById(`phase4-step-${detail.step}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    };
    window.addEventListener("grant-suite:expand-step", handler);
    return () => window.removeEventListener("grant-suite:expand-step", handler);
  }, []);

  // ── Persist roles, letters, budget to localStorage ────────────────────────

  useEffect(() => {
    saveJson(getRolesKey(projectId), roles);
  }, [projectId, roles]);

  useEffect(() => {
    saveJson(getBudgetKey(projectId), budgetRows);
  }, [projectId, budgetRows]);

  useEffect(() => {
    saveJson(getBudgetMetaKey(projectId), budgetMeta);
  }, [projectId, budgetMeta]);

  // ── Track step outputs from saved documents ──────────────────────────────

  const step1Output = useMemo(() => {
    return documents.find(
      (d) => d.projectId === projectId && d.canonicalName === "Team_Strategy.md" && d.isCurrent,
    )?.content ?? null;
  }, [documents, projectId]);

  const step2Output = useMemo(() => {
    return documents.find(
      (d) => d.projectId === projectId && d.canonicalName === "Budget_Draft.md" && d.isCurrent,
    )?.content ?? null;
  }, [documents, projectId]);

  // ── Parse budget from Step 2 output (when first saved) ───────────────────

  useEffect(() => {
    if (!step2Output || budgetRows.length > 0) return;
    const parsed = parseBudgetJson(step2Output, budgetMeta.duration);
    if (parsed.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      setBudgetRows((currentRows) => (currentRows.length === 0 ? parsed : currentRows));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [budgetMeta.duration, budgetRows.length, step2Output]);

  // ── Phase progress ────────────────────────────────────────────────────────

  const phaseCompletion = getPhaseCompletion(4, activeProject);
  const phase4Steps = PHASE_4.steps;

  const getStepStatus = useCallback(
    (stepNum: number): StepStatus => {
      return progress.phases[4]?.steps[stepNum] || "not-started";
    },
    [progress],
  );

  const getStepDocuments = useCallback(
    (stepNum: number) => {
      return documents.filter(
        (d) => d.projectId === projectId && d.phase === 4 && d.step === stepNum && d.isCurrent,
      );
    },
    [documents, projectId],
  );

  const isStepUnlocked = useCallback(
    (stepNum: number): boolean => {
      if (stepNum === 1) return true;
      const prevStatus = getStepStatus(stepNum - 1);
      return prevStatus !== "not-started";
    },
    [getStepStatus],
  );

  // ── Template IDs ──────────────────────────────────────────────────────────

  const getTemplateId = (stepNum: number): string => {
    switch (stepNum) {
      case 1:
        return "phase4.step1-team-assembly";
      case 2:
        return "phase4.step2-budget-construction";
      case 3:
        return "phase4.step3-budget-justification";
      default:
        return "";
    }
  };

  // ── Assembly logic for Step 3 completion ──────────────────────────────────

  const assembleDocument = useCallback(() => {
    const parts: string[] = [];

    parts.push("# Budget & Team Plan\n");

    // Team Strategy
    if (step1Output) {
      parts.push("## Part 1: Team Assembly Strategy\n");
      parts.push(step1Output);
      parts.push("\n---\n");
    }

    // Budget Table (from editable data)
    if (budgetRows.length > 0) {
      parts.push("## Part 2: Budget Construction\n");
      parts.push(budgetToMarkdown(budgetRows, budgetMeta.duration, budgetMeta.currency));
      parts.push("\n---\n");
    } else if (step2Output) {
      parts.push("## Part 2: Budget Construction\n");
      parts.push(step2Output);
      parts.push("\n---\n");
    }

    // Budget Justification (Step 3 output)
    const step3Doc = documents.find(
      (d) =>
        d.projectId === projectId &&
        d.canonicalName === "Budget_Justification.md" &&
        d.isCurrent,
    );
    if (step3Doc) {
      parts.push("## Part 3: Budget Justification & Compliance\n");
      parts.push(step3Doc.content);
    }

    return parts.join("\n");
  }, [step1Output, step2Output, budgetRows, budgetMeta, documents, projectId]);

  const handleStep3Complete = useCallback(() => {
    loadDocuments(projectId);
    // Round 19: removed auto-popup of Assembly Preview modal. The assembly-success
    // card below exposes a voluntary "Preview Assembled Document" button, and the
    // PhaseCompleteCTA at the bottom of the page handles Phase 4 → Phase 5.
    setTimeout(() => {
      document
        .getElementById("phase4-assembly-success")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }, [projectId, loadDocuments]);

  const handleConfirmAssembly = useCallback(async () => {
    const content = assembledContent || assembleDocument();
    const wordCount = content
      .replace(/[#*`>\-|=]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    const doc = {
      id: storage.createId(),
      projectId,
      phase: 4,
      step: 3,
      name: "Budget Justification",
      canonicalName: "Budget_Justification.md",
      content,
      format: "md" as const,
      version: 1,
      isCurrent: true,
      wordCount,
      createdAt: new Date().toISOString(),
    };

    await saveDocument(projectId, doc);
    setShowAssemblyPreview(false);
    loadDocuments(projectId);
  }, [assembledContent, assembleDocument, projectId, saveDocument, loadDocuments]);

  // ── Budget form fields ────────────────────────────────────────────────────

  // Round 15.3: budgetAdditionalFields are hidden, sourced from budgetMeta
  // (the visible Budget Parameters card above). The hidden+defaultValue
  // pattern relies on the StepExecutor re-seed effect's Round-15.3 extension
  // that always syncs hidden fields when defaultValue changes.
  const budgetAdditionalFields = useMemo(
    () => [
      {
        name: "budgetLimit",
        label: "Total Budget Limit",
        type: "text" as const,
        defaultValue: budgetMeta.budgetLimit > 0 ? String(budgetMeta.budgetLimit) : "",
        hidden: true,
        required: true,
      },
      {
        name: "projectDuration",
        label: "Project Duration (years)",
        type: "text" as const,
        defaultValue: budgetMeta.duration > 0 ? String(budgetMeta.duration) : "",
        hidden: true,
        required: true,
      },
      {
        name: "currency",
        label: "Currency",
        type: "select" as const,
        defaultValue: budgetMeta.currency || "MYR",
        hidden: true,
        options: CURRENCIES.map((c) => ({
          label: `${c.code} (${c.symbol})`,
          value: c.code,
        })),
      },
    ],
    [budgetMeta.budgetLimit, budgetMeta.duration, budgetMeta.currency],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div className="space-y-8" {...fadeInUp}>
      {/* ── Phase Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <PhaseIcon phase={4} size="lg" active />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{PHASE_4.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define your team composition, construct a detailed budget, and assemble the
            Budget_Justification.md — the financial backbone of your proposal.
          </p>
        </div>
        <JumpToStartButton phase={4} />
      </div>

      {/* ── Progress Bar ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
          <span>Phase Progress</span>
          <span>
            {phase4Steps.filter((s) => getStepStatus(s.step) === "complete").length} of{" "}
            {phase4Steps.length} steps
          </span>
        </div>
        <Progress value={phaseCompletion} className="h-1.5" />
      </div>

      {/* ── Steps ──────────────────────────────────────────────────────── */}
      <div className="space-y-0">
        {phase4Steps.map((stepDef, i) => {
          const status = getStepStatus(stepDef.step);
          const isActive = activeStep === stepDef.step;
          const isComplete = status === "complete";
          const isCurrent = status !== "not-started" && status !== "complete";
          const stepDocs = getStepDocuments(stepDef.step);
          const unlocked = isStepUnlocked(stepDef.step);
          const meta = STEP_META[stepDef.step];
          const StepIcon = meta?.icon;

          return (
            <div key={stepDef.step} id={`phase4-step-${stepDef.step}`} className="relative">
              {/* Timeline line */}
              {i < phase4Steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-3.75 top-9 w-0.5 h-[calc(100%-20px)]",
                    isComplete ? "bg-phase-4" : "bg-muted",
                  )}
                />
              )}

              {/* Step header */}
              <button
                onClick={() => setActiveStep(isActive ? null : stepDef.step)}
                className={cn(
                  "flex w-full items-center gap-3 py-3 text-left transition-colors",
                  "hover:bg-muted rounded-xl px-2 -mx-2",
                )}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isComplete
                      ? "border-phase-4 bg-phase-4 text-white"
                      : isCurrent
                        ? "border-phase-4 bg-transparent text-phase-4"
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
                              : "text-muted-foreground",
                      )}
                    >
                      {stepDef.name}
                    </p>
                    {stepDef.step === 3 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-accent-500/30 text-accent-400"
                      >
                        Produces Budget_Justification.md
                      </Badge>
                    )}
                  </div>
                  {isComplete && stepDocs.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
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
                        isComplete ? "text-phase-4" : "text-muted-foreground/50",
                      )}
                    />
                  )}
                  {status !== "not-started" && (
                    <Badge variant={isComplete ? "default" : "outline"} className="text-[10px]">
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
                      {/* ── Step 1: Team Assembly ──────────────────────── */}
                      {stepDef.step === 1 && (
                        <>
                          <StepExecutor
                            templateId={getTemplateId(1)}
                            projectId={projectId}
                            phase={4}
                            step={1}
                            title="Team Assembly Strategy"
                            description={meta?.description}
                            onComplete={() => {
                              loadDocuments(projectId);
                              // Round 15.3: scroll to Role Matrix instead of auto-advancing.
                              // User fills Role Matrix below, then clicks its Continue button.
                              setTimeout(() => {
                                document
                                  .getElementById("phase4-role-matrix")
                                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }, 100);
                            }}
                          />
                          {/* Role Matrix — show after step is complete or has output */}
                          {(isComplete || step1Output) && (
                            <motion.div
                              id="phase4-role-matrix"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <RoleMatrixUI
                                roles={roles}
                                setRoles={setRoles}
                                step1Output={step1Output}
                              />
                            </motion.div>
                          )}
                        </>
                      )}

                      {/* ── Step 2: Budget Construction ────────────────── */}
                      {stepDef.step === 2 && (
                        <>
                          {/* Budget meta inputs (shown before StepExecutor) */}
                          <Card className="border-phase-4/20">
                            <CardContent className="p-4 space-y-3">
                              <p className="text-xs font-medium text-muted-foreground">
                                Budget Parameters
                              </p>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">
                                    Budget Limit
                                  </Label>
                                  <Input
                                    type="number"
                                    value={budgetMeta.budgetLimit || ""}
                                    onChange={(e) =>
                                      setBudgetMeta((m) => ({
                                        ...m,
                                        budgetLimit: parseFloat(e.target.value) || 0,
                                      }))
                                    }
                                    placeholder={activeProject?.budgetRange || "e.g., 500000"}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">
                                    Duration (years)
                                  </Label>
                                  <Input
                                    type="number"
                                    value={budgetMeta.duration || ""}
                                    onChange={(e) =>
                                      setBudgetMeta((m) => ({
                                        ...m,
                                        duration: parseInt(e.target.value) || 1,
                                      }))
                                    }
                                    min={1}
                                    max={10}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Currency</Label>
                                  <select
                                    value={budgetMeta.currency}
                                    onChange={(e) =>
                                      setBudgetMeta((m) => ({ ...m, currency: e.target.value }))
                                    }
                                    className="w-full h-8 rounded-md border border-border bg-muted px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent-500"
                                  >
                                    {CURRENCIES.map((c) => (
                                      <option key={c.code} value={c.code}>
                                        {c.code} ({c.symbol})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <StepExecutor
                            templateId={getTemplateId(2)}
                            projectId={projectId}
                            phase={4}
                            step={2}
                            title="Budget Construction"
                            description={meta?.description}
                            additionalFields={budgetAdditionalFields}
                            onComplete={() => {
                              loadDocuments(projectId);
                              // Round 17: scroll to Budget Table instead of auto-advancing.
                              // User reviews/edits the Budget Table below, then clicks its
                              // Continue button. Mirrors Round 15.3 Step 1 → Role Matrix flow.
                              setTimeout(() => {
                                document
                                  .getElementById("phase4-budget-table")
                                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }, 100);
                            }}
                          />

                          {/* Budget Table — show after step is complete or has output */}
                          {(isComplete || step2Output) && (
                            <motion.div
                              id="phase4-budget-table"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <BudgetTableUI
                                rows={budgetRows}
                                setRows={setBudgetRows}
                                years={budgetMeta.duration}
                                budgetLimit={budgetMeta.budgetLimit}
                                currency={budgetMeta.currency}
                                grantScheme={activeProject?.grantScheme}
                              />
                            </motion.div>
                          )}
                        </>
                      )}

                      {/* ── Step 3: Budget Justification & Assembly ────── */}
                      {stepDef.step === 3 && (
                        <>
                          <StepExecutor
                            templateId={getTemplateId(3)}
                            projectId={projectId}
                            phase={4}
                            step={3}
                            title="Budget Justification & Compliance"
                            description={meta?.description}
                            onComplete={handleStep3Complete}
                          />

                          {/* Assembly success indicator */}
                          {isComplete && (
                            <motion.div
                              id="phase4-assembly-success"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="rounded-lg border border-accent-500/30 bg-accent-500/5 p-4"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-accent-400" />
                                <p className="text-sm font-medium text-foreground">
                                  Budget_Justification.md Assembled
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                The combined team strategy, budget, and justification document is
                                ready. This feeds into Phase 5 proposal writing.
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const content = assembleDocument();
                                  setAssembledContent(content);
                                  setShowAssemblyPreview(true);
                                }}
                                className="mt-2 h-7 text-xs gap-1"
                              >
                                <Eye className="h-3 w-3" /> Preview Assembled Document
                              </Button>
                            </motion.div>
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

      {/* Round 19: Phase 4 → Phase 5 advance affordance. Renders only when
          phaseCompletion === 100. Mirrors Phase1/2/3Client canonical pattern. */}
      <PhaseCompleteCTA
        projectId={projectId}
        phase={4}
        phaseCompletion={phaseCompletion}
      />

      {/* ── Assembly Preview Modal ─────────────────────────────────────── */}
      <Dialog open={showAssemblyPreview} onOpenChange={setShowAssemblyPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-phase-4" />
              Budget_Justification.md — Preview
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none py-4">
            <MarkdownRenderer content={assembledContent} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowAssemblyPreview(false)}>
              Close
            </Button>
            <Button onClick={handleConfirmAssembly} className="gap-1">
              <Check className="h-4 w-4" />
              Confirm &amp; Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PhaseDangerZone projectId={projectId} phase={4} />
    </motion.div>
  );
}
