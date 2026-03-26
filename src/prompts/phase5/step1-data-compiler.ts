import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.data-compiler",
  phase: 5,
  step: 1,
  name: "Impact Narrative",
  description:
    "Compile research outputs, milestones, and projected outcomes into a structured impact narrative that demonstrates societal, academic, and economic value.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "budgetRange",
    "Innovation_Statement.md",
    "Detailed_Methodology.md",
    "Work_Plan_Timeline.md",
    "Grant_Intelligence.md",
  ],
  outputName: "Impact_Narrative.md",
  epTags: ["EP-06", "EP-07", "EP-08", "EP-10"],
  estimatedWords: 3500,
  template: `You are a research impact specialist who helps academics translate technical research plans into compelling impact narratives for funding bodies. Your task is to compile all available project data into a structured impact case.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if budgetRange}}- **Budget Range:** {{budgetRange}}{{/if}}

{{#if Innovation_Statement.md}}
## INNOVATION STATEMENT (from Phase 2)
{{> Innovation_Statement.md}}
{{/if}}

{{#if Detailed_Methodology.md}}
## DETAILED METHODOLOGY (from Phase 4, Step 1)
{{> Detailed_Methodology.md}}
{{/if}}

{{#if Work_Plan_Timeline.md}}
## WORK PLAN & TIMELINE (from Phase 4, Step 2)
{{> Work_Plan_Timeline.md}}
{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

## INSTRUCTIONS

### 1. Impact Domains Assessment (EP-06)
Identify and elaborate on impacts across all relevant domains:
- **Academic Impact** — contributions to knowledge, publications, methodology advances
- **Societal Impact** — benefits to communities, policy influence, public engagement
- **Economic Impact** — commercial potential, efficiency gains, workforce development
- **Environmental Impact** (if applicable) — sustainability contributions
- **Cultural Impact** (if applicable) — heritage, creative industries, public discourse

### 2. Evidence-Based Projections (EP-07)
For each impact claim:
- Cite comparable research outcomes as evidence
- Provide quantitative projections where possible (publications, citations, beneficiaries)
- Define measurable indicators and success metrics
- Establish realistic timelines for impact realization

### 3. Pathway to Impact (EP-08)
Map the causal chain from research activities to outcomes:
- Immediate outputs (papers, datasets, tools, trained researchers)
- Medium-term outcomes (policy changes, adopted practices, follow-on funding)
- Long-term impact (systemic change, field transformation)
- Identify key stakeholders and beneficiaries at each stage

### 4. Impact Narrative Draft (EP-10)
Produce a cohesive impact narrative (1000–1500 words) that:
- Tells a compelling story connecting research to real-world change
- Uses concrete examples and projected metrics
- Addresses the funder's specific impact requirements
- Balances ambition with credibility
- Includes a summary impact table

## OUTPUT FORMAT
Structure your response with the four numbered sections, using markdown headings, tables for metrics and timelines, and bullet points for clarity. The narrative in Section 4 should be polished prose suitable for direct inclusion in the proposal.`,
};
