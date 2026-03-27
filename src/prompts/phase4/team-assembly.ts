import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase4.step1-team-assembly",
  phase: 4,
  step: 1,
  name: "Team Assembly Strategy",
  description:
    "Generate a comprehensive team composition strategy including roles, responsibilities, effort allocation, and collaboration structure aligned with the research design and grant requirements.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "country",
    "careerStage",
    "targetFunder",
    "Research_Design.md",
    "Proposal_Blueprint.md",
    "Grant_Intelligence.md",
  ],
  outputName: "Team_Strategy.md",
  epTags: ["EP-04", "EP-06"],
  estimatedWords: 3000,
  template: `You are a research team composition expert who designs optimal team structures for funded research projects. Your task is to create a comprehensive team assembly strategy that demonstrates the right expertise mix, clear role delineation, and strong collaboration potential to evaluators.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}

{{#if Research_Design.md}}
## RESEARCH DESIGN (from Phase 3)
{{> Research_Design.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT (from Phase 2)
{{> Proposal_Blueprint.md}}
{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

## INSTRUCTIONS

Produce a comprehensive Team Assembly Strategy covering these sections:

---

### 1. Team Composition Overview (EP-04)
- **Team size rationale** — Justify the number of team members based on project scope and budget
- **Expertise mapping** — Map required expertise areas to the research design phases
- **Skill gap analysis** — Identify any expertise gaps and how they will be filled
- **Team structure** — Hierarchical or flat, decision-making processes, reporting lines

### 2. Role Matrix
Create a detailed table of all team roles:

| Role | Name | Institution | Responsibility | Effort % | Career Stage | Justification |
|------|------|-------------|---------------|----------|-------------|--------------|
| Principal Investigator | [USER INPUT NEEDED] | [USER INPUT NEEDED] | Overall project leadership, research vision | 30% | Senior | ... |
| Co-Investigator | [USER INPUT NEEDED] | [USER INPUT NEEDED] | ... | 20% | ... | ... |
| Postdoctoral Researcher | [USER INPUT NEEDED] | [USER INPUT NEEDED] | ... | 100% | ... | ... |
| Research Assistant | [USER INPUT NEEDED] | [USER INPUT NEEDED] | ... | 100% | ... | ... |

Include at minimum:
- Principal Investigator
- Co-Investigators (if applicable)
- Postdoctoral researchers
- Graduate/PhD students
- Research assistants
- Technical staff
- External advisors/consultants

### 3. Collaboration Framework (EP-06)
- **Internal collaboration** — How team members will work together, meeting cadence, communication tools
- **External partnerships** — Industry, government, or community partners and their roles
- **International collaboration** — If applicable, cross-border coordination mechanisms
- **Mentoring structure** — How senior team members will mentor junior researchers

### 4. Capacity Building Plan
- **Training needs** — Skills development for team members
- **Knowledge transfer** — How expertise will be shared across the team
- **Career development** — How the project supports early-career researcher development

### 5. Letters of Support Required
List all letters of support needed:
- From each team member confirming their commitment
- From partner institutions
- From advisory board members
- From any external stakeholders

### 6. Risk Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| Key person leaves | High | Cross-training, documented procedures |
| Partner withdrawal | Medium | Backup partnerships, modular work packages |

---

## OUTPUT FORMAT
Structure your response as a markdown document titled "# Team Assembly Strategy: [Project Title]". The Role Matrix MUST be a markdown table. Flag items needing researcher input with [USER INPUT NEEDED]. Mark name/institution fields clearly for the user to fill in their actual team members.

**CRITICAL:** The team composition must align with the research design phases and methodology. Each role must be justified by specific project needs. Demonstrate to evaluators that the team has the right mix of expertise and capacity.`,
};
