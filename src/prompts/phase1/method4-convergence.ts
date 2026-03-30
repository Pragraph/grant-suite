import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method4-convergence",
  phase: 1,
  step: 1,
  name: "Convergence Synthesis",
  description:
    "Synthesize outputs from multiple discovery methods to identify convergent themes and recommend top research directions.",
  requiredInputs: ["discipline"],
  optionalInputs: ["areaOfInterest", "country", "careerStage", "grantScheme"],
  outputName: "Method4_Convergence_Synthesis.md",
  epTags: ["EP-01"],
  estimatedWords: 3000,
  template: `You are a senior research strategist. Your task is to synthesize the outputs from multiple research discovery methods and identify convergent themes that point to the strongest, most fundable research directions.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if areaOfInterest}}- **Area of Interest:** {{areaOfInterest}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if grantScheme}}
## GRANT SCHEME CONTEXT
When scoring convergence and ranking research directions, factor in the specific priorities of the {{grantScheme}} scheme:
- For MOHE grants (FRGS, PRGS, TRGS, LRGS, PPRN): prioritise directions that align with Malaysian national research priority areas and the 13th Malaysia Plan (RMKe-13)
- For FRGS: favour fundamental research with clear novelty claims supportable by patent search evidence
- For PRGS: favour directions with clear prototype/product potential and TRL progression narrative
- For TRGS/LRGS: favour directions requiring multi-disciplinary or multi-institutional collaboration
- For international grants: prioritise directions with strong international collaboration potential
{{/if}}

## DISCOVERY METHOD OUTPUTS

{{#if method1_output}}
### Method 1: Gap-Based Discovery
{{method1_output}}
{{/if}}

{{#if method2_output}}
### Method 2: Trend-Based Discovery
{{method2_output}}
{{/if}}

{{#if method3_output}}
### Method 3: Funding-Landscape Discovery
{{method3_output}}
{{/if}}

## INSTRUCTIONS

### 1. Cross-Method Theme Mapping (EP-01)
Identify themes, topics, or research directions that appear across multiple methods:
- For each convergent theme, note which methods support it and how
- Highlight themes that appear in all available methods (strongest signal)
- Note themes unique to a single method that are still compelling

### 2. Convergence Matrix
Create a table scoring each identified theme:
| Theme | Gap Evidence (1-5) | Trend Support (1-5) | Funding Alignment (1-5) | Feasibility (1-5) | Total |

Score 0 if that method was not available, and note it.

### 3. Top 3 Research Directions
For each of the top 3 ranked directions, provide:
- **Direction Title** — concise, descriptive name
- **Research Question** — a specific, testable question
- **Convergence Evidence** — why multiple signals point here
- **Novelty Argument** — what makes this direction fresh
- **Impact Potential** — scientific, societal, and economic impact
- **Funding Fit** — which funders would likely support this
- **Feasibility Assessment** — realistic timeline and resource needs
- **Risk Factors** — potential challenges and how to mitigate them

### 4. Recommended Direction
Based on the convergence analysis, recommend which single direction offers the best balance of novelty, impact, feasibility, and funding potential. Justify your recommendation.

### 5. Next Steps
For the recommended direction:
- Key literature to review (5-10 papers)
- Potential collaborators or research groups to approach
- Specific grant programs to target
- Timeline for developing a full proposal

## OUTPUT FORMAT
Structure your response as a well-organized markdown document with clear headings, tables, and bullet points. Be specific and actionable.`,
};
