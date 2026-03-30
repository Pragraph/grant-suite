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
- **Publications:** Number of Scopus/WoS-indexed journal articles (Q1/Q2 preferred). Typical FRGS target: 2–4 publications for a 2–3 year grant.
- **Postgraduate Training:** Number of PhD and Masters students supported. MOHE values capacity building highly.
- **Conference Presentations:** International and national conferences with indexed proceedings.
- **Intellectual Property:** Patent filings (especially for PRGS), copyrights, utility innovations.
- **Community/Industry Engagement:** Workshops, consultations, MoUs (especially for PPRN).
- **Commercialisation:** For PRGS — prototype completion, licensing discussions, industry adoption.
- Format KPIs in a Year 1 / Year 2 / Year 3 / Cumulative table matching the MyGRANTS form fields.
- Be realistic — over-promising with undelivered prior KPIs damages future applications.
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
