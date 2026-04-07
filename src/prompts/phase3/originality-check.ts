import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step16-originality-check",
  phase: 3,
  step: 16,
  name: "Plagiarism & Originality Check",
  description:
    "Assess the originality of your proposal text and identify potential plagiarism risks, overlapping narratives, or unattributed sources.",
  requiredInputs: ["discipline", "proposalText"],
  optionalInputs: [
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Originality_Check.md",
  epTags: ["EP-01", "EP-10"],
  estimatedWords: 1500,
  template: `You are an academic integrity and originality specialist. Your task is to review proposal text for potential originality concerns, suggest improvements, and help ensure the proposal represents genuinely original work.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}

## PROPOSAL TEXT TO REVIEW
{{proposalText}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT (from Phase 2)
{{> Proposal_Blueprint.md}}
{{/if}}

{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if grantScheme}}
## MYGRANTS TURNITIN REQUIREMENT
MOHE grants require a Turnitin similarity report. Key thresholds:
- FRGS/PRGS: similarity index must be **below 20%**
- Flag any passages likely to trigger high similarity (common AI-generated phrasing, standard methodology descriptions, widely-used frameworks)
- The check should be run on the COMPLETE proposal text, not individual sections
- Provide specific rewriting suggestions for any flagged passages
- Remind user to run the final check through institutional Turnitin access before MyGRANTS submission
{{/if}}

## INSTRUCTIONS

Produce an Originality Assessment covering:

---

### 1. Originality Assessment Overview (EP-01)
- **Overall originality score** — High / Medium / Low with justification
- **Key strengths** — What makes this proposal distinctive
- **Areas of concern** — Sections that may overlap with common proposal language

### 2. Section-by-Section Analysis
| Section | Originality Level | Concern Type | Specific Issue | Recommendation |
|---------|-----------------|-------------|---------------|---------------|

Concern types: Generic language, Common phrasing, Potential self-plagiarism, Unattributed ideas, Boilerplate text

### 3. Language Originality Check (EP-10)
Identify passages that:
- Use overly generic or boilerplate language
- Could be improved with more specific, original phrasing
- May trigger similarity detection in automated systems
- Mirror common grant proposal templates too closely

For each flagged passage, provide:
- **Original text** — The passage of concern
- **Issue** — Why it's flagged
- **Suggested revision** — More original alternative

### 4. Conceptual Originality
- Is the research question genuinely novel?
- Are the methods innovative or standard?
- Does the impact narrative offer fresh perspectives?
- How does this differ from the PI's previous proposals?

### 5. Attribution & Citation Check
- Are all ideas properly attributed?
- Any claims that need supporting references?
- Recommended citations to add for completeness
- Self-citation balance assessment

### 6. Improvement Recommendations
Priority-ranked list of changes to improve originality:
1. [Change] — [Impact on originality] — [Effort level]

---

## OUTPUT FORMAT
Structure as "# Originality & Plagiarism Assessment". Begin with a traffic-light summary (Green/Amber/Red). Use tables for systematic analysis. Flag critical issues prominently.

**IMPORTANT:** This is a supportive tool, not an accusation. Frame all feedback constructively. The goal is to help the researcher present their genuinely original work in the most original way possible.`,
};
