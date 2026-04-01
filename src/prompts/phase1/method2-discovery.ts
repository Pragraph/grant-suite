import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method2-trend-discovery",
  phase: 1,
  step: 1,
  name: "Trend Discovery — Synthesis & Direction",
  description:
    "Synthesise bibliometric search results into feasible, fundable research directions with citation-trend evidence.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType", "selectedTrendTopic", "trendSearchResults"],
  optionalInputs: ["country", "careerStage", "grantScheme"],
  outputName: "Method2_Trend_Discovery.md",
  epTags: ["EP-01"],
  estimatedWords: 3500,
  template: `You are an experienced {{discipline}} research strategist with expertise in bibliometric trend analysis, citation pattern interpretation, and research gap identification.

## CONTEXT & INPUTS

- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
- **Selected Topic:** {{selectedTrendTopic}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

**Bibliometric Search Results (from Publish or Perish or Citation Impact Analyzer — sorted by citations per year):**
The user collected the following high-impact publications related to their selected topic. The data may be in APA reference format or tabular (Excel) format. Analyse all entries regardless of format.

{{trendSearchResults}}

---

## STAGE 1: PUBLICATION ANALYSIS (EP-01)

Analyse the provided publications to map the current research landscape.

### 1.1 — Thematic Mapping
- Identify dominant themes appearing across multiple publications
- Map conceptual clusters and their relationships
- Flag themes with increasing recent attention (trending upward)

### 1.2 — Methodological Patterns
- What research designs dominate?
- What populations, samples, or contexts appear most?
- What measurement instruments or analytical approaches are common?

### 1.3 — Theoretical Frameworks
- What theories or models underpin the research?
- Which frameworks appear underutilised or emerging?

### 1.4 — Citation Velocity Signals
- Which papers have the highest citations-per-year?
- What do the most-cited recent papers have in common?
- What topics are accelerating vs plateauing?

**Output Format:**
\`\`\`
THEMATIC MAP
├── Core Theme 1: [Description] — Frequency: [High/Medium/Low]
│   └── Subthemes: [List]
├── Core Theme 2: [Description] — Frequency: [High/Medium/Low]
│   └── Subthemes: [List]
└── Emerging Themes: [List with brief explanation]

METHODOLOGICAL LANDSCAPE
├── Dominant Designs: [List]
├── Common Populations: [List]
└── Prevalent Instruments: [List]

THEORETICAL FOUNDATION
├── Dominant Theories: [List]
└── Underutilised Frameworks: [List]
\`\`\`

---

## STAGE 2: GAP IDENTIFICATION

Based on Stage 1, identify specific research gaps.

| Gap Type | Specific Gap Identified | Evidence from Publications | Opportunity Level |
|----------|-------------------------|---------------------------|-------------------|
| Empirical | [Description] | [Which papers reveal this gap] | High/Medium/Low |
| Methodological | [Description] | [Which papers reveal this gap] | High/Medium/Low |
| Theoretical | [Description] | [Which papers reveal this gap] | High/Medium/Low |
| Practical | [Description] | [Which papers reveal this gap] | High/Medium/Low |

Identify at least 6-8 gaps total across all categories.

---

## STAGE 3: RESEARCH DIRECTION SYNTHESIS

Generate 3-5 viable research directions based on identified gaps, adapted for {{researchType}}.
{{#if grantScheme}}Ensure alignment with {{grantScheme}} evaluation criteria and funding priorities.{{/if}}

For each direction:

**Direction [N]: [Proposed Title]**
- **Core Research Question** — Specific, testable question
- **Gaps Addressed** — Which gaps from Stage 2 (reference the source publications)
- **Novelty Statement** — What makes this direction original
- **Methodological Approach** — Suitable for {{researchType}}
- **Expected Outcomes** — What success looks like
- **Funding Fit** — Which types of grants this suits
{{#if grantScheme}}- **{{grantScheme}} Alignment** — How this maps to the grant scheme's priorities{{/if}}
- **Key Supporting Papers** — Specific publications from the input that support this direction

---

## STAGE 4: FEASIBILITY & RED FLAGS

Validate each direction:

| Direction | Saturation Risk | Literature Volume | Data Access | Methods Feasibility | Ethics | VERDICT |
|-----------|----------------|-------------------|-------------|---------------------|--------|---------|
| Dir 1 | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | VIABLE/REVISE/DROP |
| Dir 2 | ... | ... | ... | ... | ... | ... |

**Red flag rules:**
- >1 recent review on the exact topic → saturation risk
- <10 primary studies → may be insufficient for meta-analysis
- Proprietary data required → flag access concerns

---

## STAGE 5: RANKING & RECOMMENDATION

| Rank | Direction | Gap Alignment (1-5) | Feasibility (1-5) | Impact (1-5) | Funding Fit (1-5) | Overall |
|------|-----------|---------------------|--------------------|--------------|--------------------|---------|

**Primary Recommendation:** Direction [N]
[2-3 sentence justification referencing specific papers from the input]

**Alternative Recommendation:** Direction [N]
[Brief rationale]

---

## NEXT STEPS
For the top-ranked direction:
1. Validate novelty — search Google Scholar for the proposed title
2. Key literature to review (5-10 papers from the input)
3. Potential collaborators based on the cited authors
4. Suitable grant programmes to target
5. Timeline estimate for proposal development

## OUTPUT FORMAT
Structure as a clear markdown document with tables, clear headings, and explicit references to the input publications throughout. Every recommendation must trace back to specific papers the user collected.`,
};
