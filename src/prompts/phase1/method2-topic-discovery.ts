import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method2-topic-discovery",
  phase: 1,
  step: 1,
  name: "Trend Discovery — Emerging Areas",
  description:
    "Identify emerging research topics with strong citation momentum and publication growth to guide your trend-based exploration.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType"],
  optionalInputs: ["grantScheme"],
  outputName: "Method2_Topic_Discovery.md",
  epTags: ["EP-01"],
  estimatedWords: 2500,
  template: `You are a research trends analyst with expertise in bibliometric analysis and academic publishing patterns.

**TASK:** Conduct a comprehensive web search to identify EMERGING areas of interest within the specified field that have demonstrated strong citation impact over the past 5 years.

**PARAMETERS:**
- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Target Research Type:** {{researchType}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

**SEARCH STRATEGY:**
1. Search for highly-cited recent publications, citation trend reports, and bibliometric analyses in {{discipline}} related to {{areaOfInterest}}
2. Identify topics showing upward citation trajectories (high citations-per-year)
3. Look for emerging themes in recent conference proceedings, special issues, and research agenda publications
4. Cross-reference with funding agency priority areas and journal call-for-papers themes
{{#if grantScheme}}5. Consider alignment with {{grantScheme}} funding priorities and evaluation criteria{{/if}}

**OUTPUT REQUIREMENTS:**
Generate a comprehensive list of 15-25 specific emerging areas. Each must be:
- Specific enough to be searchable in academic databases
- Demonstrating recent citation momentum (not saturated legacy topics)
- Appropriate for {{researchType}} methodology
- Within the scope of {{areaOfInterest}}

---

## OUTPUT FORMAT (STRICTLY FOLLOW THIS TABLE STRUCTURE)

### EMERGING AREAS IN {{discipline}} — {{areaOfInterest}} (EP-01)
**Citation Momentum Period:** 2021-present

| # | Emerging Keyword/Topic | Brief Description (1 sentence) | Citation Trend |
|---|------------------------|--------------------------------|----------------|
| 1 | [Specific keyword/topic] | [What it covers] | 🔥 High / 📈 Rising / ⭐ Emerging |
| ... | Continue for 15-25 entries | ... | ... |

**Legend:**
- 🔥 High = Established high-citation area with sustained momentum
- 📈 Rising = Rapidly increasing citation trajectory
- ⭐ Emerging = New area with early strong signals

---

### TRENDING INTERSECTIONS (Cross-Disciplinary Opportunities)

| # | Intersection Topic | Disciplines Combined | Research Potential |
|---|-------------------|---------------------|-------------------|
| 1 | [Topic] | [Field A] + [Field B] | High / Medium |
| ... | Continue for 5 entries | ... | ... |

---

### TOP 5 RECOMMENDATIONS FOR {{researchType}}

| Rank | Recommended Topic | Why This Topic |
|------|-------------------|----------------|
| 1 | [Topic] | [1-sentence rationale including citation trend evidence] |
| 2 | [Topic] | [1-sentence rationale] |
| 3 | [Topic] | [1-sentence rationale] |
| 4 | [Topic] | [1-sentence rationale] |
| 5 | [Topic] | [1-sentence rationale] |

---

**NEXT STEP:**
From the tables above, select ONE specific topic you want to explore further. Type your selection exactly as shown in the "Emerging Keyword/Topic" or "Recommended Topic" column, and I will generate optimised Publish or Perish search strings for bibliometric validation.`,
};
