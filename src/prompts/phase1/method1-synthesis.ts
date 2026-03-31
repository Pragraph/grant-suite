import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method1-gap-synthesis",
  phase: 1,
  step: 1,
  name: "Gap-Based Discovery — Synthesis & Direction",
  description:
    "Synthesize expert-identified research gaps from Scholar Labs into feasible, fundable research directions with full citation trails.",
  requiredInputs: ["discipline", "areaOfInterest", "researchType", "selectedTopic", "collectedGapsWithCitations_formatted"],
  optionalInputs: ["grantScheme"],
  outputName: "Method1_Gap_Synthesis.md",
  epTags: ["EP-01"],
  estimatedWords: 3000,
  template: `You are an experienced {{discipline}} research strategist with expertise in synthesizing research gaps from systematic reviews and meta-analyses into novel, impactful, and feasible research directions.

## CONTEXT & INPUTS

- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
- **Selected Topic:** {{selectedTopic}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

**Source of Gaps:** The following research gaps and future study recommendations were extracted from recent systematic reviews and meta-analyses identified via Google Scholar Labs. Each gap includes its source citation.

**Expert-Identified Research Gaps with Citations:**
{{collectedGapsWithCitations_formatted}}

---

## STAGE 1: GAP ANALYSIS & CLUSTERING (EP-01)

### 1.1 — Gap Categorisation
Categorise each gap into one or more of these types:
- **Population Gap** — Understudied groups or demographics
- **Methodology Gap** — Need for different research designs or measurement approaches
- **Context Gap** — Understudied settings, regions, or conditions
- **Mechanism Gap** — Unknown underlying processes or pathways
- **Intervention Gap** — Untested treatments, protocols, or strategies
- **Measurement Gap** — Need for validated tools or standardised definitions
- **Longitudinal Gap** — Need for time-based or follow-up studies

### 1.2 — Priority Assessment
For each gap, assess:
| Gap (with source) | Category | Frequency | Recency | Feasibility | Impact | Priority |
Score feasibility, impact 1–5. Priority = High / Medium / Low.

### 1.3 — Top 3 Priority Gaps
For each, explain: What is the gap? Why is it high priority? Which source citations support it?

---

## STAGE 2: FEASIBILITY SCREENING

For each priority gap:
| Priority Gap | Design Fit for {{researchType}}? | Data/Resources Needed | Ethical Considerations | Verdict |
Use: ✓/✗ for design fit. 🟢/🟡/🔴 for resources and ethics. Verdict = PURSUE / MODIFY / SKIP.

---

## STAGE 3: RESEARCH DIRECTION SYNTHESIS

For each viable direction (generate 3–5 directions):

**Direction [N]: [Title]**
- **Core Research Question** — Specific, testable question
- **Gaps Addressed** — Which gaps from the input (cite source papers)
- **Novelty Statement** — What makes this direction original
- **Methodological Approach** — Suitable for {{researchType}}
- **Expected Outcomes** — What success looks like
- **Funding Fit** — Which types of grants this suits
{{#if grantScheme}}- **{{grantScheme}} Alignment** — How this direction maps to {{grantScheme}} evaluation criteria{{/if}}
- **Key Source Papers** — The citations that validate this direction

---

## STAGE 4: RANKING & RECOMMENDATION

| Rank | Direction | Gap Alignment (1–5) | Feasibility (1–5) | Impact (1–5) | Funding Fit (1–5) | Overall |
|------|-----------|---------------------|--------------------|--------------|--------------------|---------|

**Primary Recommendation:** Direction [N]
[2–3 sentence justification referencing source papers]

**Alternative Recommendation:** Direction [N]
[Brief rationale]

---

## CITATION TRAIL

List all source papers referenced in this analysis:
1. [APA citation from input]
2. [APA citation from input]
...

---

## NEXT STEPS
For the top-ranked direction:
1. Validate novelty — search Google Scholar for the proposed title
2. Key literature to review (5–10 papers, including the source citations above)
3. Potential collaborators based on the cited authors
4. Suitable grant programmes to target
5. Timeline estimate for proposal development

## OUTPUT FORMAT
Structure as a clear markdown document with tables, clear headings, and explicit citation references throughout. Every recommendation must trace back to a specific gap and source paper.`,
};
