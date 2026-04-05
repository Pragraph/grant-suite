import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method4-convergence",
  phase: 1,
  step: 1,
  name: "Convergence Synthesis",
  description:
    "Synthesize outputs from multiple discovery methods to identify convergent themes and produce copy-ready Research Direction Briefs for the strongest directions.",
  requiredInputs: ["discipline"],
  optionalInputs: ["areaOfInterest", "researchType", "country", "careerStage", "grantScheme"],
  outputName: "Method4_Convergence_Synthesis.md",
  epTags: ["EP-01"],
  estimatedWords: 4000,
  template: `You are a senior research strategist. Your task is to synthesize the outputs from multiple research discovery methods, identify convergent themes, and produce copy-ready Research Direction Briefs for the strongest directions.

**CRITICAL OUTPUT ORDER: Present the copy-ready Research Direction Briefs FIRST in your response, followed by the supporting analysis. Do not begin your response with cross-method mapping tables or convergence matrices.**

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if areaOfInterest}}- **Area of Interest:** {{areaOfInterest}}{{/if}}
{{#if researchType}}- **Research Type:** {{researchType}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if grantScheme}}
## GRANT SCHEME CONTEXT
When scoring convergence and ranking research directions, factor in the specific priorities of the {{grantScheme}} scheme:
- For MOHE grants (FRGS, PRGS, TRGS, LRGS, PPRN): prioritise directions that align with Malaysian national research priority areas and the 13th Malaysia Plan (RMKe-13)
- For FRGS: favour fundamental research with clear novelty claims supportable by patent search evidence
- For PRGS: favour directions with clear prototype/product potential and TRL progression narrative
- For TRGS/LRGS: favour directions requiring multi-disciplinary or multi-institutional collaboration
- For international grants: prioritise directions with strong international collaboration potential
{{/if}}

## DISCOVERY METHOD OUTPUTS

{{#if method1_output}}
### Method 1: Gap-Based Discovery
{{method1_output}}
{{/if}}

{{#if method2_output}}
### Method 2: Trend-Based Discovery
{{method2_output}}
{{/if}}

---

## YOUR TASK

Analyse the discovery method outputs above and produce TWO outputs in this exact order:

1. **PRIMARY OUTPUT — Copy-Ready Research Direction Briefs** (presented FIRST)
2. **SUPPORTING ANALYSIS — Cross-method mapping, convergence matrix, and ranking evidence** (presented SECOND)

The primary output is the user's main deliverable. The supporting analysis provides the evidence base.

---

## ANALYTICAL STAGES (for your reasoning — output these AFTER the briefs)

### STAGE 1: Cross-Method Theme Mapping (EP-01)
- Identify themes, topics, or research directions that appear across multiple methods.
- Highlight themes that appear in all available methods (strongest convergence signal).
- Note themes unique to a single method that are still compelling.

### STAGE 2: Convergence Matrix
| Theme | Gap Evidence (1–5) | Trend Support (1–5) | Feasibility (1–5) | Total |
Score 0 if that method was not used, and note it.

### STAGE 3: Ranking
Rank the top directions from the convergence matrix, with 2–3 sentence justifications for the Primary and Alternative recommendations.

---

## PRIMARY OUTPUT FORMAT — COPY-READY RESEARCH DIRECTION BRIEFS

For the **top 3 converged directions**, produce a complete, structured brief. Each brief contains all fields needed for the Research Direction Brief form. The user will read these, choose one direction, and copy the content directly.

IMPORTANT FORMATTING RULES:
- Each field must be clearly labeled with the exact field name shown below.
- Write each field as ready-to-paste content, not as instructions or suggestions.
- Research Objectives must use RO1/RO2/RO3 format.
- Research Questions must use RQ1/RQ2/RQ3 format.
- Gap Justification must be 2–3 substantive paragraphs citing papers from both discovery methods where possible.
- Key References must be in APA format, combining the strongest references from both discovery outputs plus any additional recommended references.
- Convergence strength should be noted explicitly: directions supported by both methods are stronger.
- All fields must be specific to the direction, not generic.

Structure each direction brief exactly as follows:

---

### ★ DIRECTION [RANK] OF 3: [Title]
**Recommendation: [Primary / Alternative / Tertiary]**
**Convergence Score: [N]/15**
**Supported by: [Gap-Based ✓/✗] [Trend-Based ✓/✗]**

> **RESEARCH TOPIC / TITLE**
> [A refined, specific, publication-ready research title]

> **RESEARCH OBJECTIVES**
> RO1: [Specific, measurable objective]
> RO2: [Specific, measurable objective]
> RO3: [Specific, measurable objective]
> [RO4: if warranted]

> **RESEARCH QUESTIONS**
> RQ1: [Specific, answerable research question aligned with RO1]
> RQ2: [Specific, answerable research question aligned with RO2]
> RQ3: [Specific, answerable research question aligned with RO3]

> **GAP JUSTIFICATION**
> [2–3 paragraphs explaining the unresolved gap. Draw evidence from both discovery methods where possible. Cite specific papers. Be explicit about what the convergence of gap evidence AND trend data reveals that neither method alone would show.]

> **KEY REFERENCES**
> [Combined APA citations from both discovery outputs, plus 2–3 additional references. Number them.]

> **TARGET POPULATION / SAMPLE**
> [Specific population, estimated sample size, recruitment context, and inclusion/exclusion criteria]

> **THEORETICAL / CONCEPTUAL FRAMEWORK**
> [The theory, model, or framework grounding this direction. Explain why it is appropriate.]

> **PROPOSED METHODOLOGY**
> [Research design, key methods, data collection approach, and analysis strategy.{{#if researchType}} Must be suitable for {{researchType}}.{{/if}}]

> **EXPECTED OUTCOMES**
> [Specific deliverables: publications, models, tools, datasets, patents, or frameworks this research will produce]

> **STUDY SCOPE & BOUNDARIES**
> [Time frame, geographical scope, key variables, and known limitations or exclusions]

---

After presenting all 3 direction briefs, include:

### HOW TO USE THESE BRIEFS
1. Review all 3 directions above. Directions supported by both Gap-Based and Trend-Based Discovery have the strongest evidence base.
2. Select the direction that best fits your expertise, resources, and interests.
3. In the Research Grant Suite app, proceed to the **Research Direction Brief** step.
4. Copy each labeled field from your chosen direction into the corresponding form field.
5. Adjust any details to match your specific context before proceeding.

---

Then present the supporting analysis (Stages 1–3) below a divider:

---

## SUPPORTING ANALYSIS

[Stage 1, Stage 2, and Stage 3 content here]

---

## NEXT STEPS
For the top-ranked direction:
1. Validate novelty — search Google Scholar for the proposed title
2. Key literature to review (5–10 papers combining both discovery outputs)
3. Potential collaborators based on the cited authors
4. Suitable grant programmes to target
5. Timeline estimate for proposal development`,
};
