import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step4-background",
  phase: 5,
  step: 4,
  name: "Background Writer",
  description:
    "Draft the background/literature review section that justifies the methods and supports the executive summary's claims.",
  requiredInputs: ["discipline", "grantName", "country", "wordLimit"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "keyReferences",
    "Proposal_Data.md",
    "Executive_Summary_Draft.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Background_Draft.md",
  epTags: ["EP-01", "EP-02", "EP-03", "EP-10"],
  estimatedWords: 3000,
  template: `You are an expert academic proposal writer specializing in background and literature review sections. Your task is to draft a background section that builds the intellectual case for the proposed research, justifies the chosen methods, and supports every claim made in the executive summary.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}
- **Word Limit:** {{wordLimit}} words

{{#if keyReferences}}
## KEY REFERENCES PROVIDED BY USER
{{keyReferences}}
{{/if}}

## PROPOSAL DATA
{{> Proposal_Data.md}}

## EXECUTIVE SUMMARY (for narrative alignment)
{{> Executive_Summary_Draft.md}}

---

## INSTRUCTIONS

Write a background section that:

### 1. Context & Significance (opening)
- Establish the broader context and importance of the research area
- Use concrete data (statistics, trends, policy drivers) to demonstrate urgency
- Connect to the funder's strategic priorities

### 2. State of the Art
- Review the current knowledge landscape relevant to the research questions
- Organize thematically (not chronologically) around key concepts
- Highlight the most important and recent contributions
- Show command of the field while remaining accessible

### 3. Knowledge Gap
- Clearly identify what is NOT known or NOT solved
- Show how existing approaches fall short
- Build a logical argument for why the gap matters
- This should directly set up the proposed research as the natural next step

### 4. Theoretical/Conceptual Framework
- Present the theoretical lens or conceptual model guiding the research
- Explain how it integrates existing knowledge
- Show how it generates the specific research questions/hypotheses

### 5. Preliminary Work (if applicable)
- Describe any pilot studies, preliminary data, or prior results
- Show how preliminary findings support the feasibility of the proposed approach
- Mark as [USER INPUT NEEDED: preliminary data] if no data is available

### 6. How This Proposal Addresses the Gap
- Explicitly connect the proposed research to the identified gap
- Explain the expected contribution to knowledge
- Show how the methods (described in the Methods section) are justified by the literature

## WRITING GUIDELINES
- Write in a narrative style that builds a compelling intellectual argument
- Every paragraph should advance the argument toward "this research is necessary and timely"
- Cite literature using [CITATION NEEDED] placeholders — the user will add proper references
- Where the user provided key references, integrate them naturally
- Mirror claims from the Executive Summary and provide the evidence base
- The background must justify EVERY method chosen — if a method appears in Methods, the background must explain why it's appropriate
- Mark any gaps in your knowledge with [USER INPUT NEEDED: description]
- Use [CITATION NEEDED] liberally — it's better to flag where evidence is needed than to make unsupported claims

## WORD LIMIT
**CRITICAL:** The background section MUST be under {{wordLimit}} words. Prioritize the knowledge gap and justification sections.

## OUTPUT FORMAT
Output as a markdown document titled "# Background & Significance" with clear subsections. At the end, include:
1. Word count
2. List of [CITATION NEEDED] placeholders with suggested search terms for finding appropriate references
3. List of [USER INPUT NEEDED] items

{{#if grantScheme}}
## MYGRANTS SUBMISSION TIP
This maps to the "Literature Review / Background" field in MyGRANTS. The panel reads this to judge whether you understand the field. Use citations strictly from the last 5 years (2022–2026) for core claims. Older citations signal a stale literature review to MOHE panels.

If the target grant scheme is **GET**, note the explicit evaluation weights:
- Title & Keywords: 5%
- Executive Summary: 10%
- Background: 15%
- Objectives: 10%
- Methodology: 20%
- Expected Results/ROV: 20%
- Team Collaboration: 10%
- Industry Partner/Evidence: 10%

Allocate writing effort proportionally — Methodology and Expected Results/ROV together carry 40% of the score.
{{/if}}`,
};
