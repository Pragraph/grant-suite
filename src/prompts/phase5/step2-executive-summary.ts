import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step2-executive-summary",
  phase: 5,
  step: 2,
  name: "Executive Summary Writer",
  description:
    "Draft a compelling executive summary that establishes the narrative arc for the entire proposal.",
  requiredInputs: ["discipline", "grantName", "country", "wordLimit"],
  optionalInputs: ["careerStage", "targetFunder", "Proposal_Data.md", "grantScheme"],
  outputName: "Executive_Summary_Draft.md",
  epTags: ["EP-01", "EP-02", "EP-03", "EP-10"],
  estimatedWords: 1500,
  template: `You are an expert academic proposal writer specializing in executive summaries for competitive research grants. Your task is to draft a compelling executive summary that establishes the narrative arc for all other proposal sections.

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

{{#if grantScheme}}
## MOHE EXECUTIVE SUMMARY FORMAT
For MyGRANTS applications:
- The abstract/executive summary field in MyGRANTS has a character limit (typically 300–500 words) — verify the exact limit from Grant_Intelligence.md
- Must include: research problem, objectives, methodology overview, expected outcomes, and significance
- Opening sentence should establish national relevance — connect to RMKe-13 or NPSTI where defensible
- Close with a concrete impact statement using measurable outcomes
- Avoid jargon that a non-specialist reviewer may struggle with — MOHE panels include generalists
{{/if}}

## INSTRUCTIONS

Write an executive summary that:

### 1. Opening Hook (1-2 sentences)
- Start with a compelling problem statement or opportunity that grabs the reviewer's attention
- Connect to a broader societal, scientific, or economic need

### 2. Gap & Opportunity (1-2 paragraphs)
- Clearly articulate the knowledge gap or unmet need
- Explain why NOW is the right time to address this
- Reference the state of the art and its limitations

### 3. Proposed Solution (1-2 paragraphs)
- Present your research approach as the logical response to the gap
- Highlight what is innovative or novel about your approach
- State your core research questions or hypotheses

### 4. Methodology Preview (1 paragraph)
- Briefly describe the key methods (readers will get detail in the Methods section)
- Emphasize methodological strengths and rigor

### 5. Expected Impact (1 paragraph)
- Quantify expected outcomes where possible
- Connect impacts to funder priorities
- Mention broader impacts (societal, economic, academic)

### 6. Team & Feasibility (1-2 sentences)
- Briefly establish credibility of the team
- Note key resources or partnerships

### 7. Closing Statement (1-2 sentences)
- Reinforce the transformative potential
- Create forward momentum toward the full proposal

## WRITING GUIDELINES
- Write in active voice, present tense where possible
- Every sentence must earn its place — no filler
- Use concrete, specific language over abstract generalities
- Mirror the funder's terminology and priorities from Grant Intelligence
- The executive summary sets the narrative arc — every claim made here MUST be supported in later sections
- Mark any claims that need supporting evidence with [CITATION NEEDED]
- Mark any details you could not infer from the data with [USER INPUT NEEDED: description]

## WORD LIMIT
**CRITICAL:** The summary MUST be under {{wordLimit}} words. Count carefully. If the limit is tight, prioritize the hook, gap, solution, and impact sections.

## OUTPUT FORMAT
Output the executive summary as a polished markdown document titled "# Executive Summary" with the subsections flowing naturally as prose (not numbered sections). Include a word count at the end.

{{#if grantScheme}}
## MYGRANTS SUBMISSION TIP
This executive summary maps to the "Abstract" field in MyGRANTS (typically 300–500 words, verify exact limit). Make sure your first paragraph explicitly highlights the Scientific Knowledge Gap and promises a new theoretical/methodological contribution. Do not let reviewers think this is applied research.
{{/if}}`,
};
