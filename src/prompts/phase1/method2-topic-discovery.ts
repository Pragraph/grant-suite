import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method2-topic-discovery",
  phase: 1,
  step: 1,
  name: "Trend Discovery — Emerging Areas",
  description:
    "Identify emerging research topics with strong citation momentum and publication growth to guide your trend-based exploration.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType"],
  optionalInputs: ["grantScheme", "grantSubCategory", "country", "targetFunder"],
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
{{#if grantSubCategory}}- **Grant Sub-Category:** {{grantSubCategory}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if targetFunder}}- **Funder:** {{targetFunder}}{{/if}}

{{#if grantScheme}}
## GRANT SCHEME ALIGNMENT FILTER

You MUST factor the following grant scheme context into your analysis. Topics that do not align with these requirements will score poorly and should be ranked lower or excluded.

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

**Instruction:** When generating the emerging areas table and ranking recommendations, explicitly note which topics have strong alignment with the scheme requirements above. In the Top 5 Recommendations table, add a column or note indicating grant-scheme fit.
{{/if}}

**SEARCH STRATEGY:**
1. Search for highly-cited recent publications, citation trend reports, and bibliometric analyses in {{discipline}} related to {{areaOfInterest}}
2. Identify topics showing upward citation trajectories (high citations-per-year)
3. Look for emerging themes in recent conference proceedings, special issues, and research agenda publications
4. Cross-reference with funding agency priority areas and journal call-for-papers themes
{{#if grantScheme}}5. Consider alignment with {{grantScheme}} funding priorities and evaluation criteria{{/if}}

**OUTPUT REQUIREMENTS:**
Generate a focused list of 10-15 specific emerging areas. Each must be:
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
| ... | Continue for 5 entries | ... | ... |

---

### TOP 5 RECOMMENDATIONS FOR {{researchType}}

| Rank | Recommended Topic | Why This Topic | Grant Fit |
|------|-------------------|----------------|-----------|
| 1 | [Topic] | [1-sentence rationale including citation trend evidence] | |
| 2 | [Topic] | [1-sentence rationale] | |
| 3 | [Topic] | [1-sentence rationale] | |
| 4 | [Topic] | [1-sentence rationale] | |
| 5 | [Topic] | [1-sentence rationale] | |

{{#if grantScheme}}**Grant Fit** column: Rate as ★★★ (strong alignment), ★★ (moderate), or ★ (weak) based on how well the topic meets the grant scheme requirements described above.{{/if}}

---

**NEXT STEP FOR THE USER:**
1. Select ONE specific topic from the tables above that you want to explore further.
2. Go back to the Research Grant Suite app and proceed to the next step in the wizard.
3. Paste your selected topic exactly as shown in the "Emerging Keyword/Topic" or "Recommended Topic" column.
4. The app will generate a search string prompt for you — copy it and paste it back into this same AI chat to get your bibliometric search strings.`,
};
