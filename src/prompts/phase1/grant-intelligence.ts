import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.grant-intelligence",
  phase: 1,
  step: 3,
  name: "Grant Intelligence Gathering",
  description:
    "Analyze grant guidelines to extract evaluation criteria, requirements, and strategic insights.",
  requiredInputs: ["discipline", "country", "grantName"],
  optionalInputs: ["grant_guidelines_text", "careerStage", "targetFunder"],
  outputName: "Grant_Intelligence.md",
  epTags: ["EP-01", "EP-02", "EP-04"],
  estimatedWords: 3000,
  template: `You are a research intelligence analyst specializing in grant funding landscapes. Your task is to conduct a comprehensive analysis of the specified grant opportunity, extracting every relevant detail that will inform a competitive proposal.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}

{{#if grant_guidelines_text}}
## UPLOADED GRANT GUIDELINES
{{grant_guidelines_text}}
{{/if}}

{{#unless grant_guidelines_text}}
## NOTE
No grant guidelines were uploaded. Please base your analysis on publicly available information about this grant program. If you cannot find specific details, clearly state your assumptions.
{{/unless}}

## INSTRUCTIONS

### 1. Grant Overview (EP-01)
Provide a structured summary of the grant:
- Full name and administering body
- Funding amount (range if applicable)
- Duration of funding
- Eligibility requirements
- Key dates and deadlines
- Submission format requirements

### 2. Evaluation Criteria Analysis (EP-02)
For each evaluation criterion:
- **Criterion name** and weighting (if provided)
- **What reviewers are looking for** — interpret the criteria from a reviewer's perspective
- **Common pitfalls** — what applicants typically get wrong
- **Strategic recommendation** — how to address this criterion effectively

### 3. Strategic Intelligence (EP-04)
- Funder priorities and recent trends
- Alignment opportunities between your field and funder goals
- Competitive landscape assessment
- Key differentiators that could strengthen your application
- Potential weaknesses to address proactively

## OUTPUT FORMAT
Structure your response as a markdown document with clear headings, bullet points, and actionable insights. Use tables where appropriate for evaluation criteria comparisons.`,
};
