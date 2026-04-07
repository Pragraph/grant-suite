import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step7-supporting-documents",
  phase: 5,
  step: 7,
  name: "Supporting Documents Generator",
  description:
    "Generate all selected supporting documents (data management plan, ethics statement, dissemination plan, risk management, timeline, etc.) in a single output.",
  requiredInputs: ["discipline", "grantName", "country", "selectedDocuments"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "customDocumentTypes",
    "Proposal_Data.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Supporting_Documents.md",
  epTags: ["EP-05", "EP-06", "EP-08", "EP-09", "EP-10"],
  estimatedWords: 4000,
  template: `You are an expert academic proposal writer specializing in supporting documents for grant applications. Your task is to generate ALL of the following supporting documents in a single, comprehensive output.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

## DOCUMENTS REQUESTED
{{selectedDocuments}}

{{#if customDocumentTypes}}
## ADDITIONAL CUSTOM DOCUMENTS REQUESTED
{{customDocumentTypes}}
{{/if}}

## PROPOSAL DATA
{{> Proposal_Data.md}}

---

## INSTRUCTIONS

Generate EACH of the requested supporting documents below. Each document should be self-contained but consistent with the proposal data. Use the section headers exactly as shown.

---

### DATA MANAGEMENT PLAN (DMP)
*Generate this section only if requested above.*

Write a data management plan covering:
1. **Data Description** — Types of data to be collected/generated, formats, and estimated volumes
2. **Data Collection & Processing** — Methods of collection, quality assurance procedures
3. **Storage & Security** — Where data will be stored during the project, backup procedures, access controls
4. **Data Sharing & Access** — What data will be shared, when, through which repositories, under what license
5. **Preservation & Long-Term Access** — How data will be preserved beyond the project, retention period
6. **Ethical & Legal Compliance** — GDPR/data protection considerations, consent procedures, anonymization
7. **Responsibilities & Resources** — Who manages data, what resources are allocated for data management

Mark repository names, storage costs, or institutional policies as [USER INPUT NEEDED: specific detail].

---

### ETHICS STATEMENT
*Generate this section only if requested above.*

Write an ethics statement covering:
1. **Ethical Considerations** — Key ethical issues raised by the research
2. **Human Participants** — Recruitment, consent, data protection, vulnerable populations (if applicable)
3. **Animal Research** — Welfare, 3Rs principles, licensing (if applicable)
4. **Environmental Impact** — Environmental considerations of the research activities
5. **Dual Use & Misuse** — Potential for misuse of findings and mitigation measures
6. **Ethics Approval** — Status of ethics review (mark as [USER INPUT NEEDED: ethics approval status])
7. **Ongoing Ethics Monitoring** — How ethical compliance will be maintained throughout

---

### DISSEMINATION & IMPACT PLAN
*Generate this section only if requested above.*

Write a dissemination and impact plan covering:
1. **Target Audiences** — Academic, industry, policy, public audiences
2. **Academic Dissemination** — Publications strategy (journals, conferences, preprints)
3. **Non-Academic Dissemination** — Policy briefs, media engagement, public lectures, social media
4. **Stakeholder Engagement** — How stakeholders will be involved throughout (not just at the end)
5. **Knowledge Exchange Activities** — Workshops, training, toolkits, guidelines
6. **Timeline** — When each dissemination activity will occur relative to project milestones
7. **Open Access Strategy** — Approach to open access publication and open data/code
8. **Metrics** — How dissemination success will be measured

---

### RISK MANAGEMENT PLAN
*Generate this section only if requested above.*

Write a risk management plan as a structured table plus narrative:

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| [Risk 1] | Low/Medium/High | Low/Medium/High | [Strategy] |

Cover these risk categories:
1. **Technical/Scientific Risks** — Methodology failures, data quality issues, negative results
2. **Personnel Risks** — Staff turnover, recruitment delays, skill gaps
3. **Resource Risks** — Equipment failures, supply chain issues, budget overruns
4. **External Risks** — Regulatory changes, partner withdrawal, pandemic/force majeure
5. **Timeline Risks** — Delays in ethics approval, data collection, publication

For each risk, provide a concrete mitigation strategy and contingency plan.

---

### GANTT CHART / TIMELINE
*Generate this section only if requested above.*

Create a text-based Gantt chart showing:
1. All work packages / major activities from the methods
2. Duration of each activity (in months)
3. Key milestones and deliverables
4. Dependencies between activities
5. Personnel allocation per activity

Format as a markdown table:

| Activity | M1-3 | M4-6 | M7-9 | M10-12 | M13-18 | M19-24 | ... |
|----------|------|------|------|--------|--------|--------|-----|
| WP1: ... | ████ | ████ |      |        |        |        |     |

Adjust the timeline columns to match the project duration from the proposal data. Mark unknown durations as [USER INPUT NEEDED: duration for activity X].

---

### LETTERS OF SUPPORT
*Generate this section only if requested above.*

Note: Actual letters were generated in Phase 3A/4. This section provides:
1. **Summary Table** of all letters of support needed
2. **Status Checklist** — mark each as [USER INPUT NEEDED: letter status from Partner X]
3. **Template Reminder** — reference that letter templates are available from Phase 3A

---

{{#if customDocumentTypes}}
### CUSTOM DOCUMENTS
For each custom document type listed above, generate a professional draft following the conventions of the field and grant requirements. Structure each with clear subsections and mark any information gaps with [USER INPUT NEEDED].
{{/if}}

## WRITING GUIDELINES
- Each document should be self-contained and professionally formatted
- Use language and conventions appropriate to the country and funder
- Reference the proposal data for consistency (methods, timeline, budget, team)
- Mark ALL gaps with [USER INPUT NEEDED: specific detail needed]
- Use [CITATION NEEDED] where evidence or references would strengthen the document
- Keep each document concise — funders value clarity over length

## OUTPUT FORMAT
Output as a single markdown document titled "# Supporting Documents" with each document as a major section (## heading). Include a table of contents at the top listing all generated documents.`,
};
