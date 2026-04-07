import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.method3-topic-brief",
  phase: 1,
  step: 1,
  name: "Research Direction Brief",
  description:
    "Analyze a user-provided research topic, objectives, questions, and gap justification to produce a structured Research Direction Brief with feasibility, novelty, and refinement recommendations.",
  requiredInputs: [
    "discipline",
    "areaOfInterest",
    "researchType",
    "researchTopic",
    "researchObjectives",
    "researchQuestions",
    "gapJustification",
    "keyReferences",
  ],
  optionalInputs: [
    "targetPopulation",
    "theoreticalFramework",
    "proposedMethodology",
    "expectedOutcomes",
    "studyScope",
    "country",
    "careerStage",
    "grantScheme",
    "grantSubCategory",
    "method1_output",
    "method2_output",
    "method4_output",
  ],
  outputName: "Method3_Research_Direction_Brief.md",
  epTags: ["EP-01"],
  estimatedWords: 3500,
  template: `You are an experienced research strategist who evaluates researcher-proposed topics and transforms them into structured, fundable research direction briefs. Your job is NOT to agree with the user. Your job is to stress-test, refine, and strengthen their direction.

## RESEARCHER-PROVIDED INPUTS

- **Field/Discipline:** {{discipline}}
- **Area of Interest:** {{areaOfInterest}}
- **Research Type:** {{researchType}}
- **Proposed Topic/Title:** {{researchTopic}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

### Research Objectives
{{researchObjectives}}

### Research Questions
{{researchQuestions}}

### Gap Justification (researcher's own words)
{{gapJustification}}

{{#if targetPopulation}}
### Target Population / Sample
{{targetPopulation}}
{{/if}}

{{#if theoreticalFramework}}
### Theoretical / Conceptual Framework
{{theoreticalFramework}}
{{/if}}

{{#if proposedMethodology}}
### Proposed Methodology
{{proposedMethodology}}
{{/if}}

{{#if expectedOutcomes}}
### Expected Outcomes
{{expectedOutcomes}}
{{/if}}

{{#if studyScope}}
### Study Scope & Boundaries
{{studyScope}}
{{/if}}

### Key References Provided
{{keyReferences}}

{{#if grantScheme}}
## GRANT SCHEME CONTEXT
When evaluating feasibility and funding fit, factor in the priorities of the {{grantScheme}} scheme:
- For MOHE grants (FRGS, PRGS, TRGS, LRGS, PPRN): evaluate alignment with Malaysian national research priority areas and the 13th Malaysia Plan (RMKe-13)
- For FRGS: the direction must support fundamental research with a clear novelty claim and a strong theoretical/conceptual framework
- For PRGS: the direction should show prototype or product potential with TRL progression
- For TRGS/LRGS: evaluate whether the topic benefits from multi-disciplinary or multi-institutional collaboration
- For international grants: evaluate international collaboration potential and global relevance
- For GET (Exploratory): the direction must explore new knowledge — generating hypotheses, conceptual frameworks, or basic understanding. TRL target is 1-2. It should NOT be a prototype or product development project (those belong in PRGS).
- For GET (Transformative): the direction must propose radical change to existing policies, SOPs, processes, or systems with a clear proof-of-concept pathway. TRL target is 2-3. Must have clear beneficiaries and measurable impact.
- For GET (both types): industry collaboration is mandatory — the direction should be relevant to industry/agency partners. Patent search is mandatory. Minimum 1 IP filing required.
{{/if}}

{{#if method4_output}}
## PRIOR DISCOVERY CONTEXT (Convergence Synthesis)
The researcher completed a convergence synthesis combining gap-based and trend-based discovery. Use this as context when evaluating their proposed direction. If the proposed topic aligns with a direction identified here, note the alignment. If it diverges, flag the discrepancy.
{{method4_output}}
{{/if}}

{{#unless method4_output}}
{{#if method1_output}}
## PRIOR DISCOVERY CONTEXT (Gap-Based Discovery)
The researcher completed gap-based discovery. Use this as context when evaluating alignment.
{{method1_output}}
{{/if}}

{{#if method2_output}}
## PRIOR DISCOVERY CONTEXT (Trend-Based Discovery)
The researcher completed trend-based discovery. Use this as context when evaluating alignment.
{{method2_output}}
{{/if}}
{{/unless}}

---

## INSTRUCTIONS

Produce a **Research Direction Brief** covering these stages. Be direct and critical where warranted. Do not inflate weak justifications.

{{#if grantScheme}}
### Stage 0: Topic Fitness Check

**This stage is critical and must be completed before all other stages.**

Evaluate whether the proposed research topic is appropriate for the {{grantScheme}} scheme:

If the target grant scheme is **FRGS**:

**FRGS Fundamental Research Requirement:**
FRGS strictly funds fundamental research — the generation of new theories, concepts, models, or principles that advance the boundaries of knowledge. It does NOT fund:
- Applied research (developing tools, products, systems, apps, or diagnostic kits)
- Clinical trials or intervention effectiveness studies
- Technology development or prototype creation (these belong in PRGS)
- Purely descriptive or survey-based studies with no theoretical contribution

**Test the proposed topic:** Does it aim to UNDERSTAND a phenomenon (fundamental) or to DEVELOP/TEST a solution (applied)?

If the topic leans applied, you MUST:
1. Flag this clearly as a **CRITICAL ISSUE** at the top of your response
2. Explain why it would likely be rejected by the FRGS evaluation panel
3. Provide a "fundamental pivot" — reframe the topic to focus on underlying mechanisms, theoretical models, or conceptual frameworks rather than practical applications
4. Suggest a revised title using the T3M formula: [METHOD of investigation] + [MATTER being studied] + [MEANING — the theoretical contribution]

Example of an applied title that would be rejected:
"Development of an AI-Based Early Detection System for Gestational Diabetes"

Example of the same idea reframed as fundamental:
"Elucidating Host-Microbiome Metabolic Interactions to Establish a Theoretical Model for Insulin Resistance in Gestational Diabetes"

The key shift: from "building a tool" to "understanding a mechanism to generate new theory."

If the target grant scheme is **PRGS**:

**PRGS Prototype Requirement:**
PRGS funds prototype development and proof-of-concept research. The topic must demonstrate:
- A clear path from fundamental findings to a working prototype
- TRL progression (typically from TRL 3-4 to TRL 5-6)
- Evidence of prior fundamental work (ideally an FRGS completion or equivalent)

If the topic has no prototype or product outcome, flag this as a concern and suggest how to reframe it.

If the target grant scheme is **GET**:

The selected GET sub-category is **{{grantSubCategory}}**.

**GET Exploratory Requirement:**
GET Exploratory funds research that explores new knowledge to understand problems or phenomena that are not yet well understood. Target TRL is 1-2. Acceptable outputs: new hypotheses, conceptual frameworks, basic understanding, or new theories. It does NOT fund:
- Product development or prototype creation (belongs in PRGS)
- Pure replication studies with no theoretical contribution
- Studies that only describe without generating new conceptual understanding

**Test the proposed topic:** Does it aim to EXPLORE and UNDERSTAND (Exploratory) or to CHANGE and PROVE (Transformative)?

If the topic is tagged as Exploratory but proposes developing a product, system, or intervention, flag this as a **CRITICAL ISSUE** and suggest either:
1. Reframe as a genuine exploration (focus on understanding the phenomenon before building solutions)
2. Switch to Transformative sub-category if the topic proposes radical change with proof of concept

**GET Transformative Requirement:**
GET Transformative funds research that creates radical change to existing policies, SOPs, processes, or systems. Target TRL is 2-3. Must demonstrate:
- Clear path from current state to transformed state
- Identifiable beneficiaries (government, industry, community, schools, NGOs)
- Proof of concept as a key deliverable
- Measurable impact on the target system/policy/process

If the topic has no clear transformation target or no identifiable beneficiaries, flag this as a concern and suggest how to reframe it.

**For both GET types:**
- Industry collaboration is mandatory — does the proposed direction lend itself to meaningful industry/agency partnership?
- Patent search is mandatory — does the research direction have potential for intellectual property?
- ROV (Return of Value) is mandatory — can the researcher articulate a clear return on investment?
{{/if}}

### Stage 1: Topic and Question Analysis

1. **Topic Clarity Assessment:** Is the proposed topic specific enough to be researchable, or is it too broad, too narrow, or poorly scoped? State your assessment clearly.
2. **Research Question Evaluation:** For each RQ, assess: Is it answerable? Is it novel? Is it appropriately scoped for the stated research type ({{researchType}})? Suggest refined versions if needed.
3. **Coherence Check:** Do the RQs logically follow from the stated topic and gap? Flag any misalignment.

### Stage 2: Objectives Assessment

1. **Objective Quality:** For each stated objective, evaluate: Is it specific? Is it measurable? Is it achievable within a typical grant timeline (2–3 years)?
2. **Objective-Question Alignment:** Do the objectives map cleanly to the research questions? Flag any objectives without a corresponding RQ, or vice versa.
3. **Scope Calibration:** Are the objectives collectively too ambitious, too modest, or well-calibrated for the stated research type and likely grant size?
4. **Refined Objectives:** If any objectives need improvement, provide refined wording.

### Stage 3: Gap Justification Evaluation

1. **Gap Validity:** Based on the references provided, does the stated gap hold? Is the evidence sufficient, or is the researcher overstating the gap?
2. **Gap Categorisation:** Classify the gap type(s): Methodology Gap, Context Gap, Population Gap, Measurement Gap, Mechanism Gap, Theory Gap, Longitudinal Gap, Intervention Gap, or other.
3. **Gap Strength Rating:** Rate the gap strength as Strong (well-supported, clearly unresolved), Moderate (partially supported, needs more evidence), or Weak (poorly supported or likely already addressed).
4. **Missing Evidence:** Identify any obvious literature the researcher may have missed that could strengthen or undermine their claim.

### Stage 4: Feasibility Assessment

| Criterion | Assessment | Notes |
|-----------|-----------|-------|
| Design fit for {{researchType}} | ✓ / △ / ✗ | |
| Data/resource requirements | Low / Medium / High | |
| Ethical considerations | Low / Medium / High | |
| Timeline feasibility | Realistic / Ambitious / Unrealistic | |
| Population accessibility | Accessible / Moderate / Difficult | |
| Framework appropriateness | Strong / Adequate / Weak / Not provided | |
| Verdict | PURSUE / MODIFY / RECONSIDER | |

### Stage 5: Novelty Assessment

1. Based on the references provided and your knowledge of the field, how novel is this direction?
2. What is the most likely prior work that overlaps with this proposal?
3. Suggest 2–3 Google Scholar search strings the researcher should use to validate novelty.

### Stage 6: Refined Research Direction

Produce a refined version of the research direction including:

- **Refined Topic Title:** (improved if needed, keep original if already strong)
{{#if grantScheme}}
  For MOHE grants, apply the T3M title formula where appropriate:
  - **Method** — the research approach (e.g., "Elucidating," "Characterizing," "Modeling")
  - **Matter** — the specific subject (e.g., "Host-Microbiome Metabolic Interactions")
  - **Meaning** — the theoretical contribution (e.g., "Towards a New Theoretical Model of...")
  A strong FRGS title signals fundamental investigation, not applied development.
  For GET specifically:
  - Exploratory titles should signal investigation and understanding: "Exploring...", "Investigating...", "Understanding...", "Characterizing..."
  - Transformative titles should signal change and impact: "Transforming...", "Redesigning...", "Reengineering...", "Innovating..."
  - Both types benefit from the T3M formula but Transformative titles should also hint at the system/policy being changed.
{{/if}}
- **Core Research Question:** (the single strongest RQ)
- **Supporting Questions:** (1–2 additional RQs if warranted)
- **Research Objectives:** (refined list of 2–4 measurable objectives)
- **Novelty Statement:** (one paragraph)
- **Theoretical/Conceptual Framework:** (recommended framework if not provided, or evaluation of stated framework)
- **Target Population:** (confirmed or recommended if not provided)
- **Methodological Approach:** (recommended design, even if the researcher did not provide one)
- **Expected Outcomes:** (confirmed deliverables or recommended if not provided)
- **Study Scope:** (confirmed boundaries or recommended if not provided)
- **Funding Fit:** (which grant types this direction suits)

### Stage 7: Weaknesses and Recommendations

1. List the top 3 weaknesses or risks in the current proposal direction.
2. For each weakness, provide a specific mitigation strategy.
3. Identify the single most important thing the researcher should do next to strengthen this direction.

### Citation Trail

List all references the researcher provided, plus any additional references you recommend they review. Use APA format.

---

## OUTPUT FORMAT

Use markdown with clear headings matching the stages above. Be structured, critical, and actionable. The researcher needs honest evaluation, not encouragement.`,
};
