import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step3-methods",
  phase: 5,
  step: 3,
  name: "Methods Writer",
  description:
    "Draft the methods/methodology section with detailed procedures, work packages, and timeline.",
  requiredInputs: ["discipline", "grantName", "country", "wordLimit"],
  optionalInputs: ["careerStage", "targetFunder", "Proposal_Data.md", "grantScheme"],
  outputName: "Methods_Draft.md",
  epTags: ["EP-03", "EP-04", "EP-05", "EP-08"],
  estimatedWords: 3000,
  template: `You are an expert academic proposal writer specializing in research methodology sections. Your task is to draft a detailed, rigorous methods section that demonstrates feasibility and scientific soundness.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}
- **Word Limit:** {{wordLimit}} words

## PROPOSAL DATA
{{> Proposal_Data.md}}

---

## INSTRUCTIONS

Write a methods section that covers:

### 1. Research Design Overview
- State the overall research design (experimental, observational, mixed methods, etc.)
- Justify why this design is appropriate for the research questions
- Describe the conceptual or theoretical framework guiding the methodology

### 2. Work Packages / Research Phases
For each work package or research phase:
- **Objective:** What this WP aims to achieve
- **Methods:** Specific procedures, techniques, and approaches
- **Data:** What data will be collected/generated and how
- **Analysis:** Analytical methods and tools
- **Outputs:** Expected deliverables
- **Timeline:** Duration and dependencies on other WPs
- **Responsible team member(s):** Who leads this WP

### 3. Data Management
- Data collection procedures and quality assurance
- Storage, security, and sharing plans
- Ethical considerations for data handling

### 4. Quality Assurance & Rigor
- How will you ensure validity and reliability?
- Peer review or advisory board mechanisms
- Risk mitigation strategies for methodological challenges

### 5. Timeline & Milestones
- Present a clear project timeline (suggest a Gantt chart format using markdown table)
- Key milestones and go/no-go decision points
- Dependencies between work packages

### 6. Ethical Considerations
- Required approvals (ethics committee, IRB, animal protocols)
- Participant consent procedures (if applicable)
- Data privacy compliance

## WRITING GUIDELINES
- Be specific about methods — name the techniques, software, equipment
- Justify each methodological choice (why THIS method, not alternatives)
- Show awareness of limitations and how you will address them
- Use the funder's evaluation criteria to emphasize the right aspects
- Connect methods back to the research questions stated in the Executive Summary
- Mark any methodological details you could not infer with [USER INPUT NEEDED: description]
- Mark any claims requiring literature support with [CITATION NEEDED]

## WORD LIMIT
**CRITICAL:** The methods section MUST be under {{wordLimit}} words. If space is tight, prioritize work package descriptions and timeline.

## OUTPUT FORMAT
Output as a markdown document titled "# Research Methodology" with clear subsections. Include a Gantt chart as a markdown table. Include a word count at the end.`,
};
