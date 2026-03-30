import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step10-partner-letter",
  phase: 3,
  step: 10,
  name: "Partner Support Letter Generator",
  description:
    "Generate a personalized support letter for a specific collaborator or partner institution.",
  requiredInputs: ["discipline", "partnerName", "partnerInstitution", "partnerRole"],
  optionalInputs: [
    "partnerExpertise",
    "specificCommitments",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
    "Partnership_Plan.md",
    "grantScheme",
  ],
  outputName: "Support_Letter.md",
  epTags: ["EP-02"],
  estimatedWords: 800,
  template: `You are an academic writing specialist who drafts compelling support letters for grant proposals. Your task is to create a personalized letter of support that strengthens the proposal while being authentic to the partner's voice.

## PARTNER DETAILS
- **Partner Name:** {{partnerName}}
- **Institution:** {{partnerInstitution}}
- **Role in Project:** {{partnerRole}}
{{#if partnerExpertise}}- **Expertise:** {{partnerExpertise}}{{/if}}
{{#if specificCommitments}}- **Specific Commitments:** {{specificCommitments}}{{/if}}

## PROJECT CONTEXT
- **Field/Discipline:** {{discipline}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT
{{> Proposal_Blueprint.md}}
{{/if}}

{{#if Research_Design.md}}
## RESEARCH DESIGN
{{> Research_Design.md}}
{{/if}}

{{#if Partnership_Plan.md}}
## PARTNERSHIP PLAN
{{> Partnership_Plan.md}}
{{/if}}

{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

## INSTRUCTIONS

Draft a support letter from {{partnerName}} at {{partnerInstitution}} that:

### Structure
1. **Opening** — Establish the partner's credentials and relationship to the project
2. **Endorsement of the research** — Why this research is important and timely
3. **Specific contributions** — What the partner will provide (be concrete):
   - Personnel time / effort commitment
   - Access to facilities, data, or networks
   - In-kind or financial contributions
   - Mentorship or advisory role
4. **Alignment** — How this collaboration benefits both parties (EP-02)
5. **Closing** — Strong endorsement with forward-looking commitment

### Guidelines
- Write in the **first person** from the partner's perspective
- Be **specific** about commitments (hours, resources, access)
- Reference the **project title and PI by name** where possible
- Include **institutional letterhead placeholders** [LETTERHEAD]
- Keep to **one page** (approximately 400-500 words for the letter body)
- Use formal but warm academic tone
- Avoid generic praise — be specific about why this partnership matters

---

## OUTPUT FORMAT
\`\`\`
[LETTERHEAD — {{partnerInstitution}}]

[DATE]

To: [Grant Program / Review Panel]
Re: Letter of Support for [Project Title]

Dear [Review Committee / Program Director],

[Letter body — 400-500 words]

Sincerely,

{{partnerName}}
[Title]
{{partnerInstitution}}
[Contact information placeholder]
\`\`\`

**NOTE:** This is a draft for the partner to review, customize, and sign. Mark sections requiring partner input with [PARTNER TO CUSTOMIZE].`,
};
