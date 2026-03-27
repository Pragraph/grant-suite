import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase6.step4-optimization",
  phase: 6,
  step: 4,
  name: "Final Optimization Pass",
  description:
    "Produce an optimized version of your proposal addressing all weaknesses identified in review, EP audit, and compliance reports.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "Complete_Proposal.md",
    "Mock_Review_Report.md",
    "EP_Audit_Report.md",
    "Compliance_Report.md",
  ],
  outputName: "Final_Proposal.md",
  epTags: [
    "EP-01", "EP-02", "EP-03", "EP-04", "EP-05", "EP-06", "EP-07", "EP-08",
    "EP-09", "EP-10", "EP-11", "EP-12", "EP-13", "EP-14", "EP-15", "EP-16",
  ],
  estimatedWords: 8000,
  template: `You are an expert grant proposal optimizer. Your task is to produce a FINAL, OPTIMIZED version of the proposal that addresses ALL weaknesses identified in the review reports below.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}

---

## ORIGINAL PROPOSAL
{{> Complete_Proposal.md}}

---

## MOCK REVIEW REPORT
{{> Mock_Review_Report.md}}

{{#if EP_Audit_Report.md}}
---
## EP AUDIT REPORT
{{> EP_Audit_Report.md}}
{{/if}}

{{#if Compliance_Report.md}}
---
## COMPLIANCE REPORT
{{> Compliance_Report.md}}
{{/if}}

---

## INSTRUCTIONS

Produce the COMPLETE optimized proposal (not just suggestions). This should be the final, submission-ready version.

### Optimization priorities:
1. **Address all CRITICAL and MAJOR weaknesses** from the mock review
2. **Close EP tag gaps** — deploy missing EP tags where natural
3. **Fix compliance issues** — ensure all requirements are met
4. **Strengthen loss framing** (EP-05) throughout
5. **Enhance champion phrases** — make the strongest sentences even more memorable
6. **Improve transitions** between sections for better narrative flow
7. **Ensure peak-end rule** (EP-12) — strong opening and closing

### Rules:
- Output the COMPLETE proposal, not a summary of changes
- Maintain the same overall structure and section order
- Do NOT fabricate data, references, or credentials
- Keep within any word/page limits
- Mark any remaining gaps with [USER INPUT NEEDED: ...]
- Mark claims needing references with [CITATION NEEDED]
- At the end, include a brief "## CHANGE LOG" section listing what was modified and why

### Output format:
Start with the optimized proposal text, then end with:

## CHANGE LOG

| Section | Change | Reason |
|---------|--------|--------|
| [Section] | [What changed] | [Which report finding it addresses] |
| ... | ... | ... |`,
};
