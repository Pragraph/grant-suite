import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step8-assembly-polish",
  phase: 5,
  step: 8,
  name: "Proposal Polish",
  description:
    "Review the fully assembled proposal for consistency, flow, cross-references, and narrative coherence. Suggest improvements without changing the core content.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "assembledProposal",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Complete_Proposal.md",
  epTags: ["EP-01", "EP-02", "EP-03", "EP-04", "EP-05", "EP-06", "EP-07", "EP-08", "EP-09", "EP-10"],
  estimatedWords: 8000,
  template: `You are an expert academic proposal editor and reviewer. You have been given a FULLY ASSEMBLED grant proposal. Your task is to polish it for consistency, flow, and narrative coherence WITHOUT changing the core content or research design.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

## ASSEMBLED PROPOSAL
{{assembledProposal}}

---

{{#if grantScheme}}
## MYGRANTS COMPLIANCE CHECKLIST
Before finalising, verify the assembled proposal against MyGRANTS requirements:
- [ ] All required MyGRANTS form fields are addressable from proposal content
- [ ] Abstract within character limit
- [ ] Budget follows MOHE Vote structure
- [ ] Gantt chart data is ready for MyGRANTS timeline format
- [ ] All [CITATION NEEDED] placeholders resolved
- [ ] Turnitin similarity report prepared (target <20%)
- [ ] Simplified Patent Search Report included (if FRGS/PRGS)
- [ ] Letters of support attached (if applicable)
- [ ] Researcher profiles in MyGRANTS are up-to-date
- [ ] KPI targets are realistic and formatted per MyGRANTS fields
- [ ] (GET only) Industry collaboration evidence attached (LOI/MoU/MoA with specific commitments)
- [ ] (GET only) Patent search report from lens.org attached (keywords consistent with title)
- [ ] (GET only) ROV projection completed and attached
- [ ] (GET only) Risk assessment plan included with estimated risk levels
- [ ] (GET only) Target TRL declared (1, 2, or 3)
- [ ] (GET only) Mentor details provided (if Associate Professor or below)
- [ ] (GET only) Video impact plan noted for final deliverables
- [ ] (GET only) Beneficiaries identified with impact indicators
{{/if}}

## INSTRUCTIONS

Review and polish the entire proposal. Your output should be the COMPLETE polished proposal (not just suggestions). Make the following improvements:

### 1. Narrative Coherence
- Ensure the executive summary's promises are delivered in later sections
- Check that the background justifies every method
- Verify that impact claims trace to specific methods
- Ensure budget items connect to described activities
- Fix any contradictions between sections

### 2. Cross-References
- Add forward and backward references between sections where they strengthen the narrative
- Ensure terminology is consistent throughout (same terms for same concepts)
- Check that acronyms are defined on first use and used consistently

### 3. Flow & Transitions
- Improve transitions between sections so the proposal reads as one coherent document
- Ensure each section begins by connecting to the previous one
- Remove redundant content that appears in multiple sections

### 4. Language & Tone
- Ensure consistent academic register throughout
- Fix any grammatical or stylistic inconsistencies
- Strengthen weak claims with more precise language
- Ensure active voice is used where appropriate

### 5. Funder Alignment
- Check that the proposal addresses the funder's stated priorities
- Ensure evaluation criteria are visibly addressed
- Verify that the proposal meets any stated formatting requirements

### 6. Flag Remaining Issues
- Preserve ALL existing [CITATION NEEDED] and [USER INPUT NEEDED] markers
- Add new markers if you discover additional gaps
- Note any structural issues that require the user's decision

## CRITICAL RULES
- Output the COMPLETE polished proposal, not just a list of changes
- Do NOT alter the research design, methods, or core claims
- Do NOT remove sections or significantly restructure the document
- Do NOT fabricate data, statistics, or references
- PRESERVE all [CITATION NEEDED] and [USER INPUT NEEDED] markers
- Keep section headings and overall structure intact

## OUTPUT FORMAT
Output the complete polished proposal as a markdown document. At the very end, add a section titled "## Polish Summary" listing:
1. Number of changes made (categorized: coherence, cross-references, flow, language, funder alignment)
2. Remaining [CITATION NEEDED] count
3. Remaining [USER INPUT NEEDED] count
4. Any structural issues flagged for user attention
5. Overall word count`,
};
