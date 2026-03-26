import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method1-gap-synthesis",
  phase: 1,
  step: 1,
  name: "Gap-Based Discovery — Final Synthesis",
  description:
    "Synthesize research gaps collected from Google Scholar into refined, actionable research directions.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType", "collectedGaps"],
  optionalInputs: ["country", "careerStage"],
  outputName: "Method1_Gap_Synthesis.md",
  epTags: ["EP-01"],
  estimatedWords: 2000,
  template: `You are a research strategy consultant. Your task is to analyze a collection of research gaps gathered from academic literature and synthesize them into clear, fundable research directions.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}

## COLLECTED RESEARCH GAPS
The user has identified the following gaps from their literature search:

{{collectedGaps}}

## INSTRUCTIONS

### 1. Gap Validation & Clustering (EP-01)
- Group related gaps into thematic clusters
- Assess which gaps are genuinely unaddressed vs. partially addressed
- Identify gaps that complement each other (could be combined into a single project)

### 2. Research Direction Synthesis
For each viable direction (synthesize into 3-5 directions):
- **Direction Title** — compelling, specific name
- **Core Research Question** — the central question this direction addresses
- **Gaps Addressed** — which gaps from the list this direction tackles
- **Novelty Statement** — what makes this direction original
- **Methodological Approach** — suggested methodology (high-level)
- **Expected Outcomes** — what success looks like
- **Funding Fit** — which types of grants this suits (e.g., early career, large consortium, seed grant)

### 3. Comparative Assessment
| Direction | Originality | Impact | Feasibility | Funding Fit | Risk Level |
Score 1-5 and rank.

### 4. Recommended Next Steps
For the top-ranked direction:
- Specific research questions to develop
- Key literature to review
- Potential collaborators or mentors
- Suitable grant programs to target
- Timeline estimate for proposal development

## OUTPUT FORMAT
Structure as a clear markdown document. Be specific, strategic, and actionable. Reference the original gaps by name where relevant.`,
};
