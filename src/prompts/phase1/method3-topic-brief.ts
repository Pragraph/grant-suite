import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method3-topic-brief",
  phase: 1,
  step: 1,
  name: "Research Topic Brief — Direction Analysis",
  description:
    "Analyze a user-provided research topic, questions, and gap justification to produce a structured Research Direction Brief with feasibility, novelty, and refinement recommendations.",
  requiredInputs: [
    "discipline",
    "areaOfInterest",
    "researchType",
    "researchTopic",
    "researchQuestions",
    "gapJustification",
    "keyReferences",
  ],
  optionalInputs: ["proposedMethodology", "country", "careerStage", "grantScheme"],
  outputName: "Method3_Research_Direction_Brief.md",
  epTags: ["EP-01"],
  estimatedWords: 3000,
  template: `You are an experienced research strategist who evaluates researcher-proposed topics and transforms them into structured, fundable research direction briefs. Your job is NOT to agree with the user. Your job is to stress-test, refine, and strengthen their direction.

## RESEARCHER-PROVIDED INPUTS

- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
- **Proposed Topic/Title:** {{researchTopic}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

### Research Questions
{{researchQuestions}}

### Gap Justification (researcher's own words)
{{gapJustification}}

{{#if proposedMethodology}}
### Proposed Methodology
{{proposedMethodology}}
{{/if}}

### Key References Provided
{{keyReferences}}

{{#if grantScheme}}
## GRANT SCHEME CONTEXT
When evaluating feasibility and funding fit, factor in the priorities of the {{grantScheme}} scheme:
- For MOHE grants (FRGS, PRGS, TRGS, LRGS, PPRN): evaluate alignment with Malaysian national research priority areas and the 13th Malaysia Plan (RMKe-13)
- For FRGS: the direction must support fundamental research with a clear novelty claim
- For PRGS: the direction should show prototype or product potential with TRL progression
- For TRGS/LRGS: evaluate whether the topic benefits from multi-disciplinary or multi-institutional collaboration
- For international grants: evaluate international collaboration potential and global relevance
{{/if}}

---

## INSTRUCTIONS

Produce a **Research Direction Brief** covering these sections. Be direct and critical where warranted. Do not inflate weak justifications.

### Stage 1: Topic and Question Analysis

1. **Topic Clarity Assessment:** Is the proposed topic specific enough to be researchable, or is it too broad, too narrow, or poorly scoped? State your assessment clearly.
2. **Research Question Evaluation:** For each RQ, assess: Is it answerable? Is it novel? Is it appropriately scoped for the stated research type ({{researchType}})? Suggest refined versions if needed.
3. **Coherence Check:** Do the RQs logically follow from the stated topic and gap? Flag any misalignment.

### Stage 2: Gap Justification Evaluation

1. **Gap Validity:** Based on the references provided, does the stated gap hold? Is the evidence sufficient, or is the researcher overstating the gap?
2. **Gap Categorisation:** Classify the gap type(s): Methodology Gap, Context Gap, Population Gap, Measurement Gap, Mechanism Gap, Theory Gap, Longitudinal Gap, Intervention Gap, or other.
3. **Gap Strength Rating:** Rate the gap strength as Strong (well-supported, clearly unresolved), Moderate (partially supported, needs more evidence), or Weak (poorly supported or likely already addressed).
4. **Missing Evidence:** Identify any obvious literature the researcher may have missed that could strengthen or undermine their claim.

### Stage 3: Feasibility Assessment

| Criterion | Assessment | Notes |
|-----------|-----------|-------|
| Design fit for {{researchType}} | ✓ / △ / ✗ | |
| Data/resource requirements | Low / Medium / High | |
| Ethical considerations | Low / Medium / High | |
| Timeline feasibility | Realistic / Ambitious / Unrealistic | |
| Verdict | PURSUE / MODIFY / RECONSIDER | |

### Stage 4: Novelty Assessment

1. Based on the references provided and your knowledge of the field, how novel is this direction?
2. What is the most likely prior work that overlaps with this proposal?
3. Suggest 2–3 Google Scholar search strings the researcher should use to validate novelty.

### Stage 5: Refined Research Direction

Produce a refined version of the research direction including:

- **Refined Topic Title:** (improved if needed, keep original if already strong)
- **Core Research Question:** (the single strongest RQ)
- **Supporting Questions:** (1–2 additional RQs if warranted)
- **Novelty Statement:** (one paragraph)
- **Methodological Approach:** (recommended design, even if the researcher did not provide one)
- **Expected Outcomes:** (what this research would produce)
- **Funding Fit:** (which grant types this direction suits)

### Stage 6: Weaknesses and Recommendations

1. List the top 3 weaknesses or risks in the current proposal direction.
2. For each weakness, provide a specific mitigation strategy.
3. Identify the single most important thing the researcher should do next to strengthen this direction.

### Citation Trail

List all references the researcher provided, plus any additional references you recommend they review. Use APA format.

---

## OUTPUT FORMAT

Use markdown with clear headings matching the stages above. Be structured, critical, and actionable. The researcher needs honest evaluation, not encouragement.`,
};
