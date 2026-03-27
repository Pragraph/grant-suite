import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase4.step3-budget-justification",
  phase: 4,
  step: 3,
  name: "Budget Justification & Compliance",
  description:
    "Generate a persuasive budget justification narrative with compliance verification against funder guidelines, linking every budget line to specific research activities and outcomes.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "country",
    "targetFunder",
    "Team_Strategy.md",
    "Budget_Draft.md",
    "Grant_Intelligence.md",
  ],
  outputName: "Budget_Justification.md",
  epTags: ["EP-08", "EP-09", "EP-10"],
  estimatedWords: 3000,
  template: `You are a grant budget justification expert who writes compelling narratives that convince evaluators every dollar is necessary and well-planned. Your task is to create a detailed budget justification that defends each cost item and demonstrates compliance with funder requirements.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}

{{#if Team_Strategy.md}}
## TEAM STRATEGY (from Phase 4, Step 1)
{{> Team_Strategy.md}}
{{/if}}

{{#if Budget_Draft.md}}
## BUDGET DRAFT (from Phase 4, Step 2)
{{> Budget_Draft.md}}
{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

## INSTRUCTIONS

Produce a comprehensive Budget Justification & Compliance document:

---

### 1. Executive Budget Summary
- Total budget request with brief rationale
- Key cost drivers and why they are essential
- Value proposition — what the funder gets for this investment

### 2. Personnel Justification (EP-08)
For EACH team member:
- **Role and responsibilities** — Specific contributions to project objectives
- **Effort level justification** — Why this percentage/time commitment is needed
- **Salary basis** — Market rates, institutional salary scales, or funder benchmarks
- **Career development** — How the position contributes to capacity building

### 3. Equipment Justification
For EACH equipment item:
- **Necessity** — Why this equipment is required and cannot be shared/rented
- **Specifications** — Why these specific specifications are needed
- **Alternatives considered** — Why cheaper alternatives won't suffice
- **Shared use** — Whether the equipment will serve other projects (leverage argument)

### 4. Travel Justification
For EACH travel category:
- **Purpose** — Direct link to project objectives
- **Frequency and duration** — Why this many trips are needed
- **Cost basis** — Per diem rates, airfare estimates based on standard rates

### 5. Materials & Supplies Justification
- Link each item to specific research activities
- Explain consumption rates and quantities

### 6. Publication & Dissemination Justification (EP-09)
- Open access strategy and associated costs
- Conference presentation plan
- Knowledge dissemination beyond academia

### 7. Other Costs Justification
- Software, participant incentives, subcontracts, etc.
- Each with clear link to project activities

### 8. Indirect Costs / Overheads
- Institutional rate and basis
- What overhead covers that supports the project

### 9. Compliance Checklist (EP-10)
Create a compliance verification table:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Within budget ceiling | ✓/✗ | ... |
| Eligible cost categories | ✓/✗ | ... |
| Personnel effort limits | ✓/✗ | ... |
| Equipment thresholds | ✓/✗ | ... |
| Travel restrictions | ✓/✗ | ... |
| Indirect cost cap | ✓/✗ | ... |
| Cost sharing requirements | ✓/✗ | ... |

### 10. Value for Money Statement
- Cost-effectiveness argument
- Comparison with similar funded projects (if possible)
- Return on investment framing

---

## OUTPUT FORMAT
Structure your response as a markdown document titled "# Budget Justification: [Project Title]". Write in a persuasive, professional tone suitable for inclusion in a grant proposal. Include the compliance checklist as a markdown table. Flag items needing verification with [VERIFY] and researcher input with [USER INPUT NEEDED].

**CRITICAL:** Every budget line must be defended with a clear link to specific research activities and project objectives. The narrative must read as a coherent argument for why each expenditure is necessary, reasonable, and compliant. Evaluators should finish reading this feeling confident that the budget represents excellent value.`,
};
