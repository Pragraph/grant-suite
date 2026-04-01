import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method2-search-strings",
  phase: 1,
  step: 1,
  name: "Trend Discovery — PoP Search Strings",
  description:
    "Generate optimised Boolean search strings for Publish or Perish based on the user's selected topic.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType", "selectedTrendTopic"],
  optionalInputs: ["grantScheme"],
  outputName: "Method2_Search_Strings.md",
  epTags: ["EP-01"],
  estimatedWords: 1500,
  template: `Based on the user's selected topic: **{{selectedTrendTopic}}**

**CONTEXT:**
- Field/Discipline: {{discipline}}
- Area of Interest: {{areaOfInterest}}
- Target Research Type: {{researchType}}
{{#if grantScheme}}- Target Grant Scheme: {{grantScheme}}{{/if}}

**TASK:**
Generate optimised Boolean search strings for Publish or Perish (Google Scholar). Based on extensive testing, the following rules produce the best results:

**CRITICAL RULES FOR PUBLISH OR PERISH:**
1. Title Words field: Use maximum ONE \`AND\` operator (or none)
2. Multiple \`AND\` operators = zero or near-zero results
3. Keywords field: Use OR-only chains for broad context filtering
4. Exclusion operators go at the END of Title Words only

---

## OUTPUT FORMAT (FOLLOW EXACTLY)

### VALIDATED TOPIC

| Field | Value |
|-------|-------|
| Selected Topic | {{selectedTrendTopic}} |
| Status | Confirmed viable for {{researchType}} |

---

### SEARCH CONFIGURATION OPTIONS

Provide **2 options**: one for comprehensive results, one for relevant/precise results.

---

#### OPTION 1: COMPREHENSIVE RESULTS (More papers, broader scope)

**Strategy:** Core concept in Title Words (OR-only), all context terms in Keywords (OR-only)

| Field | Value (copy exactly) |
|-------|---------------------|
| **Title Words** | \`"[primary term]" OR "[variant 1]" OR "[variant 2]" OR [abbreviation] OR "[variant 3]"\` |
| **Keywords** | \`"[context term 1]" OR "[context term 2]" OR "[context term 3]" OR "[context term 4]" OR "[context term 5]"\` |

**When to use:** Initial exploration, scoping the literature

---

#### OPTION 2: RELEVANT RESULTS (Precise papers, filtered scope)

**Strategy:** Core concept + ONE secondary concept group in Title Words (single AND), minimal Keywords

| Field | Value (copy exactly) |
|-------|---------------------|
| **Title Words** | \`"[primary term]" OR "[variant 1]" OR "[variant 2]" OR [abbreviation] AND ("[secondary term 1]" OR "[secondary term 2]" OR "[secondary term 3]")\` |
| **Keywords** | \`[optional: field context]\` or leave empty |

**When to use:** Focused search, when Option 1 returns too many irrelevant papers

---

### FORMATTING RULES (CRITICAL)

1. **Title Words — Maximum ONE \`AND\`:**
   - GOOD: \`"term A" OR "term B" OR "term C"\`
   - GOOD: \`"term A" OR "term B" AND ("term C" OR "term D")\`
   - BAD: \`("A") AND ("B") AND ("C")\` — Zero results

2. **Keywords — OR-only chains:**
   - GOOD: \`"athlete" OR "sport" OR "exercise"\`
   - BAD: \`"athlete" AND "sport"\`

3. **Each string must be a SINGLE LINE** (no line breaks)
4. **Multi-word phrases in quotes:** \`"continuous glucose monitoring"\`
5. **Abbreviations without quotes:** \`CGM\` not \`"CGM"\`
6. **Do NOT include exclusion operators** — these are added automatically by the app

---

### TERMINOLOGY REFERENCE

| Concept | Primary Term | Variants/Synonyms to Include |
|---------|--------------|------------------------------|
| Core Technology/Method | [Main term] | [All variants, abbreviations, alternative names] |
| Target Population | [Main term] | [Singular, plural, related groups] |
| Application Context | [Main term] | [Related concepts] |

---

### RECOMMENDED APPROACH

1. **Start with Option 1 (Comprehensive)** to see the full scope
2. **Check result count:**
   - If >200 results → Switch to Option 2 (Relevant)
   - If 50-200 results → Good range, proceed
   - If <30 results → Broaden Keywords, check term variants
3. **Sort by Cites/Year** to identify high-impact papers

---

**NEXT STEP:**
Copy your preferred **Title Words** string into the app. Review exclusion operators will be automatically appended. Then copy the **Keywords** string. The app will also append your Field/Discipline and Area of Interest to Keywords automatically.`,
};
