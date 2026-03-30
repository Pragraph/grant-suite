import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step5-impact",
  phase: 5,
  step: 5,
  name: "Impact Writer",
  description:
    "Draft the impact statement projecting outcomes, broader significance, and societal benefit grounded in the proposed methods.",
  requiredInputs: ["discipline", "grantName", "country", "wordLimit"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "Proposal_Data.md",
    "Executive_Summary_Draft.md",
    "Methods_Draft.md",
    "grantScheme",
  ],
  outputName: "Impact_Draft.md",
  epTags: ["EP-04", "EP-05", "EP-06", "EP-10"],
  estimatedWords: 2000,
  template: `You are an expert academic proposal writer specializing in impact and significance sections. Your task is to draft an impact statement that projects concrete outcomes from the proposed research, grounded in the specific methods described.

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

## EXECUTIVE SUMMARY (for narrative alignment)
{{> Executive_Summary_Draft.md}}

## METHODS (impact must be grounded in these)
{{> Methods_Draft.md}}

---

## INSTRUCTIONS

Write an impact section that directly projects from the methods already described. Every impact claim must trace back to a specific research activity.

### 1. Scientific / Academic Impact
- What new knowledge will this research produce?
- How will it advance the state of the art in the discipline?
- What methodological innovations could other researchers adopt?
- Expected publications, datasets, or tools to be produced
- Mark speculative claims with [CITATION NEEDED] for supporting evidence

### 2. Societal / Economic Impact
- How will the research benefit society, the economy, or public policy?
- Who are the specific beneficiaries (practitioners, policymakers, communities, industries)?
- What is the pathway from research outputs to real-world change?
- Include concrete, measurable outcomes where possible (e.g., "reduce X by Y%")
- Mark estimates without evidence as [USER INPUT NEEDED: data for impact estimate]

### 3. Impact Pathways & Knowledge Exchange
- Describe the specific mechanisms for translating research into impact
- Include stakeholder engagement, dissemination channels, and knowledge transfer activities
- Show how impact activities are integrated into the project timeline (referencing methods)
- Identify key partners or intermediaries who will amplify impact

### 4. Capacity Building & Training
- Describe how the project builds research capacity (PhD students, postdocs, collaborations)
- Highlight skills development and career development opportunities
- Show how the project strengthens the research ecosystem

### 5. Long-Term Legacy
- What will endure beyond the funding period?
- How will outputs be sustained, maintained, or built upon?
- What is the 5-10 year vision for the impact of this work?

## WRITING GUIDELINES
- Every impact claim MUST connect to a specific method or activity from the Methods section
- Use the "If we do X (method), then Y (outcome) because Z (evidence)" structure
- Be ambitious but credible — reviewers penalize both timidity and overreach
- Include quantitative indicators where possible (publications, users, policy changes)
- Align with the funder's stated impact priorities
- Mirror promises made in the Executive Summary — this section delivers the evidence for those promises
- Mark gaps with [USER INPUT NEEDED: description]
- Use [CITATION NEEDED] for claims that need supporting evidence

## WORD LIMIT
**CRITICAL:** The impact section MUST be under {{wordLimit}} words. Prioritize impact pathways and societal impact.

## OUTPUT FORMAT
Output as a markdown document titled "# Expected Impact & Significance" with clear subsections. At the end, include:
1. Word count
2. Impact-to-method traceability table (which impact maps to which method)
3. List of [CITATION NEEDED] placeholders
4. List of [USER INPUT NEEDED] items`,
};
