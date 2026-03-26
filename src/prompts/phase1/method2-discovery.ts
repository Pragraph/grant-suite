import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method2-trend-discovery",
  phase: 1,
  step: 1,
  name: "Trend-Based Research Discovery",
  description:
    "Analyze publication and citation trends to identify emerging research frontiers with high funding potential.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType", "trendData"],
  optionalInputs: ["country", "careerStage"],
  outputName: "Method2_Trend_Discovery.md",
  epTags: ["EP-01"],
  estimatedWords: 2500,
  template: `You are a bibliometric analyst and research trend forecaster. Your task is to analyze publication and citation trend data to identify emerging research frontiers and high-growth areas.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}

## TREND DATA FROM PUBLISH OR PERISH
The user has collected the following bibliometric data using Publish or Perish:

{{trendData}}

## INSTRUCTIONS

### 1. Trend Analysis (EP-01)
Analyze the provided data to identify:
- **Rising Topics** — themes showing accelerating publication/citation growth
- **Declining Areas** — topics losing momentum (potential saturation)
- **Emerging Intersections** — novel combinations of established fields
- **Methodological Shifts** — new approaches gaining traction

### 2. Growth Trajectory Assessment
For each identified trend:
- **Trend Name** — concise label
- **Growth Indicators** — publication volume, citation velocity, h-index trajectory
- **Key Contributors** — leading authors and institutions driving the trend
- **Estimated Maturity** — Emerging / Growing / Established / Saturating
- **Window of Opportunity** — how much time before the field becomes crowded

### 3. Research Opportunity Mapping
Connect trends to research opportunities:
| Trend | Opportunity | Novelty | Competition Level | Funding Alignment |
Create a scored matrix (1-5 for each) and rank opportunities.

### 4. Recommended Research Directions
For the top 3 opportunities:
- **Proposed Research Angle** — specific direction to pursue
- **Why Now** — timing justification based on trend data
- **Differentiation Strategy** — how to stand out in a growing field
- **Potential Funders** — organizations likely interested in this trend

### 5. Validation Strategy
Suggest how to validate the chosen direction:
- Additional databases to search
- Key conferences tracking these trends
- Expert networks to consult
- Preprint servers to monitor

## OUTPUT FORMAT
Structure your response as a markdown document with data-driven insights. Include tables for comparative analysis. Reference specific data points from the provided trend data wherever possible.`,
};
