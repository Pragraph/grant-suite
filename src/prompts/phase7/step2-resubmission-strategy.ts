import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase7.step2-resubmission-strategy",
  phase: 7,
  step: 2,
  name: "Resubmission Strategy",
  description:
    "Develop a detailed resubmission strategy addressing all reviewer concerns for the same funder.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "Feedback_Analysis.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Resubmission_Strategy.md",
  epTags: ["EP-03", "EP-04", "EP-07", "EP-09", "EP-10"],
  estimatedWords: 3000,
  template: `You are a grant resubmission strategist. Your task is to develop a comprehensive strategy for resubmitting the proposal to the same funder, addressing all reviewer concerns.

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

{{#if grantScheme}}
## MOHE RESUBMISSION NORMS
For MOHE grant resubmissions:
- MyGRANTS allows resubmission in subsequent cycles (typically biannual)
- Address EVERY reviewer comment — even minor ones
- Strengthen the patent search report if novelty was questioned
- Update the researcher profile if new publications have appeared since last submission
- If the research direction has evolved, clearly articulate what changed and why
- Consider changing the research title slightly to signal substantive revision to reviewers
- Resubmission success rates for FRGS are typically higher than first-submission rates
{{/if}}

## INSTRUCTIONS

Produce a resubmission strategy with this EXACT structure:

### RESUBMISSION OVERVIEW

- **Recommended approach:** [Major revision / Minor revision / Reframe and resubmit]
- **Target deadline:** [Based on typical funder timelines]
- **Key narrative shift:** [How the proposal's story should change]

---

### RESPONSE STRATEGY BY REVIEWER CONCERN

For each weakness/required change from the feedback analysis:

#### Concern 1: [Concern title]
- **Reviewer said:** "[summary]"
- **Our response approach:** [How to address this]
- **Specific changes:** [What sections to modify and how]
- **New evidence needed:** [Any new data, references, or pilot work]
- **Estimated effort:** [Low / Medium / High]

#### Concern 2: [Concern title]
...continue for all concerns

---

### STRUCTURAL CHANGES

List any structural modifications to the proposal:

1. [Change description] — [Rationale]
2. ...

---

### NEW CONTENT NEEDED

List any entirely new content that must be created:

1. [New section/content] — [Why needed] — [Approximate length]
2. ...

---

### EVIDENCE GATHERING PLAN

If new evidence is needed before resubmission:

1. [Evidence type] — [How to obtain] — [Timeline]
2. ...

---

### RESPONSE TO REVIEWERS OUTLINE

Draft a high-level outline for the response letter:

1. **Opening:** [Thank reviewers, acknowledge feedback]
2. **For each major concern:** [Brief approach to response]
3. **Closing:** [Summary of improvements]

---

### TIMELINE

| Week | Action | Deliverable |
|------|--------|-------------|
| 1 | [Action] | [Deliverable] |
| 2 | [Action] | [Deliverable] |
| ... | ... | ... |

---

### RISK ASSESSMENT

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| [Risk] | Low/Med/High | [Mitigation] |
| ... | ... | ... |`,
};
