import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step1-data-compiler",
  phase: 5,
  step: 1,
  name: "Proposal Data Compiler",
  description:
    "Compile ALL upstream documents into a single, structured Proposal_Data.md that feeds every writing step in Phase 5.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "budgetRange",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
    "Budget_Team_Plan.md",
    "Partnership_Plan.md",
    "Patent_Analysis.md",
    "SDG_Alignment.md",
    "National_Alignment.md",
    "KPI_Plan.md",
    "grantScheme",
  ],
  outputName: "Proposal_Data.md",
  epTags: ["EP-01", "EP-02", "EP-03", "EP-04", "EP-05", "EP-06", "EP-07", "EP-08", "EP-09", "EP-10"],
  estimatedWords: 8000,
  template: `You are a research proposal strategist. Your task is to compile all available upstream planning documents into a single, comprehensive **Proposal_Data.md** reference file. This compiled document will be used as the sole input for every subsequent writing step (executive summary, methods, background, impact, budget justification, and final assembly).

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if budgetRange}}- **Budget Range:** {{budgetRange}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

---

## REQUIRED SOURCE DOCUMENTS

### Grant Intelligence (Phase 1)
{{> Grant_Intelligence.md}}

### Proposal Blueprint (Phase 2)
{{> Proposal_Blueprint.md}}

### Research Design (Phase 3)
{{> Research_Design.md}}

### Budget & Team Plan (Phase 4)
{{> Budget_Team_Plan.md}}

---

{{#if Partnership_Plan.md}}
## OPTIONAL: Partnership Plan (Phase 3A)
{{> Partnership_Plan.md}}
{{/if}}

{{#if Patent_Analysis.md}}
## OPTIONAL: Patent & Novelty Analysis (Phase 3B)
{{> Patent_Analysis.md}}
{{/if}}

{{#if SDG_Alignment.md}}
## OPTIONAL: SDG Alignment (Phase 3C)
{{> SDG_Alignment.md}}
{{/if}}

{{#if National_Alignment.md}}
## OPTIONAL: National Priority Alignment (Phase 3C)
{{> National_Alignment.md}}
{{/if}}

{{#if KPI_Plan.md}}
## OPTIONAL: KPI Plan (Phase 3C)
{{> KPI_Plan.md}}
{{/if}}

---

## INSTRUCTIONS

Compile all the above documents into a single, well-organized **Proposal_Data.md** with the following structure:

### 1. Project Overview
- Project title, discipline, funder, and key parameters
- One-paragraph research summary
- Key innovation/unique contribution

### 2. Funder Intelligence Summary
- Funder priorities, evaluation criteria, and scoring rubric (from Grant Intelligence)
- Word limits and formatting requirements
- Key reviewer expectations

### 3. Strategic Positioning
- Competitive advantage and positioning strategy (from Proposal Blueprint)
- Narrative arc and persuasion framework
- Key claims the proposal must support

### 4. Research Design Summary
- Research questions/hypotheses
- Methodology overview with key methods
- Work packages and timeline
- Expected outputs and deliverables

### 5. Team & Budget Summary
- Team composition and role matrix
- Budget overview (total and by category)
- Key justification points

{{#if Partnership_Plan.md}}
### 6. Partnership & Collaboration
- Partner organizations and their roles
- Letters of support status
- Collaboration framework
{{/if}}

{{#if Patent_Analysis.md}}
### 7. Novelty & IP Landscape
- Key prior art findings
- Novelty claims and differentiation
- IP strategy
{{/if}}

{{#if SDG_Alignment.md}}
### 8. SDG & Impact Alignment
- Relevant SDGs and alignment rationale
{{/if}}

{{#if National_Alignment.md}}
### 9. National Priority Alignment
- Relevant national priorities and policies
{{/if}}

{{#if KPI_Plan.md}}
### 10. KPIs & Success Metrics
- Key performance indicators
- Measurement methodology
- Success thresholds
{{/if}}

### Cross-Reference Matrix
Create a table mapping each proposal section (Executive Summary, Methods, Background, Impact, Budget Justification) to the specific data points from the above sections that should be cited.

## IMPORTANT GUIDELINES
- Preserve specific numbers, dates, names, and metrics — do NOT generalize.
- Flag any gaps or inconsistencies between documents with [USER INPUT NEEDED].
- Where information is incomplete, mark with [USER INPUT NEEDED: specific description].
- Use markdown headings, tables, and bullet points for scannability.
- This document must be self-contained — a writer using ONLY this document should be able to draft every proposal section.

## OUTPUT FORMAT
Output a single markdown document titled "# Proposal Data Compilation" with the numbered sections above.`,
};
