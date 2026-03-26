import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method3-funding-discovery",
  phase: 1,
  step: 1,
  name: "Funding-Landscape Research Discovery",
  description:
    "Analyze funded project databases to discover research directions aligned with active funding priorities.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType", "fundingData"],
  optionalInputs: ["country", "careerStage"],
  outputName: "Method3_Funding_Discovery.md",
  epTags: ["EP-01"],
  estimatedWords: 2500,
  template: `You are a funding intelligence specialist with deep expertise in grant landscapes. Your task is to analyze funded project data to identify research directions that align with current and emerging funding priorities.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}

## FUNDED PROJECT DATA FROM DIMENSIONS.AI
The user has collected the following data on funded projects:

{{fundingData}}

## INSTRUCTIONS

### 1. Funding Landscape Analysis (EP-01)
Analyze the provided data to map the funding landscape:
- **Active Funding Themes** — what funders are currently investing in
- **Funding Volume & Trends** — where money is flowing (increasing/stable/decreasing)
- **Geographic Distribution** — regional funding patterns
- **Funder Priorities** — explicit and implicit preferences of major funders
- **Funding Gaps** — areas with research need but limited funding (emerging opportunities)

### 2. Funded Project Pattern Analysis
Identify patterns across funded projects:
- **Common Methodologies** — approaches that funders favor
- **Team Composition** — typical team sizes, interdisciplinarity, collaborations
- **Budget Ranges** — typical funding amounts by project type
- **Duration Patterns** — standard project timelines
- **Success Indicators** — what successful proposals in this area emphasize

### 3. Strategic Opportunity Identification
Map research opportunities against funding availability:
| Research Direction | Funder Alignment | Competition | Funding Amount Range | Probability of Success |
Score each (1-5) and provide rankings.

### 4. Recommended Research Directions
For the top 3 funding-aligned opportunities:
- **Proposed Direction** — specific research angle
- **Target Funders** — which funders are most likely to fund this
- **Alignment Strategy** — how to frame the research to match funder priorities
- **Competitive Advantage** — how to differentiate from existing funded projects
- **Budget Strategy** — recommended funding level and duration

### 5. Proposal Positioning Recommendations
Strategic advice for each recommended direction:
- Key buzzwords and framing language funders respond to
- Required partnerships or collaborations
- Impact narratives that resonate with funders
- Timing considerations (call cycles, strategic initiatives)

## OUTPUT FORMAT
Structure your response as a markdown document with strategic, actionable insights. Use tables for comparisons. Ground recommendations in the specific funded project data provided.`,
};
