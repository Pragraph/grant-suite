import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase2.step3-psychology",
  phase: 2,
  step: 3,
  name: "Evaluator Psychology Profile",
  description:
    "Profile the evaluator mindset, cognitive biases, and decision-making patterns to craft a proposal that resonates at a psychological level.",
  requiredInputs: ["discipline", "grantName"],
  optionalInputs: [
    "careerStage",
    "Grant_Intelligence.md",
    "grantScheme",
  ],
  outputName: "Evaluator_Psychology.md",
  epTags: ["EP-02", "EP-03", "EP-05", "EP-09", "EP-10"],
  estimatedWords: 2500,
  template: `You are an expert in evaluator psychology and decision science applied to research funding. Your task is to build a comprehensive psychological profile of the evaluators for this grant, enabling the applicant to write a proposal that resonates at every cognitive and emotional level.

This is a KEY DIFFERENTIATOR of this proposal system. Most applicants focus only on content — we also optimize for how evaluators think, feel, and decide.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if grantScheme}}
## MOHE PANEL REVIEW CONTEXT
For Malaysian MOHE grants (FRGS, PRGS, TRGS, LRGS, PPRN), the evaluation panel has specific characteristics:

**Panel Composition:**
- Evaluators are typically senior Malaysian academics (Professors and Associate Professors) from related disciplines
- Each proposal receives 2–3 independent reviews via MyGRANTS
- A panel meeting may consolidate scores, but individual reviewer scores dominate
- Reviewers evaluate 20–50+ proposals per cycle — fatigue is a real factor

**Malaysian Reviewer Priorities (by scheme):**
- **FRGS:** Novelty is king. Reviewers look for clear evidence that this research has not been done before (patent search report is mandatory). Methodology rigor is second. National relevance is valued but secondary to scientific merit.
- **PRGS:** Prototype feasibility and TRL progression are paramount. Reviewers want to see a realistic path from concept to working prototype within the grant period.
- **TRGS:** Trans-disciplinary integration quality matters most. Reviewers assess whether the collaboration is genuine or tokenistic.
- **LRGS:** National strategic alignment and consortium governance are critical. Reviewers evaluate programme-level coherence across sub-projects.
- **PPRN:** Industry partner commitment and applied relevance are the main criteria. Note: PPRN is submitted via pprn.mohe.gov.my, not MyGRANTS.

**Cultural Considerations for Malaysian Academic Panels:**
- Respect for institutional hierarchy — demonstrate senior researcher oversight
- Strong emphasis on capacity building (postgraduate training counts heavily)
- National service framing resonates — position research as serving Malaysia's development
- Publications in indexed journals (Scopus/WoS) are expected as key outputs
- Prior grant completion rate is checked — address any gaps proactively
{{/if}}

## INSTRUCTIONS

Produce a focused Evaluator Psychology Profile with these sections. Every section must be actionable — if a recommendation can't be turned into specific proposal text, cut it.

---

### 1. Reviewer Context

Briefly describe the likely reviewer panel for this grant:
- **Panel size and composition** — how many reviewers, what expertise mix
- **Review load** — estimated proposals per cycle, time per proposal
- **Reading pattern** — what they read first, what they skim
- **Key implication** — the single most important thing to know about how these reviewers operate

Keep this to 200 words maximum. The goal is context, not speculation.

{{#if grantScheme}}
Use the MOHE panel context above to inform this section with specific details about Malaysian academic reviewers.
{{/if}}

### 2. EP Deployment Map (EP-02, EP-03, EP-05)

Create a tactical deployment table for ALL 10 core EP tags. For each tag, specify exactly where in the proposal to deploy it and provide a one-sentence implementation instruction:

| EP Tag | Principle | Deploy In | Implementation Instruction |
|--------|-----------|-----------|---------------------------|
| EP-01 | First Impression Anchoring | Title, Abstract, Opening paragraph | [One specific sentence about what to do] |
| EP-02 | Evaluation Criteria Alignment | Section headings, each section opener | [One specific sentence] |
| EP-03 | Novelty Signal | Research gap, Methods, Innovation claims | [One specific sentence] |
| EP-04 | Strategic Funder Alignment | Objectives, Impact, Background | [One specific sentence] |
| EP-05 | Internal Coherence | Cross-references between all sections | [One specific sentence] |
| EP-06 | Competitive Awareness | Literature review, Positioning | [One specific sentence] |
| EP-07 | Impact Amplification | Impact section, Abstract, Closing | [One specific sentence] |
| EP-08 | Track Record Framing | Team section, CV, Feasibility | [One specific sentence] |
| EP-09 | Cognitive Load Reduction | Structure, Formatting, Language | [One specific sentence] |
| EP-10 | Emotional Resonance | Opening hook, Impact, Significance | [One specific sentence] |

### 3. Champion Phrase Library (EP-09, EP-10)

Provide exactly 12 "champion phrases" — specific sentence templates an evaluator would quote when advocating for this proposal in panel. Group by category:

**Scientific Merit (3 phrases)**
> "[Phrase template]"
> Why it works: [one sentence]

**Innovation (3 phrases)**
> "[Phrase template]"
> Why it works: [one sentence]

**Impact (3 phrases)**
> "[Phrase template]"
> Why it works: [one sentence]

**Feasibility (3 phrases)**
> "[Phrase template]"
> Why it works: [one sentence]

These phrases must be specific to the discipline and grant type, not generic.

### 4. Loss-Frame Narrative Seeds (EP-10)

Provide exactly 5 "loss-frame narrative seeds" — ways to frame the research need in terms of what will be LOST if this research is NOT funded. Loss framing is more psychologically powerful than gain framing.

For each seed:
- **The loss frame:** "[What happens if we don't act]"
- **Where to deploy:** [Specific proposal section]
- **Supporting evidence:** [What data or trend supports this framing]

### 5. Evaluator Red Flags

List the 10 things that will immediately trigger negative evaluator responses for this specific grant type and discipline:

1. [Red flag] — [How to avoid it in this proposal]
2. ...

Be specific to the field, not generic "poor writing" advice.

---

## OUTPUT FORMAT
Structure as a markdown document titled "# Evaluator Psychology Profile: [Grant Name]". Begin with a 3-sentence summary. Use tables for the EP Deployment Map. Use blockquotes for Champion Phrases and Loss-Frame Seeds.

**CRITICAL:** All recommendations must be ethically sound — we optimize for clear communication and persuasion, never for deception or misrepresentation.`,
};
