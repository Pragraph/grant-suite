import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step12-sdg-alignment",
  phase: 3,
  step: 12,
  name: "SDG Alignment Analysis",
  description:
    "Map your research to UN Sustainable Development Goals to strengthen impact narrative and funder alignment.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "country",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
  ],
  outputName: "SDG_Alignment.md",
  epTags: ["EP-02", "EP-04"],
  estimatedWords: 2000,
  template: `You are a sustainable development and research impact specialist. Your task is to map a research project to the UN Sustainable Development Goals (SDGs), identifying direct and indirect contributions that strengthen the proposal's impact narrative.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if country}}- **Country:** {{country}}{{/if}}

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

Produce an SDG Alignment Analysis covering:

---

### 1. Primary SDG Alignment (EP-02)
Identify the 2-3 SDGs most directly aligned with this research:
| SDG | Goal Name | Specific Targets | How This Research Contributes | Evidence/Indicators |
|-----|-----------|-----------------|------------------------------|-------------------|

### 2. Secondary SDG Connections
Identify 2-4 additional SDGs with indirect contributions:
| SDG | Connection Type | Contribution Pathway | Strength |
|-----|----------------|---------------------|---------|

### 3. SDG Indicator Mapping (EP-04)
For each primary SDG, map specific indicators this research can influence:
| SDG Target | Official Indicator | Research Output | Measurement Approach |
|-----------|-------------------|----------------|---------------------|

### 4. Impact Pathways
For each primary SDG:
- **Theory of change** — Research activity → Output → Outcome → SDG impact
- **Timeline** — When impact is expected (short/medium/long term)
- **Scale** — Local, national, regional, or global impact potential
- **Stakeholders** — Who benefits and how

### 5. Funder-Specific SDG Framing
- How this funder values SDG alignment
- Recommended language and framing for the proposal
- Which SDGs to emphasize vs. mention briefly
- Integration with other impact metrics the funder tracks

### 6. SDG Integration in Proposal Narrative
Provide specific text suggestions for weaving SDG alignment into:
- Abstract / Executive Summary
- Impact Statement
- Dissemination Plan
- Budget Justification (capacity building, partnerships)

---

## OUTPUT FORMAT
Structure as "# SDG Alignment Analysis". Include SDG icons/numbers for visual reference. Begin with a summary paragraph. Flag assumptions with [VERIFY].`,
};
