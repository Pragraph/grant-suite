import type { DependencyEntry, PhaseDefinition, GrantSchemeInfo } from "./types";

// ─── Grant Scheme Registry ──────────────────────────────────────────────────
// Last verified: March 2026. Check MyGRANTS (mygrants.gov.my) for latest guidelines.

export const GRANT_SCHEMES: GrantSchemeInfo[] = [
  // ── Malaysian MOHE Competitive Grants ──────────────────────────────────
  {
    id: "FRGS",
    name: "FRGS",
    fullName: "Fundamental Research Grant Scheme",
    funder: "Ministry of Higher Education (MOHE)",
    country: "Malaysia",
    category: "malaysian",
    defaultBudgetRange: "RM 100,000 – RM 250,000",
    requiresPatentSearch: true,
    requiresMyGrants: true,
    requiresTurnitin: true,
    maxSimilarityIndex: 20,
    description:
      "Funds fundamental research across all disciplines in Malaysian public universities. Maximum RM250,000 for 2–3 years. Evaluated via MyGRANTS with emphasis on novelty, methodology, and researcher competency. Simplified Patent Search Report is mandatory.",
  },
  {
    id: "PRGS",
    name: "PRGS",
    fullName: "Prototype Research Grant Scheme",
    funder: "Ministry of Higher Education (MOHE)",
    country: "Malaysia",
    category: "malaysian",
    defaultBudgetRange: "RM 100,000 – RM 500,000",
    requiresPatentSearch: true,
    requiresMyGrants: true,
    requiresTurnitin: true,
    maxSimilarityIndex: 20,
    description:
      "Supports prototype development and proof-of-concept research. Requires clear TRL progression and commercialisation pathway. Patent Search Report is mandatory.",
  },
  {
    id: "TRGS",
    name: "TRGS",
    fullName: "Trans-disciplinary Research Grant Scheme",
    funder: "Ministry of Higher Education (MOHE)",
    country: "Malaysia",
    category: "malaysian",
    defaultBudgetRange: "RM 500,000 – RM 2,000,000",
    requiresPatentSearch: false,
    requiresMyGrants: true,
    requiresTurnitin: true,
    maxSimilarityIndex: 20,
    description:
      "Funds large-scale trans-disciplinary research involving multiple institutions. Requires cross-faculty or cross-university collaboration.",
  },
  {
    id: "LRGS",
    name: "LRGS",
    fullName: "Long-term Research Grant Scheme",
    funder: "Ministry of Higher Education (MOHE)",
    country: "Malaysia",
    category: "malaysian",
    defaultBudgetRange: "RM 1,000,000 – RM 5,000,000",
    requiresPatentSearch: false,
    requiresMyGrants: true,
    requiresTurnitin: true,
    maxSimilarityIndex: 20,
    description:
      "Supports long-term, high-impact national priority research programmes. Consortium-based with strong policy alignment requirements.",
  },
  {
    id: "PPRN",
    name: "PPRN",
    fullName: "Jaringan Penyelidikan Awam-Swasta (Public-Private Research Network)",
    funder: "Ministry of Higher Education (MOHE)",
    country: "Malaysia",
    category: "malaysian",
    defaultBudgetRange: "Up to RM 350,000 (matching grant)",
    requiresPatentSearch: false,
    requiresMyGrants: false,
    requiresTurnitin: false,
    description:
      "Industry-academia matching grant for demand-driven innovation projects. Applied via the PPRN portal (pprn.mohe.gov.my), not MyGRANTS. Requires an SSM-registered industry partner. Grant amount matched against company commitment based on company size.",
  },

  // ── International Grants Popular with Malaysian Academicians ───────────
  {
    id: "MTSF-STRG",
    name: "MTSF STRG",
    fullName: "MTSF Science & Technology Research Grant",
    funder: "Malaysian Toray Science Foundation",
    country: "Malaysia",
    category: "international",
    defaultBudgetRange: "Up to RM 60,000",
    description:
      "Annual grant for basic research in natural sciences by Malaysian researchers below 40 years of age. Excludes clinical medicine and mathematics. Applications open January–May annually via mtsf.org.",
  },
  {
    id: "Fulbright-Scholar",
    name: "Fulbright Scholar",
    fullName: "Fulbright Malaysian Scholar Program",
    funder: "Malaysian-American Commission on Educational Exchange (MACEE)",
    country: "United States",
    category: "international",
    description:
      "Prestigious exchange programme funding Malaysian scholars for research or teaching at US institutions.",
  },
  {
    id: "ISPF-Collab",
    name: "ISPF Research Collab",
    fullName: "ISPF Research Collaborations",
    funder: "International Science Partnerships Fund (UK)",
    country: "United Kingdom",
    category: "international",
    description:
      "UK government fund supporting international science partnerships. Malaysian researchers partner with UK institutions on collaborative research.",
  },
  {
    id: "Merdeka-Award",
    name: "Merdeka Award Grant",
    fullName: "Merdeka Award Grant for International Attachment",
    funder: "Merdeka Award Trust (PETRONAS & Shell)",
    country: "Malaysia",
    category: "international",
    description:
      "Fully-funded 3-month international attachment at world-class institutions. For Malaysians aged 22–35 only. Covers travel and accommodation — not a research fund. Opens every two years via merdekaaward.my.",
  },
  {
    id: "Newton-Institutional-Links",
    name: "Newton Institutional Links",
    fullName: "Newton Fund Institutional Links (UK–Malaysia)",
    funder: "British Council / UK Research & Innovation",
    country: "United Kingdom",
    category: "international",
    description:
      "Supports research and innovation partnerships between UK and Malaysian institutions. Typically funds joint workshops, researcher exchanges, and collaborative pilot studies.",
  },
  {
    id: "International-Other",
    name: "Other International",
    fullName: "Other International Grant",
    funder: "",
    country: "",
    category: "international",
    description:
      "Any other international grant not listed above. You will provide grant details manually.",
  },
];

export const GRANT_SCHEME_MAP: Record<string, GrantSchemeInfo> = Object.fromEntries(
  GRANT_SCHEMES.map((g) => [g.id, g]),
);

export const MALAYSIAN_SCHEMES = GRANT_SCHEMES.filter((g) => g.category === "malaysian");
export const INTERNATIONAL_SCHEMES = GRANT_SCHEMES.filter((g) => g.category === "international");

// ─── Document Dependency Graph ──────────────────────────────────────────────

export const DOCUMENT_DEPENDENCIES: DependencyEntry[] = [
  // Phase 1 — Foundation & Discovery
  { phase: 1, step: 1, produces: "Method4_Convergence_Synthesis.md", requires: [], optional: [] },
  { phase: 1, step: 2, produces: "Grant_Matching.md", requires: [], optional: [] },
  { phase: 1, step: 3, produces: "Grant_Intelligence.md", requires: [], optional: [] },

  // Phase 2 — Strategic Positioning
  { phase: 2, step: 1, produces: "Requirements_Analysis.md", requires: ["Grant_Intelligence.md"], optional: [] },
  { phase: 2, step: 2, produces: "Competitive_Analysis.md", requires: ["Grant_Intelligence.md"], optional: ["Requirements_Analysis.md"] },
  { phase: 2, step: 3, produces: "Evaluator_Psychology.md", requires: ["Grant_Intelligence.md"], optional: [] },
  { phase: 2, step: 4, produces: "Impact_Framework.md", requires: ["Grant_Intelligence.md"], optional: ["Requirements_Analysis.md", "Competitive_Analysis.md", "Evaluator_Psychology.md"] },
  { phase: 2, step: 5, produces: "Proposal_Blueprint.md", requires: ["Grant_Intelligence.md"], optional: ["Requirements_Analysis.md", "Competitive_Analysis.md", "Evaluator_Psychology.md", "Impact_Framework.md"] },

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
  { phase: 4, step: 1, produces: "Team_Strategy.md", requires: ["Research_Design.md", "Proposal_Blueprint.md", "Grant_Intelligence.md"], optional: [] },
  { phase: 4, step: 2, produces: "Budget_Draft.md", requires: ["Research_Design.md", "Grant_Intelligence.md"], optional: ["Team_Strategy.md"] },
  { phase: 4, step: 3, produces: "Budget_Team_Plan.md", requires: ["Team_Strategy.md", "Budget_Draft.md", "Grant_Intelligence.md"], optional: [] },

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
      { step: 1, name: "Research Design Generator", type: "standard" },
      { step: 10, name: "Partnership & Support Evidence", type: "standard", isOptional: true },
      { step: 11, name: "Patent Search & Novelty Assessment", type: "standard", isOptional: true },
      { step: 12, name: "SDG Alignment", type: "standard", isOptional: true },
      { step: 13, name: "National Agenda Alignment", type: "standard", isOptional: true },
      { step: 14, name: "KPI & Output Planning", type: "standard", isOptional: true },
      { step: 15, name: "Researcher Profile Optimizer", type: "standard", isOptional: true },
      { step: 16, name: "Plagiarism & Originality Check", type: "standard", isOptional: true },
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
