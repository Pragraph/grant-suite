import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase2.step5-synthesis",
  phase: 2,
  step: 5,
  name: "Strategic Positioning Synthesis",
  description:
    "Synthesize all strategic analyses into the Proposal Blueprint — the foundational document that guides all proposal writing.",
  requiredInputs: ["discipline", "grantName"],
  optionalInputs: [
    "careerStage",
    "country",
    "Grant_Intelligence.md",
    "Requirements_Analysis.md",
    "Competitive_Analysis.md",
    "Evaluator_Psychology.md",
    "Impact_Framework.md",
    "grantScheme",
    "grantSubCategory",
    "Method4_Convergence_Synthesis.md",
    "Method1_Gap_Synthesis.md",
    "Method2_Trend_Discovery.md",
    "Method3_Research_Direction_Brief.md",
  ],
  outputName: "Proposal_Blueprint.md",
  epTags: ["EP-01", "EP-02", "EP-03", "EP-04", "EP-05", "EP-07", "EP-09", "EP-10"],
  estimatedWords: 5000,
  template: `You are a senior grant strategist who synthesizes strategic intelligence into actionable proposal blueprints. Your task is to combine all Phase 2 analyses into a comprehensive Proposal Blueprint — the MASTER DOCUMENT that will guide every section of the final proposal.

This document is the second foundational pillar (after Grant_Intelligence.md). Every subsequent phase depends on the quality and completeness of this blueprint.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Requirements_Analysis.md}}
## REQUIREMENTS ANALYSIS (from Phase 2, Step 1)
{{> Requirements_Analysis.md}}
{{/if}}

{{#if Competitive_Analysis.md}}
## COMPETITIVE ANALYSIS (from Phase 2, Step 2)
{{> Competitive_Analysis.md}}
{{/if}}

{{#if Evaluator_Psychology.md}}
## EVALUATOR PSYCHOLOGY (from Phase 2, Step 3)
{{> Evaluator_Psychology.md}}
{{/if}}

{{#if Impact_Framework.md}}
## IMPACT FRAMEWORK (from Phase 2, Step 4)
{{> Impact_Framework.md}}
{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if Method4_Convergence_Synthesis.md}}
## RESEARCH DISCOVERY CONTEXT (Convergence Synthesis from Phase 1)
The following is the researcher's unified research direction from their discovery process. The Proposal Blueprint should be strategically aligned with this direction.
{{> Method4_Convergence_Synthesis.md}}
{{/if}}

{{#unless Method4_Convergence_Synthesis.md}}
{{#if Method1_Gap_Synthesis.md}}
## RESEARCH DISCOVERY CONTEXT (Gap-Based Discovery from Phase 1)
{{> Method1_Gap_Synthesis.md}}
{{/if}}

{{#if Method2_Trend_Discovery.md}}
## RESEARCH DISCOVERY CONTEXT (Trend-Based Discovery from Phase 1)
{{> Method2_Trend_Discovery.md}}
{{/if}}

{{#if Method3_Research_Direction_Brief.md}}
## RESEARCH DISCOVERY CONTEXT (Research Direction Brief from Phase 1)
{{> Method3_Research_Direction_Brief.md}}
{{/if}}
{{/unless}}

## INSTRUCTIONS

Produce a comprehensive Proposal Blueprint that serves as the strategic foundation for writing the proposal. This document will be referenced in every subsequent phase.

---

### 1. Executive Strategy Summary
A 300-word strategic overview that captures:
- The core positioning (what makes this proposal unique)
- The primary competitive advantage
- The central impact narrative
- The key evaluator psychology levers to deploy
- The overall narrative arc from problem → approach → impact

### 2. Proposal Narrative Architecture (EP-01, EP-05)
Design the full narrative structure:

**Opening Hook** — The compelling opening that anchors the evaluator's first impression
- Draft the opening 2-3 sentences
- Psychological mechanism: anchoring + emotional resonance

**Problem Statement** — What needs to be solved and why it matters
- Key framing: [gain frame / loss frame / urgency frame]
- Evidence to cite

**Gap Identification** — What's missing in current knowledge/approaches
- Primary gap + 2-3 supporting gaps
- Connection to funder priorities

**Proposed Solution** — Your research approach as the answer
- Innovation narrative: what's new and why it works
- Positioning relative to competition

**Impact Vision** — What changes if this succeeds
- Primary impact pathway
- Stakeholder benefits
- Timeline to impact

**Feasibility Argument** — Why you and your team can deliver
- Track record framing
- Resource and partnership advantages
- Risk mitigation narrative

### 3. Section-by-Section Blueprint (EP-02, EP-09)
For each major proposal section, provide:

| Section | Key Message | EP Tags to Deploy | Word Budget | Priority Arguments | Evaluator Concerns to Address |
|---------|-------------|-------------------|-------------|-------------------|-------------------------------|
| Abstract/Summary | | | | | |
| Background/Introduction | | | | | |
| Research Questions/Objectives | | | | | |
| Methodology | | | | | |
| Impact/Significance | | | | | |
| Feasibility/Timeline | | | | | |
| Team/Capacity | | | | | |
| Budget Justification | | | | | |

### 4. EP Deployment Strategy (EP-03, EP-10)
A tactical plan for deploying all relevant EP tags throughout the proposal:
- Which EP tags are most critical for THIS grant
- Where each tag should be deployed (specific sections and paragraphs)
- Priority order of EP tags by impact on scoring
- Interactions between EP tags (which ones reinforce each other)

### 5. Champion Phrase Integration Plan
From the Evaluator Psychology Profile, select the 10 most powerful champion phrases and specify exactly where to deploy them:

| Phrase | Target Section | Paragraph Position | Supporting Argument |
|--------|---------------|-------------------|---------------------|

### 6. Differentiation Strategy (EP-04)
The finalized competitive positioning:
- **Primary differentiator** — the #1 reason to fund this over competitors
- **Secondary differentiators** — supporting unique strengths
- **Defensive positioning** — how to address likely weaknesses
- **Narrative hooks** — specific phrases/framings that signal differentiation

### 7. Risk Register & Mitigation
Strategic risks to the proposal's success and how to address them:

| Risk | Likelihood | Impact | Mitigation Strategy | Where Addressed in Proposal |
|------|-----------|--------|---------------------|-----------------------------|

### 8. Quality Gates
Checkpoints for each proposal section:
- Does it align with the evaluation criteria? (EP-02)
- Does it deploy the right EP tags?
- Does it support the central narrative?
- Does it address evaluator concerns?
- Is the language accessible and clear? (EP-09)
- Does it connect to the funder's strategic priorities? (EP-04)

### 9. Writing Guidelines
Specific guidance for the proposal writing phase:
- **Tone** — [formal academic / accessible expert / visionary leader]
- **Voice** — [first person / third person / mixed]
- **Technical level** — [specialist / educated generalist / mixed]
- **Key terminology** to use consistently
- **Phrases to avoid** — jargon, hedging language, overstatement
- **Formatting guidance** — how to use headings, figures, tables, callouts

---

## OUTPUT FORMAT
Structure as a markdown document titled "# Proposal Blueprint: [Grant Name]". This document should be comprehensive enough to serve as a complete writing guide for the proposal. Begin with the Executive Strategy Summary. Use tables, checklists, and clear formatting throughout.

**CRITICAL:** This is a strategic document, not a draft of the proposal. It should tell the writer WHAT to write and WHY, not provide the final prose (that comes in Phase 5).`,
};
