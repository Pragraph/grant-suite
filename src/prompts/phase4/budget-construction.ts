import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase4.step2-budget-construction",
  phase: 4,
  step: 2,
  name: "Budget Construction",
  description:
    "Generate a detailed, itemized budget breakdown with multi-year projections, cost justifications, and compliance alignment for the target grant program.",
  requiredInputs: ["discipline", "budgetLimit", "projectDuration", "currency"],
  optionalInputs: [
    "country",
    "targetFunder",
    "Research_Design.md",
    "Grant_Intelligence.md",
    "Team_Strategy.md",
  ],
  outputName: "Budget_Draft.md",
  epTags: ["EP-08", "EP-09"],
  estimatedWords: 3500,
  template: `You are a research grant budget specialist who creates detailed, defensible budgets that maximize funding while ensuring compliance with funder guidelines. Your task is to construct a comprehensive budget that aligns with the research design and team composition.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Total Budget Limit:** {{currency}} {{budgetLimit}}
- **Project Duration:** {{projectDuration}} years
- **Currency:** {{currency}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}

{{#if Research_Design.md}}
## RESEARCH DESIGN (from Phase 3)
{{> Research_Design.md}}
{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Team_Strategy.md}}
## TEAM STRATEGY (from Phase 4, Step 1)
{{> Team_Strategy.md}}
{{/if}}

## INSTRUCTIONS

Produce a comprehensive Budget Construction document with an itemized breakdown covering these categories:

---

### Budget Table

Create a detailed budget table with the following structure. Adjust year columns based on the project duration ({{projectDuration}} years):

#### Personnel
| Item | Year 1 | Year 2 | Year 3 | Total | Justification |
|------|--------|--------|--------|-------|--------------|
| PI (X% effort) | ... | ... | ... | ... | ... |
| Co-I (X% effort) | ... | ... | ... | ... | ... |
| Postdoc (full-time) | ... | ... | ... | ... | ... |
| PhD Student | ... | ... | ... | ... | ... |
| Research Assistant | ... | ... | ... | ... | ... |

#### Equipment
| Item | Year 1 | Year 2 | Year 3 | Total | Justification |
|------|--------|--------|--------|-------|--------------|

#### Travel
| Item | Year 1 | Year 2 | Year 3 | Total | Justification |
|------|--------|--------|--------|-------|--------------|
| Conference attendance | ... | ... | ... | ... | ... |
| Fieldwork travel | ... | ... | ... | ... | ... |
| Collaboration visits | ... | ... | ... | ... | ... |

#### Materials & Supplies
| Item | Year 1 | Year 2 | Year 3 | Total | Justification |
|------|--------|--------|--------|-------|--------------|

#### Publication & Dissemination
| Item | Year 1 | Year 2 | Year 3 | Total | Justification |
|------|--------|--------|--------|-------|--------------|
| Open access fees | ... | ... | ... | ... | ... |
| Conference registration | ... | ... | ... | ... | ... |

#### Other Direct Costs
| Item | Year 1 | Year 2 | Year 3 | Total | Justification |
|------|--------|--------|--------|-------|--------------|
| Software licenses | ... | ... | ... | ... | ... |
| Participant incentives | ... | ... | ... | ... | ... |

#### Indirect Costs / Overheads
| Item | Year 1 | Year 2 | Year 3 | Total | Justification |
|------|--------|--------|--------|-------|--------------|

### Budget Summary
| Category | Year 1 | Year 2 | Year 3 | Total |
|----------|--------|--------|--------|-------|
| Personnel | ... | ... | ... | ... |
| Equipment | ... | ... | ... | ... |
| Travel | ... | ... | ... | ... |
| Materials | ... | ... | ... | ... |
| Publication | ... | ... | ... | ... |
| Other | ... | ... | ... | ... |
| Indirect | ... | ... | ... | ... |
| **TOTAL** | ... | ... | ... | ... |

### Key Budget Notes
1. **Inflation adjustment** — Include annual inflation rate applied (if any)
2. **Exchange rate** — Note if any costs are in different currencies
3. **In-kind contributions** — List any institutional or partner in-kind support
4. **Cost sharing** — Any required or voluntary cost sharing
5. **Contingency** — Whether a contingency is included and at what %

---

## OUTPUT FORMAT
Structure your response as a markdown document titled "# Budget Construction: [Project Title]". ALL budget items MUST use markdown tables with numeric values (no text in amount cells — use numbers only). Include a budget summary table at the end. Use the specified currency ({{currency}}) throughout. Flag items needing researcher input with [USER INPUT NEEDED].

**CRITICAL:** The budget must:
- Stay within the total limit of {{currency}} {{budgetLimit}}
- Cover exactly {{projectDuration}} years
- Align personnel costs with the Team Assembly Strategy roles and effort percentages
- Include justifications that link each cost to specific research activities
- Comply with funder guidelines from Grant Intelligence (if available)`,
};
