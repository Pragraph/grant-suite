"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Users,
  DollarSign,
  FileCheck,
  Plus,
  Trash2,
  Download,
  Eye,
  Sparkles,
  Mail,
  Send,
  Inbox,
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

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

interface LetterStatus {
  id: string;
  roleId: string;
  memberName: string;
  drafted: boolean;
  sent: boolean;
  received: boolean;
}

interface BudgetRow {
  id: string;
  category: BudgetCategory;
  item: string;
  amounts: number[]; // one per year
  justification: string;
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

// ─── Step metadata ─────────────────────────────────────────────────────────

const STEP_META: Record<number, StepMeta> = {
  1: {
    icon: Users,
    description:
      "Define team roles, responsibilities, and effort allocation aligned with your research design.",
  },
  2: {
    icon: DollarSign,
    description:
      "Construct a detailed, multi-year budget with itemized costs and justifications.",
  },
  3: {
    icon: FileCheck,
    description:
      "Write budget justification narrative, verify compliance, and assemble Budget_Team_Plan.md.",
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
function getLettersKey(projectId: string) {
  return `grant-suite-phase4-letters-${projectId}`;
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

// ─── Role Matrix Parser ────────────────────────────────────────────────────

function parseRoleMatrix(content: string): TeamRole[] {
  const roles: TeamRole[] = [];
  // Match markdown table rows: | Role | Name | Institution | Responsibility | Effort % | ...
  const tableRegex =
    /\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/g;
  let match;
  let isHeader = true;

  while ((match = tableRegex.exec(content)) !== null) {
    const col1 = match[1].trim();
    // Skip header row and separator
    if (col1.startsWith("---") || col1.startsWith("Role") || col1 === "---") {
      isHeader = false;
      continue;
    }
    if (isHeader) {
      isHeader = false;
      continue;
    }

    const effortStr = match[5].trim().replace(/%/g, "");
    const effort = parseInt(effortStr, 10);

    roles.push({
      id: crypto.randomUUID(),
      role: col1,
      name: match[2].trim().replace(/\[USER INPUT NEEDED\]/g, ""),
      institution: match[3].trim().replace(/\[USER INPUT NEEDED\]/g, ""),
      responsibility: match[4].trim(),
      effort: isNaN(effort) ? 0 : effort,
    });
  }

  return roles;
}

// ─── Role Matrix UI ────────────────────────────────────────────────────────

function RoleMatrixUI({
  roles,
  setRoles,
}: {
  roles: TeamRole[];
  setRoles: (roles: TeamRole[]) => void;
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
          <Button size="sm" variant="ghost" onClick={addRole} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Add Role
          </Button>
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
            No roles parsed. Click &quot;Add Role&quot; to add team members manually.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Letters of Support Tracker ────────────────────────────────────────────

function LettersTrackerUI({
  letters,
  setLetters,
  hasPartnership,
}: {
  letters: LetterStatus[];
  setLetters: (letters: LetterStatus[]) => void;
  hasPartnership: boolean;
}) {
  const toggleLetter = (id: string, field: "drafted" | "sent" | "received") => {
    setLetters(
      letters.map((l) => (l.id === id ? { ...l, [field]: !l[field] } : l)),
    );
  };

  const completedCount = letters.filter((l) => l.received).length;

  return (
    <Card className="border-phase-4/30 bg-phase-4/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-phase-4" />
          <p className="text-sm font-medium text-foreground">Letters of Support Tracker</p>
          <Badge className="text-[10px] bg-phase-4/20 text-phase-4">
            {completedCount}/{letters.length} received
          </Badge>
        </div>

        {hasPartnership && (
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-2.5 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Partnership letters from Phase 3A are tracked separately in the Partnership module.
            </p>
          </div>
        )}

        {letters.length > 0 ? (
          <div className="space-y-2">
            {letters.map((letter) => (
              <div
                key={letter.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
              >
                <span className="text-xs font-medium text-foreground flex-1 truncate">
                  {letter.memberName || "Unnamed"}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={letter.drafted}
                      onCheckedChange={() => toggleLetter(letter.id, "drafted")}
                    />
                    <span className="text-[10px] text-muted-foreground">Drafted</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={letter.sent}
                      onCheckedChange={() => toggleLetter(letter.id, "sent")}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      <Send className="h-2.5 w-2.5 inline mr-0.5" />
                      Sent
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={letter.received}
                      onCheckedChange={() => toggleLetter(letter.id, "received")}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      <Inbox className="h-2.5 w-2.5 inline mr-0.5" />
                      Received
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            Complete Step 1 and add team roles to populate letter tracking.
          </p>
        )}
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
}: {
  rows: BudgetRow[];
  setRows: (rows: BudgetRow[]) => void;
  years: number;
  budgetLimit: number;
  currency: string;
}) {
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

        {/* Budget vs limit indicator */}
        {budgetLimit > 0 && (
          <div
            className={cn(
              "flex items-center justify-between rounded-md border px-3 py-2 mb-3 text-xs",
              isOverBudget
                ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                : "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
            )}
          >
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
        )}

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
                        <th className="text-left py-1 px-1 text-muted-foreground font-medium w-32">
                          Item
                        </th>
                        {Array.from({ length: years }, (_, i) => (
                          <th
                            key={i}
                            className="text-right py-1 px-1 text-muted-foreground font-medium w-24"
                          >
                            Year {i + 1}
                          </th>
                        ))}
                        <th className="text-right py-1 px-1 text-muted-foreground font-medium w-24">
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
                              <Input
                                value={row.item}
                                onChange={(e) => updateRow(row.id, "item", e.target.value)}
                                className="h-6 text-[11px]"
                                placeholder="Item name"
                              />
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
              <span key={i} className="w-24 text-right text-muted-foreground">
                {fmt(yt)}
              </span>
            ))}
            <span
              className={cn(
                "w-24 text-right font-bold",
                isOverBudget ? "text-red-500" : "text-foreground",
              )}
            >
              {currency} {fmt(grandTotal)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Budget rows parser from markdown ──────────────────────────────────────

function parseBudgetRows(content: string, years: number): BudgetRow[] {
  const rows: BudgetRow[] = [];
  // Try to match budget table rows with amounts
  let currentCategory: BudgetCategory = "Personnel";

  const lines = content.split("\n");
  for (const line of lines) {
    // Detect category headers
    const catMatch = line.match(/^#{2,4}\s*(Personnel|Equipment|Travel|Material|Publication|Other)/i);
    if (catMatch) {
      const cat = catMatch[1];
      if (cat.toLowerCase().startsWith("personnel")) currentCategory = "Personnel";
      else if (cat.toLowerCase().startsWith("equipment")) currentCategory = "Equipment";
      else if (cat.toLowerCase().startsWith("travel")) currentCategory = "Travel";
      else if (cat.toLowerCase().startsWith("material")) currentCategory = "Materials";
      else if (cat.toLowerCase().startsWith("publication")) currentCategory = "Publication";
      else currentCategory = "Other";
      continue;
    }

    // Parse table rows with numbers
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 3) continue;
    // Skip header/separator rows
    if (cells[0].startsWith("---") || cells[0] === "Item" || cells[0] === "Category") continue;
    if (cells.every((c) => c.startsWith("---"))) continue;
    // Skip summary/total rows
    if (cells[0].toLowerCase().includes("total") || cells[0] === "**TOTAL**") continue;

    // Try to extract amounts
    const amounts: number[] = [];
    for (let i = 1; i < cells.length && amounts.length < years; i++) {
      const num = parseFloat(cells[i].replace(/[,\s]/g, ""));
      if (!isNaN(num)) amounts.push(num);
    }

    if (amounts.length === 0) continue;

    // Pad amounts to match years
    while (amounts.length < years) amounts.push(0);

    // Find justification (last non-number cell)
    let justification = "";
    for (let i = cells.length - 1; i >= 1; i--) {
      const num = parseFloat(cells[i].replace(/[,\s]/g, ""));
      if (isNaN(num) && cells[i].length > 3) {
        justification = cells[i];
        break;
      }
    }

    rows.push({
      id: crypto.randomUUID(),
      category: currentCategory,
      item: cells[0].replace(/\*\*/g, ""),
      amounts: amounts.slice(0, years),
      justification,
    });
  }

  return rows;
}

// ─── Budget to markdown ────────────────────────────────────────────────────

function budgetToMarkdown(rows: BudgetRow[], years: number, currency: string): string {
  const yearHeaders = Array.from({ length: years }, (_, i) => `Year ${i + 1}`);
  let md = `## Budget Breakdown\n\n`;

  const fmt = (n: number) => n.toLocaleString();

  for (const cat of BUDGET_CATEGORIES) {
    const catRows = rows.filter((r) => r.category === cat);
    if (catRows.length === 0) continue;

    md += `### ${cat}\n\n`;
    md += `| Item | ${yearHeaders.join(" | ")} | Total | Justification |\n`;
    md += `|------|${yearHeaders.map(() => "-------").join("|")}|-------|---------------|\n`;

    for (const row of catRows) {
      const total = row.amounts.reduce((a, b) => a + b, 0);
      md += `| ${row.item} | ${row.amounts.map((a) => fmt(a)).join(" | ")} | ${fmt(total)} | ${row.justification} |\n`;
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
  const [letters, setLetters] = useState<LetterStatus[]>(() =>
    loadJson(getLettersKey(projectId), []),
  );

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


  // ── Persist roles, letters, budget to localStorage ────────────────────────

  useEffect(() => {
    saveJson(getRolesKey(projectId), roles);
  }, [projectId, roles]);

  useEffect(() => {
    saveJson(getLettersKey(projectId), letters);
  }, [projectId, letters]);

  useEffect(() => {
    saveJson(getBudgetKey(projectId), budgetRows);
  }, [projectId, budgetRows]);

  useEffect(() => {
    saveJson(getBudgetMetaKey(projectId), budgetMeta);
  }, [projectId, budgetMeta]);

  // ── Sync letters with roles ──────────────────────────────────────────────

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLetters((currentLetters) => {
        const roleIds = new Set(roles.map((r) => r.id));
        // Remove letters for deleted roles
        const existing = currentLetters.filter((l) => roleIds.has(l.roleId));
        // Add letters for new roles
        const existingRoleIds = new Set(existing.map((l) => l.roleId));
        const newLetters = roles
          .filter((r) => !existingRoleIds.has(r.id))
          .map((r) => ({
            id: crypto.randomUUID(),
            roleId: r.id,
            memberName: r.name || r.role,
            drafted: false,
            sent: false,
            received: false,
          }));
        // Update names for existing letters
        const updated = existing.map((l) => {
          const role = roles.find((r) => r.id === l.roleId);
          return role ? { ...l, memberName: role.name || role.role } : l;
        });
        const merged = [...updated, ...newLetters];
        return JSON.stringify(merged) === JSON.stringify(currentLetters)
          ? currentLetters
          : merged;
      });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [roles]);

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

  // ── Parse roles from Step 1 output (when first saved) ────────────────────

  useEffect(() => {
    if (!step1Output || roles.length > 0) return;
    const parsed = parseRoleMatrix(step1Output);
    if (parsed.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      setRoles((currentRoles) => (currentRoles.length === 0 ? parsed : currentRoles));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [roles.length, step1Output]);

  // ── Parse budget from Step 2 output (when first saved) ───────────────────

  useEffect(() => {
    if (!step2Output || budgetRows.length > 0) return;
    const parsed = parseBudgetRows(step2Output, budgetMeta.duration);
    if (parsed.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      setBudgetRows((currentRows) => (currentRows.length === 0 ? parsed : currentRows));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [budgetMeta.duration, budgetRows.length, step2Output]);

  // ── Check if Phase 3A partnership was completed ──────────────────────────

  const hasPartnership = useMemo(() => {
    return documents.some(
      (d) =>
        d.projectId === projectId &&
        d.canonicalName === "Partnership_Plan.md" &&
        d.isCurrent,
    );
  }, [documents, projectId]);

  // ── Phase progress ────────────────────────────────────────────────────────

  const phaseCompletion = getPhaseCompletion(4);
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
    // Trigger assembly after a short delay to allow document to save
    setTimeout(() => {
      const content = assembleDocument();
      setAssembledContent(content);
      setShowAssemblyPreview(true);
    }, 500);
  }, [projectId, loadDocuments, assembleDocument]);

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
      name: "Budget & Team Plan",
      canonicalName: "Budget_Team_Plan.md",
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

  const budgetAdditionalFields = useMemo(
    () => [
      {
        name: "budgetLimit",
        label: "Total Budget Limit",
        type: "text" as const,
        placeholder: activeProject?.budgetRange || "e.g., 500000",
        required: true,
      },
      {
        name: "projectDuration",
        label: "Project Duration (years)",
        type: "text" as const,
        placeholder: "e.g., 3",
        required: true,
      },
      {
        name: "currency",
        label: "Currency",
        type: "select" as const,
        options: [
          { label: "USD ($)", value: "USD" },
          { label: "EUR (€)", value: "EUR" },
          { label: "GBP (£)", value: "GBP" },
          { label: "MYR (RM)", value: "MYR" },
          { label: "AUD (A$)", value: "AUD" },
          { label: "CAD (C$)", value: "CAD" },
          { label: "SGD (S$)", value: "SGD" },
          { label: "JPY (¥)", value: "JPY" },
          { label: "CHF (CHF)", value: "CHF" },
        ],
      },
    ],
    [activeProject?.budgetRange],
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
            Budget_Team_Plan.md — the financial backbone of your proposal.
          </p>
        </div>
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
            <div key={stepDef.step} className="relative">
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
                        Produces Budget_Team_Plan.md
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
                              setActiveStep(2);
                            }}
                          />
                          {/* Role Matrix — show after step is complete or has output */}
                          {(isComplete || step1Output) && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              <RoleMatrixUI
                                roles={roles}
                                setRoles={setRoles}
                              />
                              <LettersTrackerUI
                                letters={letters}
                                setLetters={setLetters}
                                hasPartnership={hasPartnership}
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
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="MYR">MYR (RM)</option>
                                    <option value="AUD">AUD (A$)</option>
                                    <option value="CAD">CAD (C$)</option>
                                    <option value="SGD">SGD (S$)</option>
                                    <option value="JPY">JPY (¥)</option>
                                    <option value="CHF">CHF</option>
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
                              setActiveStep(3);
                            }}
                          />

                          {/* Budget Table — show after step is complete or has output */}
                          {(isComplete || step2Output) && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <BudgetTableUI
                                rows={budgetRows}
                                setRows={setBudgetRows}
                                years={budgetMeta.duration}
                                budgetLimit={budgetMeta.budgetLimit}
                                currency={budgetMeta.currency}
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
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="rounded-lg border border-accent-500/30 bg-accent-500/5 p-4"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-accent-400" />
                                <p className="text-sm font-medium text-foreground">
                                  Budget_Team_Plan.md Assembled
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

      {/* ── Assembly Preview Modal ─────────────────────────────────────── */}
      <Dialog open={showAssemblyPreview} onOpenChange={setShowAssemblyPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-phase-4" />
              Budget_Team_Plan.md — Preview
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
    </motion.div>
  );
}
