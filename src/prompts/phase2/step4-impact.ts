import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase2.step4-impact",
  phase: 2,
  step: 4,
  name: "Impact Maximization Framework",
  description:
    "Design a multi-dimensional impact framework that demonstrates how the research creates value across scientific, societal, economic, and policy dimensions.",
  requiredInputs: ["discipline", "grantName"],
  optionalInputs: [
    "careerStage",
    "country",
    "Grant_Intelligence.md",
    "Requirements_Analysis.md",
    "Competitive_Analysis.md",
    "Evaluator_Psychology.md",
    "grantScheme",
  ],
  outputName: "Impact_Framework.md",
  epTags: ["EP-04", "EP-07", "EP-10"],
  estimatedWords: 3500,
  template: `You are an impact strategist who helps researchers design compelling, multi-dimensional impact narratives for grant proposals. Your task is to create a comprehensive Impact Maximization Framework that transforms research outcomes into a powerful impact story.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Requirements_Analysis.md}}
## REQUIREMENTS ANALYSIS (from Phase 2, Step 1)
{{> Requirements_Analysis.md}}
{{/if}}

{{#if Competitive_Analysis.md}}
## COMPETITIVE ANALYSIS (from Phase 2, Step 2)
{{> Competitive_Analysis.md}}
{{/if}}

{{#if Evaluator_Psychology.md}}
## EVALUATOR PSYCHOLOGY (from Phase 2, Step 3)
{{> Evaluator_Psychology.md}}
{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if grantScheme}}
## MALAYSIAN IMPACT FRAMING
For MOHE grants, frame impact using these dimensions that Malaysian evaluators specifically look for:
- **National Development Contribution:** Alignment with RMKe-13 (13th Malaysia Plan, 2026–2030) thrusts and Madani Economy priorities
- **Capacity Building:** Number of postgraduates trained (PhD, Masters), skills transferred
- **Publication Outputs:** Target journals with impact factor and quartile (Q1/Q2 Scopus-indexed preferred)
- **Commercialisation Potential:** For PRGS — TRL advancement, patents, licensing
- **Community/Industry Impact:** Tangible benefits to Malaysian society or industry partners
- **International Visibility:** How the research positions Malaysia in the global research landscape
{{/if}}

## INSTRUCTIONS

Produce an Impact Maximization Framework with these sections:

---

### 1. Impact Dimension Mapping (EP-07)
Map potential impacts across all relevant dimensions:

| Dimension | Impact Description | Timeframe | Beneficiaries | Evidence Pathway | Funder Priority Alignment |
|-----------|-------------------|-----------|---------------|------------------|--------------------------|
| Scientific | [Specific scientific advance] | Short/Medium/Long | [Who benefits] | [How to demonstrate] | High/Medium/Low |
| Technological | [Technology/method development] | | | | |
| Societal | [Social benefit] | | | | |
| Economic | [Economic value created] | | | | |
| Policy | [Policy influence] | | | | |
| Educational | [Training/capacity building] | | | | |
| Environmental | [Environmental benefit] | | | | |
| Health | [Health outcomes] | | | | |

Not all dimensions apply to every project — focus on the 4-5 most relevant and compelling.

### 2. Impact Pathway Design (EP-04)
For each primary impact dimension, design a clear pathway:

**Impact Pathway: [Dimension Name]**
1. **Research outputs** → What the project directly produces
2. **Immediate outcomes** → First-order effects (within project period)
3. **Medium-term impacts** → Second-order effects (1-3 years post-project)
4. **Long-term transformation** → Systemic change (5+ years)
5. **Evidence strategy** → How to demonstrate progress along this pathway

Create a narrative that makes impact feel *inevitable* rather than aspirational.

### 3. Stakeholder Impact Map
Identify all stakeholders who benefit from this research:

| Stakeholder | How They Benefit | Engagement Strategy | Evidence of Need |
|-------------|-----------------|---------------------|------------------|

Include: academic community, practitioners, policymakers, industry, public, students/trainees, international community.

### 4. Funder-Specific Impact Framing (EP-04, EP-10)
Based on the grant intelligence, customize the impact narrative to align with this specific funder's priorities:
- **Funder's stated impact goals** — direct quotes or paraphrases from guidelines
- **How each impact aligns** — explicit mapping of your impacts to their goals
- **Language mirroring** — use the funder's own terminology for impact categories
- **Strategic emphasis** — which impacts to lead with based on funder priorities

### 5. Impact Quantification Framework
Where possible, attach numbers to impacts:
- **Direct outputs** — number of publications, datasets, tools, trained researchers
- **Reach metrics** — populations affected, geographic scope, sector penetration
- **Economic value** — cost savings, efficiency gains, market potential
- **Timeliness metrics** — how quickly impacts begin to materialize
- **Comparison benchmarks** — how these numbers compare to typical funded projects

Use ranges where exact numbers aren't possible: "This research has the potential to affect [X-Y] practitioners in [field] within [N] years of completion."

### 6. Impact Narrative Templates
Provide 3 draft impact narrative paragraphs that can be adapted for different proposal sections:

**Short version (50 words)** — for abstracts and summaries
**Medium version (150 words)** — for impact sections
**Extended version (300 words)** — for detailed impact descriptions

Each version should:
- Lead with the most compelling impact
- Use concrete, specific language
- Deploy loss-framing where appropriate
- Connect to funder priorities explicitly

### 7. Risk-to-Impact Mitigation
Address how impacts will be achieved even if the research encounters challenges:
- **If primary hypothesis is not supported** — what impacts remain?
- **If timeline is delayed** — what intermediate impacts are still delivered?
- **If scope must be reduced** — what is the minimum viable impact?

This section reassures evaluators that funding this project is a "safe bet" for impact.

---

## OUTPUT FORMAT
Structure as a markdown document titled "# Impact Maximization Framework: [Grant Name]". Begin with a compelling 3-sentence impact summary that could serve as an elevator pitch. Use tables, numbered pathways, and clear formatting throughout.`,
};
