import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase7.step1-feedback-analysis",
  phase: 7,
  step: 1,
  name: "Reviewer Feedback Analysis",
  description:
    "Decompose and categorize reviewer feedback into actionable insights for resubmission planning.",
  requiredInputs: ["discipline", "grantName", "country", "reviewerFeedback"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "Complete_Proposal.md",
    "Final_Proposal.md",
    "grantScheme",
  ],
  outputName: "Feedback_Analysis.md",
  epTags: ["EP-03", "EP-07", "EP-09"],
  estimatedWords: 3000,
  template: `You are an expert at analyzing grant reviewer feedback and extracting actionable insights. Your task is to decompose the reviewer comments below into categorized, prioritized findings.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

---

## REVIEWER FEEDBACK
{{reviewerFeedback}}

---

{{#if Final_Proposal.md}}
## SUBMITTED PROPOSAL
{{> Final_Proposal.md}}
{{/if}}

{{#if Complete_Proposal.md}}
{{#unless Final_Proposal.md}}
## SUBMITTED PROPOSAL
{{> Complete_Proposal.md}}
{{/unless}}
{{/if}}

---

{{#if grantScheme}}
## MOHE FEEDBACK CONTEXT
MOHE grants typically provide reviewer comments through MyGRANTS. Key considerations:
- Comments may be in English or Malay — analyse both languages
- MOHE reviewers sometimes provide scores without detailed comments — infer issues from low scores
- Common MOHE rejection reasons: insufficient novelty evidence, weak methodology, unrealistic KPIs, poor national alignment, PI track record concerns
- Resubmission to the same scheme in the next cycle is common and often successful if reviewer feedback is substantively addressed
{{/if}}

## INSTRUCTIONS

Analyze the reviewer feedback and produce a structured report with this EXACT format:

### FEEDBACK SUMMARY

Brief overview of the overall tone and outcome of the review (2-3 sentences).

---

### STRENGTHS IDENTIFIED

List all positive points raised by reviewers:

1. **[Strength]** — [Reviewer who mentioned it] — [Relevant proposal section]
2. ...

---

### WEAKNESSES IDENTIFIED

List all criticisms, ranked by severity:

1. **[CRITICAL]** [Weakness] — [Reviewer] — [Proposal section affected]
   - *Reviewer's exact words:* "[quote]"
   - *Implication:* [What this means for resubmission]

2. **[MAJOR]** [Weakness] — [Reviewer] — [Proposal section affected]
   - *Reviewer's exact words:* "[quote]"
   - *Implication:* [What this means for resubmission]

3. **[MINOR]** [Weakness] — [Reviewer] — [Proposal section affected]
   - *Reviewer's exact words:* "[quote]"
   - *Implication:* [What this means for resubmission]

---

### REQUIRED CHANGES

Changes that reviewers explicitly require or strongly recommend:

1. [Required change] — [Source reviewer] — [Effort: Low/Medium/High]
2. ...

---

### SUGGESTIONS

Optional improvements that reviewers suggest:

1. [Suggestion] — [Source reviewer] — [Potential impact: Low/Medium/High]
2. ...

---

### CONSENSUS vs. OUTLIER ANALYSIS

- **Points ALL reviewers agree on:** [list]
- **Points only one reviewer raised:** [list — these may be personal preferences rather than consensus issues]
- **Contradictory feedback:** [list any cases where reviewers disagree — note which position is stronger]

---

### PRIORITY MATRIX

| Priority | Change | Effort | Impact | Section |
|----------|--------|--------|--------|---------|
| 1 | [Highest priority change] | Low/Med/High | High | [Section] |
| 2 | ... | ... | ... | ... |
| ... | ... | ... | ... | ... |

---

### RESUBMISSION FEASIBILITY

- **Estimated effort:** [Low / Medium / High / Complete rewrite needed]
- **Key decision:** [Should you resubmit to same funder or pivot to a different one?]
- **Critical path:** [The 3 most important changes to make]`,
};
