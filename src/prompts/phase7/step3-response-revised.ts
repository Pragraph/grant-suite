import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase7.step3-response-revised",
  phase: 7,
  step: 3,
  name: "Response to Reviewers & Revised Proposal",
  description:
    "Generate a point-by-point response to reviewers and produce the revised proposal with tracked changes.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "Feedback_Analysis.md",
    "Resubmission_Strategy.md",
    "Complete_Proposal.md",
    "Final_Proposal.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Revised_Proposal.md",
  epTags: [
    "EP-01", "EP-02", "EP-03", "EP-04", "EP-05", "EP-06", "EP-07", "EP-08",
    "EP-09", "EP-10", "EP-11", "EP-12", "EP-13", "EP-14", "EP-15", "EP-16",
  ],
  estimatedWords: 10000,
  template: `You are an expert at grant resubmission. Your task is to produce TWO outputs: (1) a formal point-by-point response to reviewers, and (2) the revised proposal incorporating all changes.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

---

## FEEDBACK ANALYSIS
{{> Feedback_Analysis.md}}

---

## RESUBMISSION STRATEGY
{{> Resubmission_Strategy.md}}

---

{{#if Final_Proposal.md}}
## ORIGINAL SUBMITTED PROPOSAL
{{> Final_Proposal.md}}
{{/if}}

{{#if Complete_Proposal.md}}
{{#unless Final_Proposal.md}}
## ORIGINAL SUBMITTED PROPOSAL
{{> Complete_Proposal.md}}
{{/unless}}
{{/if}}

---

## INSTRUCTIONS

Produce TWO clearly separated documents:

---

# PART 1: RESPONSE TO REVIEWERS

Use this EXACT format for each reviewer comment:

### Response to Reviewer [X]

**Comment [X.1]:** "[Reviewer's concern — quoted or paraphrased]"

**Response:** [Your response explaining how the concern was addressed]

**Change made:** [Specific change in the revised proposal, with section reference]

---

**Comment [X.2]:** "[Next concern]"

**Response:** [Response]

**Change made:** [Change description]

...continue for all reviewer comments

### Summary of Changes

Provide a table summarizing all modifications:

| # | Change | Section | Reviewer Concern Addressed |
|---|--------|---------|---------------------------|
| 1 | [Change] | [Section] | [Concern] |
| ... | ... | ... | ... |

---

# PART 2: REVISED PROPOSAL

Output the COMPLETE revised proposal. This should be a self-contained, submission-ready document.

### Rules:
- Incorporate ALL changes from the resubmission strategy
- Address ALL reviewer concerns
- Maintain coherent narrative flow
- Do NOT fabricate data, references, or credentials
- Mark new or substantially revised passages with **[REVISED]** at the start of the paragraph
- Mark any remaining gaps with [USER INPUT NEEDED: ...]
- Mark claims needing references with [CITATION NEEDED]
- Keep within word/page limits`,
};
