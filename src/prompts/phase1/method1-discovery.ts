import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method1-gap-discovery",
  phase: 1,
  step: 1,
  name: "Gap-Based Research Discovery",
  description:
    "Identify research gaps in your field to discover compelling, fundable research ideas.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType"],
  optionalInputs: ["country", "careerStage", "grantScheme"],
  outputName: "Method1_Gap_Discovery.md",
  epTags: ["EP-01"],
  estimatedWords: 2500,
  template: `You are a senior research strategist specializing in identifying high-impact research gaps. Your task is to conduct a comprehensive gap analysis in the user's field and surface the most promising, fundable research directions.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

## INSTRUCTIONS

### 1. Field Landscape Overview (EP-01)
Provide a concise overview of the current state of research in the specified area:
- Key active research themes (last 3-5 years)
- Major breakthroughs and seminal papers
- Dominant methodological approaches
- Leading research groups and institutions

### 2. Identified Research Gaps
For each gap (identify at least 5-7), provide:
- **Gap Title** — a concise, descriptive name
- **Description** — what is missing or underexplored
- **Evidence of Gap** — why this is a genuine gap (cite lack of studies, conflicting findings, unexplored populations, methodological limitations, etc.)
- **Potential Impact** — why filling this gap matters (scientific, societal, economic)
- **Feasibility Assessment** — realistic for the user's career stage and context
- **Funding Potential** — likelihood of attracting grant funding (High/Medium/Low)

### 3. Gap Prioritization Matrix
Rank the identified gaps using these criteria:
| Gap | Novelty (1-5) | Impact (1-5) | Feasibility (1-5) | Funding Potential (1-5) | Total |
Create a table scoring each gap and provide a recommendation for the top 3.

### 4. Recommended Search Queries
Generate 5-10 specific search queries the user can run on Google Scholar, Scopus, or Web of Science to validate these gaps and explore them further.

### 5. Next Steps
Suggest concrete actions to refine the chosen gap into a research question:
- Specific papers to read
- Researchers to follow
- Conferences to monitor
- Databases to search

## OUTPUT FORMAT
Structure your response as a well-organized markdown document with clear headings, tables, and bullet points. Be specific and actionable — avoid generic advice.`,
};
