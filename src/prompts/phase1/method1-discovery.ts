import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method1-gap-discovery",
  phase: 1,
  step: 1,
  name: "Topic Discovery — Emerging Areas",
  description:
    "Identify emerging research topics with strong citation momentum to guide your gap exploration.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType"],
  optionalInputs: ["grantScheme"],
  outputName: "Method1_Gap_Discovery.md",
  epTags: ["EP-01"],
  estimatedWords: 2500,
  template: `You are a research trends analyst with expertise in bibliometric analysis and academic publishing patterns.

**TASK:** Conduct a comprehensive analysis to identify EMERGING areas of interest within the specified field that have demonstrated strong citation impact over the past 5 years.

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
Generate a comprehensive list of 10-15 specific emerging areas of interest. Each must be:
- Specific enough to be searchable in academic databases
- Demonstrating recent citation momentum (not saturated legacy topics)
- Appropriate for {{researchType}} methodology
- Within the scope of {{areaOfInterest}}

---

## OUTPUT FORMAT (STRICTLY FOLLOW THIS TABLE STRUCTURE)

### EMERGING AREAS IN {{discipline}} — {{areaOfInterest}} (EP-01)
**Citation Momentum Period:** 2021–present

| # | Emerging Keyword/Topic | Brief Description (1 sentence) | Citation Trend |
|---|------------------------|--------------------------------|----------------|
| 1 | [Specific keyword/topic] | [What it covers and why it matters] | 🔥 High / 📈 Rising / ⭐ Emerging |
| 2 | ... | ... | ... |
| ... | Continue for 10-15 entries | ... | ... |

**Legend:**
- 🔥 High = Established high-citation area with sustained momentum
- 📈 Rising = Rapidly increasing citation trajectory
- ⭐ Emerging = New area with early strong signals

---

### TRENDING INTERSECTIONS (Cross-Disciplinary Opportunities)

| # | Intersection Topic | Disciplines Combined | Research Potential |
|---|-------------------|---------------------|-------------------|
| 1 | [Topic] | [Field A] + [Field B] | High / Medium |
| 2 | ... | ... | ... |
| ... | Continue for 5 entries | ... | ... |

---

### TOP 5 RECOMMENDATIONS FOR {{researchType}}

Based on the analysis, these topics offer the best combination of citation momentum, gap availability, and methodological fit:

| Rank | Recommended Topic | Why This Topic |
|------|-------------------|----------------|
| 1 | [Topic] | [1-sentence rationale including gap availability] |
| 2 | [Topic] | [1-sentence rationale] |
| 3 | [Topic] | [1-sentence rationale] |
| 4 | [Topic] | [1-sentence rationale] |
| 5 | [Topic] | [1-sentence rationale] |

---

**NEXT STEP:**
From the tables above, select and copy ONE specific topic you want to explore further. Type your selection exactly as shown in the "Emerging Keyword/Topic", "Intersection Topic", or "Top 5 Recommendations" column into the next step of the Research Grant Suite.`,
};
