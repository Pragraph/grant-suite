import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method4-convergence",
  phase: 1,
  step: 1,
  name: "Convergence Synthesis",
  description:
    "Synthesize outputs from multiple discovery methods to identify convergent themes and produce copy-ready Research Direction Briefs for the strongest directions.",
  requiredInputs: ["discipline"],
  optionalInputs: ["areaOfInterest", "researchType", "country", "careerStage", "grantScheme", "grantSubCategory", "targetFunder"],
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
{{#if grantSubCategory}}- **Grant Sub-Category:** {{grantSubCategory}}{{/if}}
{{#if targetFunder}}- **Funder:** {{targetFunder}}{{/if}}

{{#if grantScheme}}
## GRANT SCHEME ALIGNMENT FILTER

You MUST factor the following grant scheme context into your analysis. Directions that do not align with these requirements will score poorly and should be ranked lower or excluded.

**Scheme:** {{grantScheme}}{{#if grantSubCategory}} ({{grantSubCategory}}){{/if}}
{{#if targetFunder}}**Funder:** {{targetFunder}}{{/if}}
{{#if country}}**Country context:** {{country}}{{/if}}

If the target grant scheme is **FRGS**:
- Topics MUST be fundamental research (generating new knowledge, theory, or concepts). Applied or product-development topics are not eligible.
- Patent search is encouraged but not mandatory. Risk assessment plan is mandatory.

If the target grant scheme is **GET**:
- Industry collaboration is MANDATORY (LOI/MoU/MoA required). Prioritise topics where an industry partner would naturally benefit.
- Patent search via lens.org is MANDATORY. Favour topics with patentable potential.
- Minimum 1 IP filing is required. Topics producing patentable methods, tools, or frameworks score higher.
- Return of Value (ROV) is MANDATORY with 3-year post-completion monitoring. Topics must have demonstrable, measurable impact on real beneficiaries.
- If the sub-category is **exploratory**: Topics should explore the unknown to generate hypotheses or conceptual frameworks (TRL 1-2). Open-ended investigation is acceptable.
- If the sub-category is **transformative**: Topics MUST involve radical change to existing policies, SOPs, processes, or systems. Incremental improvements are insufficient. Must produce proof of concept with clear beneficiaries (TRL 2-3).

If the target grant scheme is **PRGS**:
- Topics MUST have a clear prototype or product output. TRL progression narrative is essential.
- Patent Search Report is mandatory.

If the target grant scheme is **TRGS**:
- Topics should require trans-disciplinary collaboration across faculties or institutions.

If the target grant scheme is **LRGS**:
- Topics must address national priority areas with long-term, high-impact potential. Consortium-based.

If the target grant scheme is **PPRN**:
- Topics must be industry-driven with a registered SSM industry partner. Demand-driven innovation.

For **international grants**: Prioritise topics with strong international collaboration potential and alignment with the funder's strategic priorities.

If the target grant scheme is **GET**, the following national priority domains are MANDATORY alignment targets. When evaluating and ranking topics, explicitly flag which Mega Trend(s) and/or BITARA niche(s) each topic aligns with:

**7 Mega Trends (RMK13) — at least 1 must be addressed:**
1. Shifting Economic Blocs (Perubahan Susunan Blok Ekonomi)
2. Future Technology & Digital (Teknologi & Digital Masa Hadapan)
3. Demographics & Quality of Life (Demografi & Kualiti Hidup)
4. Global Health Crisis (Krisis Kesihatan Bumi)
5. Education (Pendidikan)
6. National Security (Keselamatan Negara)
7. Heritage & Local Wisdom (Warisan & Kearifan Tempatan)

**BITARA Niche Areas (if applicable):**
E&E, Aerospace, Chemical, Machinery & Equipment, Digital & ICT, Pharmaceutical, Medical Devices, Palm Oil Products, Rubber Products

**ESG Components (at least 1 should be addressed):**
Environmental, Social, Governance

**Additional policy alignment:** RPTM 2026-2035, MADANI, MySTIE, SDGs

For **FRGS, PRGS, TRGS, LRGS, PPRN**: Implicit alignment with MADANI, MySTIE, and SDGs is expected. Mega Trends and BITARA are not mandatory but strengthen the proposal if addressed.
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
{{#if grantScheme}}When scoring and ranking directions, evaluate specifically against {{grantScheme}}{{#if grantSubCategory}} ({{grantSubCategory}}){{/if}} requirements as described in the Grant Scheme Alignment Filter above.{{/if}}
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
