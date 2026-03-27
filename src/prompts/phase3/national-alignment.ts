import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step13-national-alignment",
  phase: 3,
  step: 13,
  name: "National Agenda Alignment",
  description:
    "Align your research with national priorities, policies, and strategic agendas to demonstrate relevance and strengthen funder appeal.",
  requiredInputs: ["discipline", "country"],
  optionalInputs: [
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
  ],
  outputName: "National_Alignment.md",
  epTags: ["EP-02", "EP-04"],
  estimatedWords: 2000,
  template: `You are a research policy analyst who specializes in mapping research projects to national strategic priorities. Your task is to identify how this research aligns with the country's national agendas, policies, and strategic plans.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT (from Phase 2)
{{> Proposal_Blueprint.md}}
{{/if}}

{{#if Research_Design.md}}
## RESEARCH DESIGN (from Phase 3)
{{> Research_Design.md}}
{{/if}}

## INSTRUCTIONS

Produce a National Agenda Alignment Analysis covering:

---

### 1. Key National Policies & Strategies (EP-02)
Identify the most relevant national documents, policies, and strategic plans:
| Policy/Strategy | Issuing Body | Relevant Priority Area | How Research Aligns |
|----------------|-------------|----------------------|-------------------|

### 2. National Research Priority Areas
- Map the research to officially designated national research priority areas
- Identify specific calls, programs, or initiatives that this research supports
- Note any recent policy shifts or emerging priorities

### 3. Economic & Social Impact Alignment (EP-04)
- **Economic development** — How this research contributes to national economic goals
- **Social development** — Health, education, welfare, equity implications
- **Industry relevance** — Links to key national industries or sectors
- **Human capital** — Training, capacity building, workforce development

### 4. Institutional & Infrastructure Alignment
- Existing national infrastructure this research leverages
- National centers of excellence or networks to reference
- Government agencies that would benefit from outcomes

### 5. Proposal Integration Recommendations
Provide specific language and framing for:
- How to reference national priorities in the proposal abstract
- Key policy documents to cite
- Phrases and terminology that resonate with national funders
- How to position local impact within global context

### 6. Competitive Advantage
- How national alignment differentiates this proposal
- Specific evaluation criteria where national relevance scores points
- Evidence of government commitment to this research area

---

## OUTPUT FORMAT
Structure as "# National Agenda Alignment: {{country}}". Begin with a 100-word summary. Use tables and specific policy references. Flag items requiring verification with [VERIFY] — national policies change frequently.`,
};
