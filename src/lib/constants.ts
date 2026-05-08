import type { DependencyEntry, PhaseDefinition, GrantSchemeInfo, JourneyModeInfo } from "./types";

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
    maxBudget: 250000,
    defaultCurrency: "MYR",
    requiresPatentSearch: false,
    requiresMyGrants: true,
    requiresTurnitin: true,
    maxSimilarityIndex: 20,
    description:
      "Funds fundamental research across all disciplines in Malaysian public universities. Maximum RM250,000 for 2–3 years. Evaluated via MyGRANTS with emphasis on novelty, methodology, and researcher competency. Patent search is encouraged (digalakkan). Risk assessment plan is mandatory (dimestikan).",
  },
  {
    id: "GET",
    name: "GET",
    fullName: "Geran Penyelidikan Eksploratori dan Transformatif (Exploratory & Transformative Research Grant)",
    funder: "Ministry of Higher Education (MOHE)",
    country: "Malaysia",
    category: "malaysian",
    defaultBudgetRange: "RM 100,000 – RM 250,000",
    maxBudget: 250000,
    defaultCurrency: "MYR",
    requiresPatentSearch: true,
    requiresMyGrants: true,
    requiresTurnitin: false,
    requiresIndustryCollaboration: true,
    requiresIPFiling: true,
    requiresMentor: true,
    requiresROV: true,
    lifetimeProjectCap: 3,
    subCategories: [
      {
        id: "exploratory",
        name: "Exploratory (Eksploratori)",
        description: "Explore new knowledge through research to understand problems or phenomena. Generates hypotheses, basic understanding, or conceptual frameworks. Flexible and open-ended.",
        trlRange: "TRL 1–2",
      },
      {
        id: "transformative",
        name: "Transformative (Transformatif)",
        description: "Radical change to existing policies, SOPs, processes, or systems. Produces proof of concept, radical innovation, or policy transformation. Structured with clear beneficiaries.",
        trlRange: "TRL 2–3",
      },
    ],
    description:
      "Funds exploratory and transformative research in Malaysian public and private universities. Two sub-categories: Exploratory (TRL 1-2, generating hypotheses and conceptual frameworks) and Transformative (TRL 2-3, radical innovation and proof of concept). Maximum RM250,000 for 2–3 years. Industry collaboration is mandatory (LOI/MoU/MoA required). Patent search via lens.org is mandatory. Minimum 1 IP filing required. ROV (Return of Value) is mandatory with 3-year post-completion monitoring. Mentor required for Associate Professor and below.",
  },
  {
    id: "PRGS",
    name: "PRGS",
    fullName: "Prototype Research Grant Scheme",
    funder: "Ministry of Higher Education (MOHE)",
    country: "Malaysia",
    category: "malaysian",
    defaultBudgetRange: "RM 100,000 – RM 500,000",
    maxBudget: 500000,
    defaultCurrency: "MYR",
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
    maxBudget: 2000000,
    defaultCurrency: "MYR",
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
    maxBudget: 5000000,
    defaultCurrency: "MYR",
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
    maxBudget: 350000,
    defaultCurrency: "MYR",
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
    maxBudget: 60000,
    defaultCurrency: "MYR",
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
    defaultCurrency: "USD",
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
    defaultCurrency: "GBP",
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
    defaultCurrency: "MYR",
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
    defaultCurrency: "GBP",
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

// ─── Scheme Priority Frameworks ─────────────────────────────────────────────
// Source: FRGS Pindaan 2025, GET Garis Panduan 2026, Taklimat BKPI JPT 26 Feb 2026

export interface SchemePriorityFramework {
  scheme: string;
  policyAlignment: string[];
  megaTrends?: string[];
  bitaraNiches?: string[];
  esgComponents?: string[];
  notes: string;
}

export const SCHEME_PRIORITY_FRAMEWORKS: SchemePriorityFramework[] = [
  {
    scheme: "FRGS",
    policyAlignment: ["MADANI", "MySTIE", "SDGs"],
    notes: "Implicit alignment with national strategic agendas. No explicit Mega Trends, BITARA, or ESG requirement.",
  },
  {
    scheme: "GET",
    policyAlignment: ["RPTM 2026-2035", "MADANI", "MySTIE", "SDGs", "Mega Trends RMK13", "BITARA", "ESG"],
    megaTrends: [
      "Perubahan Susunan Blok Ekonomi (Shifting Economic Blocs)",
      "Teknologi & Digital Masa Hadapan (Future Technology & Digital)",
      "Demografi & Kualiti Hidup (Demographics & Quality of Life)",
      "Krisis Kesihatan Bumi (Global Health Crisis)",
      "Pendidikan (Education)",
      "Keselamatan Negara (National Security)",
      "Warisan & Kearifan Tempatan (Heritage & Local Wisdom)",
    ],
    bitaraNiches: [
      "E&E", "Aerospace", "Chemical", "Machinery & Equipment",
      "Digital & ICT", "Pharmaceutical", "Medical Devices",
      "Palm Oil Products", "Rubber Products",
    ],
    esgComponents: ["Environmental", "Social", "Governance"],
    notes: "Explicit and detailed alignment required. Must state alignment with Mega Trends, BITARA, MADANI, ESG, SDGs, MySTIE, and RPTM 2026-2035.",
  },
  {
    scheme: "PRGS",
    policyAlignment: ["MADANI", "MySTIE", "SDGs"],
    notes: "Implicit alignment. Focus on prototype development and commercialisation pathway.",
  },
  {
    scheme: "TRGS",
    policyAlignment: ["MADANI", "MySTIE", "SDGs"],
    notes: "Cross-faculty/cross-university collaboration emphasis. National priority alignment implicit.",
  },
  {
    scheme: "LRGS",
    policyAlignment: ["MADANI", "MySTIE", "SDGs"],
    notes: "Strong national policy alignment required. Consortium-based, long-term impact.",
  },
  {
    scheme: "PPRN",
    policyAlignment: ["MADANI", "MySTIE", "SDGs"],
    notes: "Industry-driven. Alignment with industry partner's sector priorities.",
  },
];

export const SCHEME_PRIORITY_MAP: Record<string, SchemePriorityFramework> = Object.fromEntries(
  SCHEME_PRIORITY_FRAMEWORKS.map((f) => [f.scheme, f]),
);

export const MALAYSIAN_SCHEMES = GRANT_SCHEMES.filter((g) => g.category === "malaysian");
export const INTERNATIONAL_SCHEMES = GRANT_SCHEMES.filter((g) => g.category === "international");

// ─── Currencies ────────────────────────────────────────────────────────────

export const CURRENCIES = [
  { code: "MYR", name: "Malaysian Ringgit (RM)", symbol: "RM" },
  { code: "USD", name: "US Dollar ($)", symbol: "$" },
  { code: "GBP", name: "British Pound (£)", symbol: "£" },
  { code: "EUR", name: "Euro (€)", symbol: "€" },
  { code: "SGD", name: "Singapore Dollar (S$)", symbol: "S$" },
  { code: "IDR", name: "Indonesian Rupiah (Rp)", symbol: "Rp" },
  { code: "SAR", name: "Saudi Riyal (SAR)", symbol: "SAR" },
  { code: "AUD", name: "Australian Dollar (A$)", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen (¥)", symbol: "¥" },
] as const;

// ─── Journey Modes ──────────────────────────────────────────────────────────

export const JOURNEY_MODES: JourneyModeInfo[] = [
  {
    id: "explore",
    label: "Explore & Discover",
    description:
      "I'm starting fresh. Help me find a research direction and the right grant to pursue.",
    icon: "Compass",
    startingPhase: 1,
    bypassedPhases: [],
  },
  {
    id: "directed",
    label: "I Have My Direction",
    description:
      "I already have a research topic. Help me build the full proposal from here.",
    icon: "Target",
    startingPhase: 1,
    bypassedPhases: [],
  },
  {
    id: "planned",
    label: "I Have My Plan",
    description:
      "I have my topic, grant, and research design. Help me write and plan the budget.",
    icon: "FileText",
    startingPhase: 3,
    bypassedPhases: [1, 2],
  },
  {
    id: "review",
    label: "Review My Draft",
    description:
      "I have a complete or near-complete proposal. Help me review and optimize it.",
    icon: "CheckSquare",
    startingPhase: 6,
    bypassedPhases: [1, 2, 3, 4, 5],
  },
  {
    id: "resubmit",
    label: "Revise & Resubmit",
    description:
      "I have reviewer feedback on a rejected proposal. Help me strengthen and resubmit.",
    icon: "RotateCcw",
    startingPhase: 7,
    bypassedPhases: [1, 2, 3, 4, 5, 6],
  },
];

// ─── Document Dependency Graph ──────────────────────────────────────────────

export const DOCUMENT_DEPENDENCIES: DependencyEntry[] = [
  // Phase 1 — Foundation & Discovery
  { phase: 1, step: 1, produces: "Method4_Convergence_Synthesis.md", requires: [], optional: [] },
  { phase: 1, step: 2, produces: "Grant_Matching.md", requires: [], optional: [] },
  { phase: 1, step: 3, produces: "Grant_Intelligence.md", requires: [], optional: [] },

  // Phase 2 — Strategic Positioning
  { phase: 2, step: 1, produces: "Requirements_Analysis.md", requires: ["Grant_Intelligence.md"], optional: ["Method4_Convergence_Synthesis.md", "Method1_Gap_Synthesis.md", "Method2_Trend_Discovery.md", "Method3_Research_Direction_Brief.md"] },
  { phase: 2, step: 2, produces: "Competitive_Analysis.md", requires: ["Grant_Intelligence.md"], optional: ["Requirements_Analysis.md"] },
  { phase: 2, step: 3, produces: "Evaluator_Psychology.md", requires: ["Grant_Intelligence.md"], optional: [] },
  { phase: 2, step: 4, produces: "Impact_Framework.md", requires: ["Grant_Intelligence.md"], optional: ["Requirements_Analysis.md", "Competitive_Analysis.md", "Evaluator_Psychology.md"] },
  { phase: 2, step: 5, produces: "Proposal_Blueprint.md", requires: ["Grant_Intelligence.md"], optional: ["Requirements_Analysis.md", "Competitive_Analysis.md", "Evaluator_Psychology.md", "Impact_Framework.md", "Method4_Convergence_Synthesis.md", "Method1_Gap_Synthesis.md", "Method2_Trend_Discovery.md", "Method3_Research_Direction_Brief.md"] },

  // Phase 3 — Research Design & Optional Modules
  { phase: 3, step: 1, produces: "Research_Design.md", requires: ["Grant_Intelligence.md", "Proposal_Blueprint.md"], optional: ["Method4_Convergence_Synthesis.md", "Method1_Gap_Synthesis.md", "Method2_Trend_Discovery.md", "Method3_Research_Direction_Brief.md"] },
  { phase: 3, step: 10, produces: "Partnership_Plan.md", requires: [], optional: [], isOptional: true },
  { phase: 3, step: 10, produces: "Support_Letter.md", requires: [], optional: ["Partnership_Plan.md"], isOptional: true },
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
  { phase: 4, step: 3, produces: "Budget_Justification.md", requires: ["Team_Strategy.md", "Budget_Draft.md", "Grant_Intelligence.md"], optional: [] },

  // Phase 5 — Proposal Writing
  { phase: 5, step: 1, produces: "Proposal_Data.md", requires: ["Grant_Intelligence.md", "Proposal_Blueprint.md", "Research_Design.md", "Budget_Justification.md"], optional: ["Partnership_Plan.md", "Patent_Analysis.md", "SDG_Alignment.md", "National_Alignment.md", "KPI_Plan.md", "Researcher_Profile.md", "Method4_Convergence_Synthesis.md", "Method1_Gap_Synthesis.md", "Method2_Trend_Discovery.md", "Method3_Research_Direction_Brief.md"] },
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
  { phase: 6, step: 5, produces: "Form_Ready_Proposal.md", requires: ["Final_Proposal.md"], optional: ["Grant_Intelligence.md", "Budget_Draft.md", "KPI_Plan.md"] },

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
    description: "Discover your research direction, match grants, and gather intelligence",
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
    description: "Analyze requirements, competition, and evaluator expectations",
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
    description: "Design methodology and complete optional grant-specific modules",
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
    description: "Plan team composition, budget framework, and justification",
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
    description: "Draft and assemble all proposal sections into a complete document",
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
    description: "Review, audit, and finalize the proposal for submission",
    color: "phase-6",
    steps: [
      { step: 1, name: "Mock Review", type: "standard" },
      { step: 2, name: "EP Tag Audit", type: "standard" },
      { step: 3, name: "Compliance Check", type: "standard" },
      { step: 4, name: "Final Proposal", type: "standard" },
      { step: 5, name: "Application Form Mapper", type: "standard" },
    ],
  },
  {
    phase: 7,
    name: "Post-Submission & Resubmission",
    description: "Analyze feedback and prepare revised proposals for resubmission",
    color: "phase-7",
    steps: [
      { step: 1, name: "Feedback Analysis", type: "standard" },
      { step: 2, name: "Resubmission Strategy", type: "standard" },
      { step: 3, name: "Revised Proposal", type: "standard" },
    ],
  },
];
