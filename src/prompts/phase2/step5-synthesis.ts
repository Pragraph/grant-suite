import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase2.framework-synthesis",
  phase: 2,
  step: 4,
  name: "Innovation Statement",
  description:
    "Synthesize your conceptual framework, research questions, and methodology into a compelling innovation statement that articulates your proposal's unique contribution.",
  requiredInputs: ["discipline", "grantName"],
  optionalInputs: [
    "careerStage",
    "Conceptual_Framework.md",
    "Research_Questions.md",
    "Methodology_Design.md",
    "Grant_Intelligence.md",
  ],
  outputName: "Innovation_Statement.md",
  epTags: ["EP-03", "EP-05", "EP-07"],
  estimatedWords: 2000,
  template: `You are a research strategist who helps academics articulate the unique value of their proposed work. Your task is to synthesize the outputs from the Framework Design phase into a cohesive innovation statement.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}

{{#if Conceptual_Framework.md}}
## CONCEPTUAL FRAMEWORK (from Phase 2, Step 1)
{{> Conceptual_Framework.md}}
{{/if}}

{{#if Research_Questions.md}}
## RESEARCH QUESTIONS (from Phase 2, Step 2)
{{> Research_Questions.md}}
{{/if}}

{{#if Methodology_Design.md}}
## METHODOLOGY DESIGN (from Phase 2, Step 3)
{{> Methodology_Design.md}}
{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

## INSTRUCTIONS

### 1. Novelty Articulation (EP-03)
Clearly state what is **new** about your approach:
- What gap does this address that others have not?
- How does your framework advance the state of the art?
- What makes your methodology innovative or particularly well-suited?

### 2. Coherence Check (EP-05)
Demonstrate internal consistency:
- How do your research questions flow from the conceptual framework?
- How does the methodology directly address each research question?
- Are there any misalignments or gaps between framework, questions, and methods?

### 3. Impact Potential (EP-07)
Articulate the potential impact:
- What will change if this research succeeds?
- Who benefits and how?
- How does this align with the funder's strategic priorities?

### 4. Innovation Statement Draft
Produce a 500–800 word innovation statement that:
- Opens with a compelling hook about the problem
- Articulates the novel approach in accessible language
- Connects framework → questions → methods → impact in a logical narrative
- Ends with a forward-looking statement about significance

## OUTPUT FORMAT
Structure your response with the four sections above, followed by the polished Innovation Statement draft ready for inclusion in the proposal.`,
};
