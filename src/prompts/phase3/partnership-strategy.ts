import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step10-partnership-strategy",
  phase: 3,
  step: 10,
  name: "Partnership Strategy",
  description:
    "Develop a strategic partnership and collaboration plan that strengthens your proposal through institutional and individual partnerships.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "country",
    "careerStage",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
  ],
  outputName: "Partnership_Plan.md",
  epTags: ["EP-02", "EP-06"],
  estimatedWords: 2500,
  template: `You are a research collaboration strategist. Your task is to develop a comprehensive partnership plan that demonstrates the collaborative strength and institutional support behind this grant proposal.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}

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

Produce a Partnership Plan covering:

---

### 1. Partnership Needs Assessment (EP-02)
- **Capability gaps** — What expertise, resources, or access does this project need that the PI cannot provide alone?
- **Strategic value** — How do partnerships strengthen the proposal beyond filling gaps?
- **Funder expectations** — What collaboration requirements does this grant program have?

### 2. Recommended Partner Profiles
For each recommended partnership type, provide:
| Partner Type | Role in Project | Key Expertise Needed | Ideal Profile | Justification |
|-------------|----------------|---------------------|--------------|---------------|

Include:
- Academic collaborators (co-PIs, consultants)
- Industry partners (if applicable)
- Community/stakeholder partners
- International collaborators
- Technical/infrastructure partners

### 3. Partnership Structure (EP-06)
- **Governance model** — Decision-making, communication, and conflict resolution
- **Role distribution** — Clear delineation of responsibilities
- **IP and data sharing** — Agreements needed
- **Budget allocation** — How resources flow between partners
- **Communication plan** — Meeting cadence, reporting, shared tools

### 4. Support Letter Strategy
For each partner, outline:
- **Key points** the letter should emphasize
- **Specific commitments** to mention (in-kind, co-funding, access, mentorship)
- **Language alignment** — How the letter should echo proposal narrative
- **Credibility markers** — What makes this partner's endorsement powerful

### 5. Partnership Timeline
| Phase | Partnership Activities | Milestones |
|-------|----------------------|------------|

### 6. Risk & Contingency
- What if a key partner withdraws?
- How to handle disagreements?
- Backup partner options

---

## OUTPUT FORMAT
Structure as "# Partnership & Collaboration Plan". Begin with a 100-word summary of partnership strategy. Use tables and clear headings. Flag items needing researcher input with [USER INPUT NEEDED].`,
};
