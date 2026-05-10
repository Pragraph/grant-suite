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
    "grantSubCategory",
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

Produce two artefacts in this order.

### 1. Downloadable .docx letter

Use Code Interpreter (python-docx) to generate a Microsoft Word file the user can download from the chat. The file must read as a real, sign-ready letter:

- **Letterhead block** at the top: \`[LETTERHEAD — {{partnerInstitution}}]\` on its own line, then \`[Address line 1]\`, \`[Address line 2]\`, \`[Phone]\`, \`[Email]\` as bracketed placeholders the partner will fill.
- **Date line** below the letterhead: \`[DATE]\`.
- **Recipient block**: \`To: [Grant Program / Review Panel]\` and \`Re: Letter of Support for [Project Title]\`.
- **Salutation**: \`Dear Review Committee,\`.
- **Body** of approximately 400 to 500 words structured as: opening paragraph stating the partner's credentials and relationship to the principal investigator, second paragraph endorsing the research and explaining its timeliness, third paragraph naming specific contributions (personnel time, data access, in-kind value, facilities, mentorship, equipment, be concrete), fourth paragraph stating mutual benefit and alignment with the partner's institutional priorities, closing paragraph with strong forward-looking endorsement.
- **Sign-off block**: \`Sincerely,\` then a four-line signature gap, then \`{{partnerName}}\`, \`[Title]\`, \`{{partnerInstitution}}\`, \`[Contact information]\`.

Typography: Calibri or Times New Roman 11pt, single line spacing, paragraph spacing for body. Mark every section requiring partner customization with \`[PARTNER TO CUSTOMIZE]\`.

Save the file as \`Support_Letter_{{partnerName}}.docx\` (replace any spaces in the partner name with underscores) and confirm to the user the file is ready for download.

### 2. Email version (inline)

Directly below the .docx download, output an email-friendly plain-text version under a \`## Email version\` heading.

- **Subject line**: \`Subject: Letter of Support for [Project Title] — {{partnerName}} ({{partnerInstitution}})\`.
- **Body**: plain text, no markdown formatting (no asterisks for bold, no headers, no bullets), ready to paste into Gmail or Outlook. Same core content as the letter, condensed slightly for email register (shorter paragraphs, more direct phrasing). Preserve the specific contributions and endorsements verbatim. Mark partner-edit sections with \`[PARTNER TO CUSTOMIZE]\`.
- **End marker**: end the body with \`[End of email]\` so the user knows where the email body finishes.

**NOTE:** Both artefacts are drafts for the partner to review, customize, and sign. Do not invent the partner's exact title, real phone numbers, real signature, or real institutional letterhead artwork. Use bracketed placeholders for everything requiring the partner's input.`,
};
