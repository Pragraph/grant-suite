// ─── Project ────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  title: string;
  discipline: string;
  country: string;
  careerStage: string;
  targetFunder?: string;
  budgetRange?: string;
  currentPhase: number;
  currentStep: number;
  status: "active" | "completed" | "archived";
  metadata: Record<string, unknown>;
  createdAt: string; // ISO date
  updatedAt: string;
}

// ─── Document ───────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  projectId: string;
  phase: number;
  step?: number;
  name: string;
  canonicalName: string;
  content: string; // markdown
  format: "md";
  version: number;
  isCurrent: boolean;
  wordCount: number;
  createdAt: string;
}

// ─── Phase Progress ─────────────────────────────────────────────────────────

export type StepStatus =
  | "not-started"
  | "in-progress"
  | "prompt-copied"
  | "output-pasted"
  | "complete";

export type GateStatus = "not-checked" | "passed" | "failed" | "overridden";

export interface PhaseProgress {
  phases: Record<
    number,
    {
      steps: Record<number, StepStatus>;
      gateStatus: GateStatus;
    }
  >;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: "dark" | "light" | "system";
  sidebarCollapsed: boolean;
  defaultExportFormat: "md" | "docx";
}

// ─── Phase metadata ─────────────────────────────────────────────────────────

export interface PhaseInfo {
  id: number;
  name: string;
  description: string;
  stepCount: number;
  stepNames: string[];
}

export const PHASES: PhaseInfo[] = [
  {
    id: 1,
    name: "Discovery & Analysis",
    description: "Understand the funding landscape and define your research direction",
    stepCount: 4,
    stepNames: [
      "Research Context Analysis",
      "Funder Alignment Check",
      "Gap Analysis",
      "Strategic Positioning",
    ],
  },
  {
    id: 2,
    name: "Framework Design",
    description: "Build the theoretical and methodological backbone",
    stepCount: 4,
    stepNames: [
      "Conceptual Framework",
      "Research Questions",
      "Methodology Design",
      "Innovation Statement",
    ],
  },
  {
    id: 3,
    name: "Narrative Development",
    description: "Craft compelling proposal sections",
    stepCount: 5,
    stepNames: [
      "Abstract Draft",
      "Introduction & Background",
      "Literature Review",
      "Objectives & Aims",
      "Significance Statement",
    ],
  },
  {
    id: 4,
    name: "Technical Planning",
    description: "Detail the how — methods, timeline, and resources",
    stepCount: 4,
    stepNames: [
      "Detailed Methodology",
      "Work Plan & Timeline",
      "Resource Requirements",
      "Risk Mitigation",
    ],
  },
  {
    id: 5,
    name: "Impact & Budget",
    description: "Quantify outcomes and financial requirements",
    stepCount: 4,
    stepNames: [
      "Impact Narrative",
      "Dissemination Plan",
      "Budget Justification",
      "Sustainability Plan",
    ],
  },
  {
    id: 6,
    name: "Integration & Review",
    description: "Assemble and refine the complete proposal",
    stepCount: 3,
    stepNames: [
      "Full Draft Assembly",
      "Internal Review",
      "Revision & Polish",
    ],
  },
  {
    id: 7,
    name: "Submission Preparation",
    description: "Final checks and submission-ready formatting",
    stepCount: 3,
    stepNames: [
      "Compliance Check",
      "Format & Layout",
      "Final Export",
    ],
  },
];

// ─── Document Pipeline ──────────────────────────────────────────────────────

export interface DependencyEntry {
  phase: number;
  step: number;
  produces: string;
  requires: string[];
  optional: string[];
  isOptional?: boolean;
}

export interface StepDefinition {
  step: number;
  name: string;
  type: "standard" | "multi-method";
  isOptional?: boolean;
}

export interface PhaseDefinition {
  phase: number;
  name: string;
  color: string;
  steps: StepDefinition[];
}

export interface DocumentNode {
  name: string;
  phase: number;
  present: boolean;
  stale: boolean;
  dependsOn: string[];
}

export interface ReadinessResult {
  ready: boolean;
  missing: string[];
  optionalMissing: string[];
}

export interface RequiredDocument {
  canonicalName: string;
  required: boolean;
  present: boolean;
}

// ─── Storage keys ───────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  PROJECTS: "grant-suite-projects",
  SETTINGS: "grant-suite-settings",
  PROGRESS_PREFIX: "grant-suite-progress-",
  DOCUMENTS_PREFIX: "grant-suite-docs-",
} as const;
