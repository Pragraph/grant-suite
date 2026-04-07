import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step14-kpi-planning",
  phase: 3,
  step: 14,
  name: "KPI & Output Planning",
  description:
    "Design measurable key performance indicators, outputs, and outcomes that demonstrate project value and accountability.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "studyDuration",
    "country",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "KPI_Plan.md",
  epTags: ["EP-04", "EP-05", "EP-07"],
  estimatedWords: 2500,
  template: `You are a research evaluation and monitoring specialist. Your task is to design a comprehensive KPI and output framework that demonstrates the project's measurability, accountability, and value for money to grant evaluators.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if studyDuration}}- **Study Duration:** {{studyDuration}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT (from Phase 2)
{{> Proposal_Blueprint.md}}
{{/if}}

{{#if Research_Design.md}}
## RESEARCH DESIGN (from Phase 3)
{{> Research_Design.md}}
{{/if}}

{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if grantScheme}}
## MOHE KPI EXPECTATIONS
For MOHE grants, KPIs are evaluated strictly. MyGRANTS requires specific targets:
- **Publications:** Number of Scopus/WoS-indexed journal articles (Q1/Q2 preferred). Minimum for FRGS: 2 indexed articles (at least 1 must be Web of Science). Check current guidelines for exact requirements.
- **Postgraduate Training (Bakat):** This is non-negotiable. For FRGS specifically (Pindaan 2025):
  - 3-year project: MUST graduate 1 PhD student OR 2 Masters students as GRA
  - 2-year project: MUST graduate 1 Masters student as GRA
  - GRA must be full-time research mode from the grant-receiving institution
- **Conference Presentations:** International and national conferences with indexed proceedings.
- **Intellectual Property:** Patent filings (especially for PRGS), copyrights, utility innovations.
- **Community/Industry Engagement:** Workshops, consultations, MoUs (especially for PPRN).
- **Commercialisation:** For PRGS — prototype completion, licensing discussions, industry adoption.
- Format KPIs in a Year 1 / Year 2 / Year 3 / Cumulative table matching the MyGRANTS form fields.
- Be realistic — over-promising with undelivered prior KPIs damages future applications.

**GET-Specific KPI and ROV Requirements:**
If the target grant scheme is **GET**, the following additional requirements apply:

- **IP Filing (Mandatory):** Minimum 1 IP filing required. Priority is patent. 8 types of IP recognized: Patent/Utility Innovation (priority), Industrial Design, Geographical Indications, Copyright, Integrated Circuit Layout Design, New Plant Variety, Technology Disclosure, Trademark.
- **Publications:** Strongly encouraged (not strictly mandatory like FRGS). Articles in indexed journals with GET JPT acknowledgment. Industry co-authored publications are strongly encouraged.
- **Talent (GRA):** PhD or Masters full-time research mode. Priority given to Malaysian citizens. GRA rates: PhD max RM3,000/month, Masters max RM2,500/month.
- **ROV (Return of Value) — MANDATORY:**
  ROV is a paradigm shift unique to GET. Every project must produce ROV commensurate with the investment. ROV is calculated based on:
  (a) IP registration
  (b) Publications
  (c) Talent development
  (d) Changes to target groups (beneficiaries)

  The ROV projection must be attached to the application. ROV is monitored for 3 YEARS after project completion — plan for long-term impact from the start.

- **Policy Impact (if applicable):** Guidelines, white papers, or technical reports presented to relevant ministries/agencies.
- **Beneficiaries (if applicable):** Must identify target beneficiaries — Government, Industry, Community, Schools, NGOs, etc.
- **Video Impact:** 3-minute video following JPT format guidelines required as final deliverable.
- **Infographic/Poster:** Required as final deliverable alongside the video.

**GET ROV Output Planning Table (use this structure):**

| Output | Impact Target | Impact Indicator | Example KPI |
|--------|--------------|-----------------|-------------|
| Publications | New knowledge generation & research visibility | Number of publications, journal index, citations | ≥1 indexed journal article (Scopus/WoS/MyCITE) |
| Conferences | Knowledge dissemination | Presentations delivered | ≥1 conference presentation |
| Talent (GRA) | Graduate employability & advanced expertise | Employment rate, starting salary | ≥80% employed within 6 months |
| IP Filing | Innovation protection & commercialization readiness | Number of IP filed, type, status | ≥1 IP filing (patent priority) |
| Guidelines/White Paper | Technical reference & knowledge transfer | Documents approved/adopted | ≥1 technical document presented to ministry/agency |
| Beneficiaries | Improved efficiency/quality of life | Satisfaction level, number of beneficiaries | ≥1 target group benefiting; ≥70% satisfaction |
| Policy Impact | Evidence-based policy support | Number of policy inputs, recognition | ≥1 technical input to policy/standard |
| Cost/Time Savings | Operational efficiency | Percentage saved | ≥20% time or ≥15% cost savings vs existing methods |
| Economic/Social Impact | Value creation & social welfare | Economic value, beneficiary count | ≥1 community/industry engaged |
| External Funding | Research sustainability | Follow-on funding secured | ≥1 external funding application; ≥RM100,000 |
| Prototype/Invention | Proof of concept & TRL readiness | TRL level achieved | ≥1 proof-of-concept at TRL 2-3 |
| Commercialization | Revenue generation | Licensing agreements, market tests | ≥1 licensing agreement or market test |

Format KPIs in a Year 1 / Year 2 / Year 3 / Cumulative table matching the MyGRANTS form fields.
{{/if}}

## INSTRUCTIONS

Produce a KPI & Output Plan covering:

---

### 1. Output Framework (EP-04)
| Output Category | Specific Output | Quantity | Timeline | Verification Method |
|----------------|----------------|----------|----------|-------------------|
Categories should include: Publications, Datasets, Tools/Software, Trained Personnel, Policy Briefs, Patents/IP, Community Outcomes, etc.

### 2. Outcome Framework (EP-05)
| Outcome | Indicator | Baseline | Target | Data Source | Measurement Frequency |
|---------|-----------|----------|--------|-------------|---------------------|

### 3. Key Performance Indicators (EP-07)
Design SMART KPIs (Specific, Measurable, Achievable, Relevant, Time-bound):
| KPI | Description | Target Value | Timeline | Responsible | Risk Level |
|-----|------------|-------------|----------|------------|-----------|

Include KPIs for:
- **Research quality** — Publication impact, citation metrics, methodological rigor
- **Research training** — Students/postdocs trained, skills transferred
- **Knowledge transfer** — Workshops, seminars, industry engagement
- **Societal impact** — Policy influence, community benefit, public engagement
- **Financial** — Budget utilization, co-funding leveraged

### 4. Monitoring & Evaluation Plan
- **M&E approach** — How will progress be tracked?
- **Reporting schedule** — Align with funder requirements
- **Data collection tools** — What tools will gather KPI data?
- **Responsible parties** — Who monitors what?
- **Course correction** — How will underperformance be addressed?

### 5. Logic Model
Present the project logic model:
**Inputs** → **Activities** → **Outputs** → **Short-term Outcomes** → **Medium-term Outcomes** → **Long-term Impact**

### 6. Funder-Specific Metrics
- What metrics does this specific funder prioritize?
- Standard reporting templates or formats required
- Benchmark values from similar funded projects

---

## OUTPUT FORMAT
Structure as "# KPI & Output Plan". Begin with a summary table of top 10 KPIs. Use tables extensively. Flag items needing researcher input with [USER INPUT NEEDED].`,
};
