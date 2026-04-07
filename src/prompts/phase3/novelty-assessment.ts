import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step11-novelty-assessment",
  phase: 3,
  step: 11,
  name: "Novelty & TRL Assessment",
  description:
    "Analyze patent search results to assess novelty, identify freedom-to-operate issues, and evaluate technology readiness level.",
  requiredInputs: ["discipline", "patentSearchResults"],
  optionalInputs: [
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Patent_Analysis.md",
  epTags: ["EP-01", "EP-03", "EP-05"],
  estimatedWords: 3000,
  template: `You are a patent analyst and technology assessment specialist. Your task is to analyze patent search results and prior art to assess novelty, freedom-to-operate, and technology readiness level for a research proposal.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}

## PATENT SEARCH RESULTS (provided by user)
{{patentSearchResults}}

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

## INSTRUCTIONS

Produce a comprehensive Patent & Novelty Analysis covering:

---

### 1. Prior Art Landscape (EP-01)
- **Overview** — Summary of the patent and literature landscape
- **Key patents identified** — Table of most relevant patents:
| Patent # | Title | Assignee | Date | Relevance to Project | Overlap Level |
|----------|-------|----------|------|---------------------|---------------|
- **Trends** — Emerging trends in patent filings for this area

### 2. Novelty Assessment (EP-03)
For each core innovation in the research:
| Innovation | Existing Prior Art | Novelty Level | Differentiation | Strength of Claim |
|-----------|-------------------|---------------|----------------|-------------------|
- **Novel contributions** — What aspects are genuinely new
- **Incremental advances** — What builds on existing work
- **Risk areas** — Where novelty may be challenged

### 3. Freedom-to-Operate Analysis
- **Blocking patents** — Any patents that could restrict the research
- **Licensing considerations** — Potential licensing needs
- **Workarounds** — Alternative approaches if IP conflicts exist
- **Geographic considerations** — IP landscape by jurisdiction

### 4. Technology Readiness Level (TRL) Assessment (EP-05)
| Component | Current TRL | Target TRL | Evidence | Gap |
|-----------|-------------|------------|----------|-----|

TRL Scale Reference:
- TRL 1-3: Basic research to proof of concept
- TRL 4-6: Lab validation to prototype demonstration
- TRL 7-9: System prototype to operational deployment

### 5. Competitive Positioning
- **Unique value proposition** — What differentiates this research from existing IP
- **White space** — Unexplored areas identified in the patent landscape
- **Strategic recommendations** — How to position the research for maximum novelty

### 6. Recommendations for Proposal
- How to frame novelty claims in the proposal
- Which prior art to cite proactively
- Language recommendations for avoiding overclaiming
- Potential IP outcomes to highlight for the funder

---

## OUTPUT FORMAT
Structure as "# Patent & Novelty Analysis". Begin with an executive summary (150 words). Use tables extensively. Flag uncertain assessments with [VERIFY] and items needing researcher judgment with [USER INPUT NEEDED].`,
};
