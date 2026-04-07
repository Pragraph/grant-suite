import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase6.step3-compliance",
  phase: 6,
  step: 3,
  name: "Compliance & Completeness Check",
  description:
    "Verify proposal compliance with funder requirements and completeness against evaluation criteria.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "Complete_Proposal.md",
    "Grant_Intelligence.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Compliance_Report.md",
  epTags: ["EP-07", "EP-08", "EP-11"],
  estimatedWords: 3000,
  template: `You are a grant compliance specialist. Your task is to verify that the proposal below meets all funder requirements and fully addresses evaluation criteria.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

---

## COMPLETE PROPOSAL
{{> Complete_Proposal.md}}

{{#if Grant_Intelligence.md}}
---
## GRANT INTELLIGENCE (funder requirements & evaluation criteria)
{{> Grant_Intelligence.md}}
{{/if}}

---

{{#if grantScheme}}
## MYGRANTS COMPLIANCE VERIFICATION
For MOHE grants, verify:
- All MyGRANTS-required sections are present and within word/character limits
- Budget uses correct MOHE Vote categories
- Turnitin similarity index target (<20%) is achievable
- Patent search report is present (FRGS/PRGS)
- KPI table matches MyGRANTS format (Year 1/2/3 + Cumulative)
- Researcher profile completeness (H-index, publications, prior grants)
- All co-researchers listed with correct institutions and roles
- Gantt chart covers the full grant duration with milestones
- Ethics approval plan is stated (even if approval is pending at submission)
{{/if}}

## INSTRUCTIONS

Produce a compliance and completeness report with this EXACT structure:

### COMPLIANCE CHECKLIST

Check each requirement and mark as PASS or FAIL:

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Word/page limit compliance | PASS / FAIL | [details] |
| 2 | Required sections present | PASS / FAIL | [details] |
| 3 | Budget within allowed range | PASS / FAIL | [details] |
| 4 | Timeline within funding period | PASS / FAIL | [details] |
| 5 | Eligibility criteria met | PASS / FAIL | [details] |
| 6 | Ethics/IRB considerations addressed | PASS / FAIL | [details] |
| 7 | Data management plan included | PASS / FAIL | [details] |
| 8 | Dissemination plan included | PASS / FAIL | [details] |
| 9 | Team qualifications documented | PASS / FAIL | [details] |
| 10 | References/citations formatted | PASS / FAIL | [details] |
| ... | [Add any funder-specific requirements from Grant Intelligence] | ... | ... |

**Overall Compliance: X/Y requirements met**

---

### EVALUATION CRITERIA COVERAGE MATRIX

Map each evaluation criterion (from Grant Intelligence or standard grant criteria) to where it is addressed in the proposal:

| Criterion | Weight (if known) | Proposal Section(s) | Coverage | Score Estimate |
|-----------|-------------------|---------------------|----------|---------------|
| [Criterion 1] | [X%] | [Section names] | Full / Partial / Missing | [X/10] |
| [Criterion 2] | [X%] | [Section names] | Full / Partial / Missing | [X/10] |
| ... | ... | ... | ... | ... |

**Coverage Summary:** X criteria fully covered, Y partially covered, Z missing

---

### MISSING ITEMS

List ALL items that are missing or incomplete:

1. **[CRITICAL]** [Missing item] — Required by [source]. Must be added before submission.
2. **[MAJOR]** [Incomplete item] — [details on what's missing]
3. **[MINOR]** [Optional improvement] — [details]

---

### FORMATTING & PRESENTATION ISSUES

List any formatting, structure, or presentation issues:

1. [Issue description] — [location] — [suggested fix]

---

### RECOMMENDATIONS

Provide a prioritized list of actions to achieve full compliance:

1. **[HIGH]** [Action item]
2. **[HIGH]** [Action item]
3. **[MEDIUM]** [Action item]
4. **[LOW]** [Action item]

Be strict — flag EVERYTHING that could cause an administrative rejection or lose points on evaluation criteria.`,
};
