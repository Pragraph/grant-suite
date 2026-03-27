import type { DependencyEntry, PhaseDefinition } from "./types";

// ─── Document Dependency Graph ──────────────────────────────────────────────

export const DOCUMENT_DEPENDENCIES: DependencyEntry[] = [
  // Phase 1 — Foundation & Discovery
  { phase: 1, step: 1, produces: "Method4_Convergence_Synthesis.md", requires: [], optional: [] },
  { phase: 1, step: 2, produces: "Grant_Matching.md", requires: [], optional: [] },
  { phase: 1, step: 3, produces: "Grant_Intelligence.md", requires: [], optional: [] },

  // Phase 2 — Strategic Positioning
  { phase: 2, step: 5, produces: "Proposal_Blueprint.md", requires: ["Grant_Intelligence.md"], optional: [] },

  // Phase 3 — Research Design & Optional Modules
  { phase: 3, step: 1, produces: "Research_Design.md", requires: ["Grant_Intelligence.md", "Proposal_Blueprint.md"], optional: [] },
  { phase: 3, step: 10, produces: "Partnership_Plan.md", requires: [], optional: [], isOptional: true },
  { phase: 3, step: 11, produces: "Patent_Analysis.md", requires: [], optional: [], isOptional: true },
  { phase: 3, step: 12, produces: "SDG_Alignment.md", requires: [], optional: [], isOptional: true },
  { phase: 3, step: 13, produces: "National_Alignment.md", requires: [], optional: [], isOptional: true },
  { phase: 3, step: 14, produces: "KPI_Plan.md", requires: [], optional: [], isOptional: true },
  { phase: 3, step: 15, produces: "Researcher_Profile.md", requires: [], optional: [], isOptional: true },
  { phase: 3, step: 16, produces: "Originality_Check.md", requires: [], optional: [], isOptional: true },
  { phase: 3, step: 17, produces: "TRL_Assessment.md", requires: [], optional: [], isOptional: true },

  // Phase 4 — Budget & Team Planning
  { phase: 4, step: 3, produces: "Budget_Team_Plan.md", requires: ["Research_Design.md", "Proposal_Blueprint.md", "Grant_Intelligence.md"], optional: [] },

  // Phase 5 — Proposal Writing
  { phase: 5, step: 1, produces: "Proposal_Data.md", requires: ["Grant_Intelligence.md", "Proposal_Blueprint.md", "Research_Design.md", "Budget_Team_Plan.md"], optional: ["Partnership_Plan.md", "Patent_Analysis.md", "SDG_Alignment.md", "National_Alignment.md", "KPI_Plan.md"] },
  { phase: 5, step: 2, produces: "Executive_Summary_Draft.md", requires: ["Proposal_Data.md"], optional: [] },
  { phase: 5, step: 3, produces: "Methods_Draft.md", requires: ["Proposal_Data.md"], optional: [] },
  { phase: 5, step: 4, produces: "Background_Draft.md", requires: ["Proposal_Data.md", "Executive_Summary_Draft.md"], optional: [] },
  { phase: 5, step: 5, produces: "Impact_Draft.md", requires: ["Proposal_Data.md", "Executive_Summary_Draft.md", "Methods_Draft.md"], optional: [] },
  { phase: 5, step: 6, produces: "Budget_Justification_Draft.md", requires: ["Proposal_Data.md", "Methods_Draft.md"], optional: [] },
  { phase: 5, step: 7, produces: "Supporting_Documents.md", requires: ["Proposal_Data.md"], optional: [] },
  { phase: 5, step: 8, produces: "Complete_Proposal.md", requires: ["Executive_Summary_Draft.md", "Methods_Draft.md", "Background_Draft.md", "Impact_Draft.md", "Budget_Justification_Draft.md"], optional: ["Supporting_Documents.md"] },

  // Phase 6 — Quality Assurance & Finalization
  { phase: 6, step: 1, produces: "Mock_Review_Report.md", requires: ["Complete_Proposal.md"], optional: [] },
  { phase: 6, step: 2, produces: "EP_Audit_Report.md", requires: ["Complete_Proposal.md"], optional: [] },
  { phase: 6, step: 3, produces: "Compliance_Report.md", requires: ["Complete_Proposal.md"], optional: [] },
  { phase: 6, step: 4, produces: "Final_Proposal.md", requires: ["Complete_Proposal.md", "Mock_Review_Report.md"], optional: ["EP_Audit_Report.md", "Compliance_Report.md"] },

  // Phase 7 — Post-Submission & Resubmission
  { phase: 7, step: 1, produces: "Feedback_Analysis.md", requires: ["Complete_Proposal.md"], optional: [] },
  { phase: 7, step: 2, produces: "Resubmission_Strategy.md", requires: ["Feedback_Analysis.md"], optional: [] },
  { phase: 7, step: 3, produces: "Revised_Proposal.md", requires: ["Feedback_Analysis.md", "Resubmission_Strategy.md", "Complete_Proposal.md"], optional: [] },
];

// ─── Phase Definitions ──────────────────────────────────────────────────────

export const PHASE_DEFINITIONS: PhaseDefinition[] = [
  {
    phase: 1,
    name: "Foundation & Discovery",
    color: "phase-1",
    steps: [
      { step: 1, name: "Research Idea Discovery", type: "multi-method" },
      { step: 2, name: "Grant Matching", type: "standard" },
      { step: 3, name: "Grant Intelligence", type: "standard" },
    ],
  },
  {
    phase: 2,
    name: "Strategic Positioning",
    color: "phase-2",
    steps: [
      { step: 1, name: "Grant Requirements Analysis", type: "standard" },
      { step: 2, name: "Competitive Landscape Analysis", type: "standard" },
      { step: 3, name: "Evaluator Psychology Profile", type: "standard" },
      { step: 4, name: "Impact Maximization Framework", type: "standard" },
      { step: 5, name: "Strategic Positioning Synthesis", type: "standard" },
    ],
  },
  {
    phase: 3,
    name: "Research Design & Optional Modules",
    color: "phase-3",
    steps: [
      { step: 1, name: "Research Design", type: "standard" },
      { step: 2, name: "Literature Integration", type: "standard" },
      { step: 3, name: "Methodology Framework", type: "standard" },
      { step: 4, name: "Timeline & Milestones", type: "standard" },
      { step: 5, name: "Risk Assessment", type: "standard" },
      { step: 6, name: "Data Management Plan", type: "standard" },
      { step: 7, name: "Ethics & Compliance", type: "standard" },
      { step: 8, name: "Collaboration Plan", type: "standard" },
      { step: 9, name: "Capacity Building", type: "standard" },
      { step: 10, name: "Partnership Plan", type: "standard", isOptional: true },
      { step: 11, name: "Patent & IP Analysis", type: "standard", isOptional: true },
      { step: 12, name: "SDG Alignment", type: "standard", isOptional: true },
      { step: 13, name: "National Priority Alignment", type: "standard", isOptional: true },
      { step: 14, name: "KPI & Metrics Plan", type: "standard", isOptional: true },
      { step: 15, name: "Researcher Profile", type: "standard", isOptional: true },
      { step: 16, name: "Originality Check", type: "standard", isOptional: true },
      { step: 17, name: "TRL Assessment", type: "standard", isOptional: true },
    ],
  },
  {
    phase: 4,
    name: "Budget & Team Planning",
    color: "phase-4",
    steps: [
      { step: 1, name: "Team Composition", type: "standard" },
      { step: 2, name: "Budget Framework", type: "standard" },
      { step: 3, name: "Budget & Team Plan", type: "standard" },
    ],
  },
  {
    phase: 5,
    name: "Proposal Writing",
    color: "phase-5",
    steps: [
      { step: 1, name: "Data Compilation", type: "standard" },
      { step: 2, name: "Executive Summary", type: "standard" },
      { step: 3, name: "Methods Section", type: "standard" },
      { step: 4, name: "Background & Significance", type: "standard" },
      { step: 5, name: "Impact Statement", type: "standard" },
      { step: 6, name: "Budget Justification", type: "standard" },
      { step: 7, name: "Supporting Documents", type: "standard" },
      { step: 8, name: "Complete Proposal Assembly", type: "standard" },
    ],
  },
  {
    phase: 6,
    name: "Quality Assurance & Finalization",
    color: "phase-6",
    steps: [
      { step: 1, name: "Mock Review", type: "standard" },
      { step: 2, name: "EP Tag Audit", type: "standard" },
      { step: 3, name: "Compliance Check", type: "standard" },
      { step: 4, name: "Final Proposal", type: "standard" },
    ],
  },
  {
    phase: 7,
    name: "Post-Submission & Resubmission",
    color: "phase-7",
    steps: [
      { step: 1, name: "Feedback Analysis", type: "standard" },
      { step: 2, name: "Resubmission Strategy", type: "standard" },
      { step: 3, name: "Revised Proposal", type: "standard" },
    ],
  },
];
