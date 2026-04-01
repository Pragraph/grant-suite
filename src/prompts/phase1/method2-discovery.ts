import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method2-trend-discovery",
  phase: 1,
  step: 1,
  name: "Trend Discovery — Final Research Exploration",
  description:
    "Comprehensive 5-stage research analysis: literature landscape, gap identification, topic generation, feasibility validation, and final title generation. Uses bibliometric data and curated high-impact titles.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType", "selectedTrendTopic", "curatedTitles"],
  optionalInputs: ["country", "careerStage", "grantScheme", "trendData"],
  outputName: "Method2_Trend_Discovery.md",
  epTags: ["EP-01"],
  estimatedWords: 4000,
  template: `You are an experienced {{discipline}} expert with over 30 years of experience. You are adept at analysing scientific literature to identify key themes, trends, and gaps. Your expertise lies in generating novel and impactful research titles that can significantly contribute to the field. You also possess strong methodological knowledge across research designs and understand practical constraints that determine whether a research topic is viable.

## CONTEXT & INPUTS

- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
- **Selected Topic:** {{selectedTrendTopic}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

**List of Highly Cited and Recent Publications (curated via Publish or Perish — sorted by Cites/Year):**
{{curatedTitles}}

{{#if trendData}}
**Raw Bibliometric Data from Publish or Perish:**
{{trendData}}
{{/if}}

---

## STAGE 1: LITERATURE ANALYSIS (EP-01)

Analyse the provided publications to establish the current state of knowledge.

### 1.1 — Thematic Mapping
- Identify the dominant themes appearing across multiple publications
- Map the conceptual clusters and how they relate
- Note which themes are receiving increasing attention (trending upward)

### 1.2 — Methodological Patterns
- What research designs dominate the literature?
- What populations, samples, or contexts are most frequently studied?
- What measurement instruments or analytical approaches are commonly used?

### 1.3 — Theoretical Frameworks
- What theories or models underpin the existing research?
- Are there competing theoretical perspectives?
- Which frameworks appear underutilised or emerging?

### 1.4 — Temporal Trends
- How has the research focus shifted over time?
- What topics are gaining momentum in recent publications?
- What established topics show declining attention?

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

### 2.1 — Empirical Gaps
- What phenomena lack sufficient empirical investigation?
- What relationships between variables remain untested?
- What contexts or populations are underrepresented?

### 2.2 — Methodological Gaps
- What research designs are underutilised for this topic?
- What measurement or analytical limitations exist?

### 2.3 — Theoretical Gaps
- What theoretical explanations are incomplete or contested?
- What theories from adjacent fields could be applied but have not been?

### 2.4 — Practical/Applied Gaps
- What real-world applications lack research support?
- What intervention effectiveness remains unknown?

**Output Format:**
| Gap Type | Specific Gap Identified | Opportunity Level |
|----------|-------------------------|-------------------|
| Empirical | [Description] | High/Medium/Low |
| Methodological | [Description] | High/Medium/Low |
| Theoretical | [Description] | High/Medium/Low |
| Practical | [Description] | High/Medium/Low |

---

## STAGE 3: POTENTIAL TOPICS GENERATION

Generate 8-10 specific research questions based on identified gaps, adapted for {{researchType}}.
{{#if grantScheme}}Ensure alignment with {{grantScheme}} evaluation criteria and funding priorities.{{/if}}

| # | Topic/Question | Type | Gap Addressed |
|---|----------------|------|---------------|
| 1 | [Specific question] | [Empirical/Comparative/Intervention/Validation] | [Gap from Stage 2] |
| ... | ... | ... | ... |

---

## STAGE 4: RED FLAGS VALIDATION

Validate each potential topic against feasibility criteria.

### Checks:
- **Saturation Check** — >1 recent review on the exact topic suggests saturation
- **Primary Literature Volume** — <10 studies may be insufficient for meta-analysis
- **Data Accessibility** — Proprietary data or restricted access?
- **Methodological Feasibility** — Requires resources beyond typical capacity?
- **Ethical Considerations** — Complex IRB requirements?

| Potential Topic | Saturation | Literature Volume | Data Access | Methods | Ethics | VERDICT |
|-----------------|------------|-------------------|-------------|---------|--------|---------|
| Topic 1 | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | VIABLE/REVISE/DROP |
| ... | ... | ... | ... | ... | ... | ... |

---

## STAGE 5: FINAL TITLE GENERATION

From the validated topics, generate 5 polished, publication-ready working titles.

For each title:
- **Title** — Clear, concise, signals methodology
- **Gap Addressed** — Specific gap from Stage 2
- **Innovation Angle** — What makes this novel
- **Feasibility Score** — High/Medium based on Stage 4
- **Potential Impact** — Why this matters to the field
- **Suggested Research Design** — Brief methodological direction
{{#if grantScheme}}- **{{grantScheme}} Alignment** — How this maps to the grant scheme's priorities{{/if}}

### RANKING & RECOMMENDATION

| Rank | Title # | Novelty (1-5) | Feasibility (1-5) | Impact (1-5) | Overall |
|------|---------|---------------|--------------------|--------------| --------|
| 1 | [#] | [score] | [score] | [score] | [avg] |
| ... | ... | ... | ... | ... | ... |

**Primary Recommendation:** Title [#]
[2-3 sentence justification]

**Alternative if Constraints Exist:** Title [#]
[Brief rationale]

---

## OUTPUT FORMAT
Structure your response as a clear markdown document with data-driven insights. Include tables for comparative analysis. Reference specific publications from the curated titles wherever possible.`,
};
