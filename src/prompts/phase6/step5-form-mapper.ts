import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase6.step5-form-mapper",
  phase: 6,
  step: 5,
  name: "Application Form Mapper",
  description:
    "Map your final proposal content to the actual grant application form fields, producing copy-ready text for each section.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "Final_Proposal.md",
    "Complete_Proposal.md",
    "Grant_Intelligence.md",
    "Budget_Draft.md",
    "KPI_Plan.md",
    "grantScheme",
  ],
  outputName: "Form_Ready_Proposal.md",
  epTags: [],
  estimatedWords: 6000,
  template: `You are a grant submission specialist. Your task is to take the final polished proposal and map its content to the specific form fields required by the grant application system. The output must be copy-ready — the researcher should be able to copy each field directly into the application form.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

## FINAL PROPOSAL
{{#if Final_Proposal.md}}
{{> Final_Proposal.md}}
{{/if}}
{{#unless Final_Proposal.md}}
{{#if Complete_Proposal.md}}
{{> Complete_Proposal.md}}
{{/if}}
{{/unless}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (form field requirements)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Budget_Draft.md}}
## BUDGET DATA
{{> Budget_Draft.md}}
{{/if}}

{{#if KPI_Plan.md}}
## KPI DATA
{{> KPI_Plan.md}}
{{/if}}

---

{{#if grantScheme}}
## MYGRANTS FORM FIELD MAPPING

For MOHE grants submitted via MyGRANTS, map proposal content to these standard form sections. Verify exact field names and character limits against the current MyGRANTS interface, as fields may change between cycles.

### Standard MyGRANTS Form Sections:

**Section A: Project Information**
- Project Title (max ~300 characters)
- Research Field / FRASCATI Code
- Keywords (typically 5-6)
- Start Date / End Date
- Abstract (typically 300-500 words)

**Section B: Research Proposal**
- Problem Statement
- Research Objectives (list format)
- Research Questions / Hypotheses
- Literature Review / Background
- Methodology
- Expected Findings / Results
- References

**Section C: Research Team**
- PI details (auto-filled from MyGRANTS profile)
- Co-researchers (names, institutions, roles, % effort)
- Postgraduate students involved

**Section D: Budget**
- Vote 11000: Emolumen
- Vote 21000: Perjalanan & Pengangkutan
- Vote 24000: Sewaan
- Vote 27000: Bekalan & Bahan-Bahan
- Vote 28000: Penyelenggaraan & Pembaikan
- Vote 29000: Perkhidmatan Iktisas & Lain Perbelanjaan
- Vote 35000: Harta Modal
- Budget justification per vote

**Section E: Milestones & KPIs**
- Milestone table (Year 1 / Year 2 / Year 3)
- KPI targets per year (publications, students, IP, community engagement)

**Section F: Gantt Chart**
- Activity / Month grid

**Section G: Attachments**
- Simplified Patent Search Report (FRGS/PRGS)
- Turnitin Similarity Report
- Letters of Support
- Other supporting documents

Map every section below to the MyGRANTS field it fills.
{{/if}}

## INSTRUCTIONS

Produce a field-by-field mapping document. For EACH form field:

1. **Field name** — the exact label from the application form
2. **Character/word limit** — from Grant Intelligence (or [VERIFY LIMIT] if unknown)
3. **Content** — the exact text to paste, extracted and adapted from the proposal
4. **Adaptation notes** — any changes made from the full proposal to fit the field (e.g., shortened, reformatted, split across fields)

### Output Structure:

---

## FIELD 1: Project Title
**Limit:** [X characters]
**Copy-ready content:**
\`\`\`
[Exact text to paste]
\`\`\`

---

## FIELD 2: Abstract / Executive Summary
**Limit:** [X words]
**Copy-ready content:**
\`\`\`
[Exact text to paste — trimmed to fit limit]
\`\`\`
**Word count:** [X words]

---

## FIELD 3: Problem Statement
**Limit:** [X words]
**Copy-ready content:**
\`\`\`
[Extracted from Background section, condensed]
\`\`\`

---

[Continue for ALL form fields...]

---

## BUDGET TABLE (formatted for form entry)

| Vote / Category | Year 1 ({{currency}}) | Year 2 | Year 3 | Total |
|----------------|----------------------|--------|--------|-------|
| [Category] | [Amount] | [Amount] | [Amount] | [Amount] |

---

## KPI TABLE (formatted for form entry)

| KPI | Year 1 Target | Year 2 Target | Year 3 Target | Cumulative |
|-----|--------------|--------------|--------------|------------|
| Scopus/WoS publications | [N] | [N] | [N] | [N] |
| Conference presentations | [N] | [N] | [N] | [N] |
| Postgraduates trained | [N] | [N] | [N] | [N] |
| IP / Patents | [N] | [N] | [N] | [N] |

---

## SUBMISSION CHECKLIST

- [ ] All form fields filled
- [ ] Within all character/word limits
- [ ] Budget totals match across sections
- [ ] KPI targets are consistent with proposal narrative
- [ ] All [USER INPUT NEEDED] markers resolved
- [ ] All [CITATION NEEDED] markers resolved with real references
- [ ] Turnitin report prepared (target <20%)
- [ ] Patent Search Report attached (if required)
- [ ] Letters of support attached
- [ ] Team profiles updated in application system
- [ ] Final proofread completed

Mark any fields where content could not be determined with [USER INPUT NEEDED: specific detail].

## IMPORTANT
- Never fabricate data, statistics, or references
- Respect all character and word limits strictly
- If a field limit is unknown, provide the full content AND a shortened version
- Flag inconsistencies between proposal sections with [INCONSISTENCY: description]`,
};
