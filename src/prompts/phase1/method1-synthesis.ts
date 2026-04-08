import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method1-gap-synthesis",
  phase: 1,
  step: 1,
  name: "Gap-Based Discovery — Synthesis & Direction",
  description:
    "Synthesize expert-identified research gaps from Scholar Labs into feasible, fundable research directions with full citation trails and copy-ready Direction Brief output.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType", "selectedTopic", "collectedGapsWithCitations_formatted"],
  optionalInputs: ["grantScheme", "grantSubCategory", "country", "targetFunder"],
  outputName: "Method1_Gap_Synthesis.md",
  epTags: ["EP-01"],
  estimatedWords: 4000,
  template: `You are an experienced {{discipline}} research strategist with expertise in synthesizing research gaps from systematic reviews and meta-analyses into novel, impactful, and feasible research directions.

**CRITICAL OUTPUT ORDER: Present the copy-ready Research Direction Briefs FIRST in your response, followed by the supporting analysis. Do not begin your response with gap tables or analysis stages.**

## CONTEXT & INPUTS

- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
- **Selected Topic:** {{selectedTopic}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}
{{#if grantSubCategory}}- **Grant Sub-Category:** {{grantSubCategory}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}
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

**Source of Gaps:** The following research gaps and future study recommendations were extracted from recent systematic reviews and meta-analyses identified via Google Scholar Labs. Each gap includes its source citation.

**Expert-Identified Research Gaps with Citations:**
{{collectedGapsWithCitations_formatted}}

---

## YOUR TASK

Analyse the provided gaps and produce TWO outputs in this exact order:

1. **PRIMARY OUTPUT — Copy-Ready Research Direction Briefs** (presented FIRST)
2. **SUPPORTING ANALYSIS — Gap analysis, feasibility screening, and ranking evidence** (presented SECOND)

The primary output is the user's main deliverable. The supporting analysis provides the evidence base. Follow the stages below to reason through the analysis, but structure your final output with the copy-ready briefs at the top.

---

## ANALYTICAL STAGES (for your reasoning — output these AFTER the briefs)

### STAGE 1: GAP ANALYSIS & CLUSTERING (EP-01)

#### 1.1 — Gap Categorisation
Categorise each gap into one or more types: Population Gap, Methodology Gap, Context Gap, Mechanism Gap, Intervention Gap, Measurement Gap, Longitudinal Gap.

#### 1.2 — Priority Assessment
| Gap (with source) | Category | Frequency | Recency | Feasibility (1–5) | Impact (1–5) | Priority |

#### 1.3 — Top 3 Priority Gaps
For each: What is the gap? Why is it high priority? Which source citations support it?

### STAGE 2: FEASIBILITY SCREENING

| Priority Gap | Design Fit for {{researchType}}? | Data/Resources Needed | Ethical Considerations | Verdict |
Use: ✓/✗ for design fit. 🟢/🟡/🔴 for resources and ethics. Verdict = PURSUE / MODIFY / SKIP.

### STAGE 3: DIRECTION SYNTHESIS & RANKING

Generate 3–5 viable research directions. Rank them:
{{#if grantScheme}}When scoring "Funding Fit", evaluate specifically against {{grantScheme}}{{#if grantSubCategory}} ({{grantSubCategory}}){{/if}} requirements as described in the Grant Scheme Alignment Filter above.{{/if}}
| Rank | Direction | Gap Alignment (1–5) | Feasibility (1–5) | Impact (1–5) | Funding Fit (1–5) | Overall |

Identify the Primary Recommendation and Alternative Recommendation with 2–3 sentence justifications.

---

## PRIMARY OUTPUT FORMAT — COPY-READY RESEARCH DIRECTION BRIEFS

For the **top 3 ranked directions**, produce a complete, structured brief. Each brief contains all fields needed for the Research Direction Brief form. The user will read these, choose one direction, and copy the content directly.

IMPORTANT FORMATTING RULES:
- Each field must be clearly labeled with the exact field name shown below.
- Write each field as ready-to-paste content, not as instructions or suggestions.
- Research Objectives must use RO1/RO2/RO3 format.
- Research Questions must use RQ1/RQ2/RQ3 format.
- Gap Justification must be 2–3 substantive paragraphs citing the source papers.
- Key References must be in APA format, including all relevant source papers from the input plus 2–3 additional recommended references.
- All fields must be specific to the direction, not generic.

Structure each direction brief exactly as follows:

---

### ★ DIRECTION [RANK] OF 3: [Title]
**Recommendation: [Primary / Alternative / Tertiary]**
**Overall Score: [N]/20**

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
> [2–3 paragraphs explaining the unresolved gap, citing source papers from the input. Be specific about what the literature has missed, why existing work is insufficient, and what this direction would resolve. Every claim must reference a source paper.]

> **KEY REFERENCES**
> [All relevant APA citations from the input gaps, plus 2–3 additional references the researcher should review. Number them.]

> **TARGET POPULATION / SAMPLE**
> [Specific population, estimated sample size, recruitment context, and inclusion/exclusion criteria]

> **THEORETICAL / CONCEPTUAL FRAMEWORK**
> [The theory, model, or framework grounding this direction. Explain why it is appropriate.]

> **PROPOSED METHODOLOGY**
> [Research design, key methods, data collection approach, and analysis strategy. Must be suitable for {{researchType}}.]

> **EXPECTED OUTCOMES**
> [Specific deliverables: publications, models, tools, datasets, patents, or frameworks this research will produce]

> **STUDY SCOPE & BOUNDARIES**
> [Time frame, geographical scope, key variables, and known limitations or exclusions]

---

After presenting all 3 direction briefs, include:

### HOW TO USE THESE BRIEFS
1. Review all 3 directions above.
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

## CITATION TRAIL

List all source papers referenced in this analysis:
1. [APA citation from input]
2. ...

---

## NEXT STEPS
For the top-ranked direction:
1. Validate novelty — search Google Scholar for the proposed title
2. Key literature to review (5–10 papers, including the source citations above)
3. Potential collaborators based on the cited authors
4. Suitable grant programmes to target
5. Timeline estimate for proposal development`,
};
