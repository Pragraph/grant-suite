import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step6-budget-justification",
  phase: 5,
  step: 6,
  name: "Budget Justification Writer",
  description:
    "Draft the budget justification narrative connecting every cost line to a specific research activity in the methods.",
  requiredInputs: ["discipline", "grantName", "country", "wordLimit"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "Proposal_Data.md",
    "Methods_Draft.md",
    "Budget_Justification.md",
    "grantScheme",
  ],
  outputName: "Budget_Justification_Draft.md",
  epTags: ["EP-07", "EP-08", "EP-09", "EP-10"],
  estimatedWords: 2000,
  template: `You are an expert academic proposal writer specializing in budget justification narratives. Your task is to draft a budget justification that connects every cost line to a specific research activity, demonstrating that the budget is necessary, reasonable, and cost-effective.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}
- **Word Limit:** {{wordLimit}} words

## PROPOSAL DATA (includes budget details from Phase 4)
{{> Proposal_Data.md}}

## METHODS (every budget line must trace here)
{{> Methods_Draft.md}}

{{#if Budget_Justification.md}}
---

## EXISTING BUDGET JUSTIFICATION (from Phase 4)
The researcher has already produced a comprehensive Budget Justification in Phase 4. Your task is NOT to redo this analysis from scratch. Instead, take the existing justification below and adapt it into polished proposal-section prose:
- Tighten the language for a proposal audience (evaluators, not administrators)
- Ensure every cost connects to a specific method from the Methods section above
- Remove compliance-checklist language and replace with persuasive narrative
- Preserve all specific numbers, rates, and justification logic
- Add cross-references to the Methods section (e.g., "As described in Work Package 2...")

{{> Budget_Justification.md}}
{{/if}}

---

## INSTRUCTIONS

{{#if Budget_Justification.md}}
Adapt the existing Phase 4 Budget Justification (above) into polished proposal-section prose. Focus on tightening language, strengthening method connections, and making the narrative persuasive for evaluators. Do NOT regenerate the analysis from scratch.
{{/if}}
{{#unless Budget_Justification.md}}
Write a budget justification narrative that explains WHY each budget item is necessary and HOW it connects to the research methods. This is NOT a budget table — it is a persuasive narrative.
{{/unless}}

### 1. Personnel
- Justify each role: PI, Co-PIs, postdocs, PhD students, research assistants, technicians
- For each person: explain their specific responsibilities mapped to methods/work packages
- Justify the time commitment (% FTE) based on the workload in the methods
- If hiring is needed, explain why existing staff cannot fill the role
- Mark unknown salary details as [USER INPUT NEEDED: salary for role X]

### 2. Equipment & Infrastructure
- Justify each major equipment purchase or access cost
- Explain why existing institutional resources are insufficient
- Connect each item to the specific method that requires it
- Include maintenance and operating costs if applicable
- For shared equipment, justify the proportion of cost requested

### 3. Travel & Fieldwork
- Justify each trip category (conferences, fieldwork, collaboration visits, dissemination)
- Connect travel to specific project activities and timeline
- Provide cost basis (per diem rates, standard airfare estimates)
- Explain why virtual alternatives are insufficient where applicable

### 4. Consumables & Materials
- Justify consumable categories connected to experimental methods
- Provide unit costs and quantities where possible
- Explain the basis for quantity estimates (sample sizes, number of experiments)

### 5. Subcontracting & External Services
- Justify any outsourced work (lab analyses, surveys, software development)
- Explain why this work cannot be done in-house
- Connect to specific methods that require specialized capabilities

### 6. Other Costs
- Justify publication costs (open access fees), data management, software licenses
- Include any participant compensation, ethics review fees, IP costs
- Explain dissemination and knowledge exchange costs

### 7. Indirect Costs / Overheads
- State the institutional overhead rate if known, or mark as [USER INPUT NEEDED: overhead rate]
- Briefly explain what overheads cover

## WRITING GUIDELINES
- Every cost MUST trace to a specific method, work package, or project activity
- Use the structure: "X is needed because method Y requires Z"
- Show value for money — explain why the proposed approach is cost-effective
- Where costs follow institutional or funder standard rates, state this explicitly
- Anticipate reviewer questions: "Why can't this be done cheaper/differently?"
- Mark any uncertain costs with [USER INPUT NEEDED: cost estimate for X]
- Use [CITATION NEEDED] for market rates or benchmarks that need verification

## WORD LIMIT
**CRITICAL:** The budget justification MUST be under {{wordLimit}} words. Prioritize personnel and major equipment.

## OUTPUT FORMAT
Output as a markdown document titled "# Budget Justification" with clear subsections. At the end, include:
1. Word count
2. Budget-to-method traceability table (which cost maps to which method/work package)
3. List of [USER INPUT NEEDED] items requiring the user's actual budget figures
4. List of [CITATION NEEDED] placeholders

{{#if grantScheme}}
## MYGRANTS SUBMISSION TIP
Budget justification in MyGRANTS is entered per Vote code (11000, 21000, 24000, 27000, 28000, 29000, 35000). Structure your justification to match these Vote categories exactly. Any item exceeding RM3,000 will require 3 quotations uploaded as PDF attachments.
{{/if}}`,
};
