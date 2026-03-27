import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase2.step2-competitive",
  phase: 2,
  step: 2,
  name: "Competitive Landscape Analysis",
  description:
    "Analyze the competitive landscape to identify positioning opportunities and differentiation strategies.",
  requiredInputs: ["discipline", "grantName"],
  optionalInputs: [
    "careerStage",
    "country",
    "Grant_Intelligence.md",
    "Requirements_Analysis.md",
  ],
  outputName: "Competitive_Analysis.md",
  epTags: ["EP-04", "EP-06", "EP-08"],
  estimatedWords: 3000,
  template: `You are a competitive intelligence analyst specializing in research funding. Your task is to map the competitive landscape for this grant and identify strategic positioning opportunities that will differentiate this application.

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

## INSTRUCTIONS

Produce a Competitive Landscape Analysis covering:

---

### 1. Applicant Pool Profile (EP-06)
Based on the grant's scope, typical applicants, and funding history:
- **Estimated number of applicants** per cycle and success rate
- **Typical applicant profile** — career stage, institutional prestige, publication record
- **Geographic distribution** of typical applicants
- **Disciplinary spread** — is competition primarily within-discipline or cross-disciplinary?
- **Trend analysis** — are applications increasing? Is the funder shifting priorities?

### 2. Competitor Archetype Analysis
Define 3-4 competitor archetypes the researcher is likely competing against:

For each archetype:
| Archetype | Typical Profile | Strengths | Weaknesses | Frequency |
|-----------|-----------------|-----------|------------|-----------|

- **The Established Star** — senior researcher with extensive track record
- **The Rising Methodologist** — mid-career with cutting-edge methods
- **The Impact Champion** — researcher with strong societal/policy connections
- **The Interdisciplinary Innovator** — researcher bridging multiple fields

### 3. Differentiation Opportunities (EP-04)
Identify specific ways to stand out from the competition:
- **Unique angle** — what perspective or approach is underrepresented in this funding space?
- **Methodological edge** — what techniques or approaches are novel for this context?
- **Impact framing** — what impact narrative would be distinctive?
- **Collaboration advantage** — what partnerships would signal unique capacity?
- **Timeliness** — what makes this research particularly urgent or timely right now?

For each opportunity, rate:
- **Distinctiveness** (high/medium/low) — how unique is this among likely applicants?
- **Credibility** (high/medium/low) — can the researcher convincingly claim this?
- **Funder appeal** (high/medium/low) — does the funder care about this?

### 4. Past Award Analysis (EP-08)
Analyze patterns in previously funded projects (where information is available):
- **Common themes** in successful proposals
- **Methodological approaches** that received funding
- **Impact framings** that resonated with evaluators
- **Team compositions** of successful projects
- **Budget patterns** — typical award sizes and allocations
- **What was NOT funded** — patterns in unsuccessful themes or approaches

### 5. White Space Mapping
Identify strategic "white spaces" — areas of opportunity where:
- Funder priorities exist but few applicants address them
- Emerging topics align with funder direction but aren't yet crowded
- Cross-disciplinary intersections create unique positioning
- Policy or societal shifts create new relevance for certain research areas

### 6. Positioning Strategy Recommendations
Based on the analysis, recommend the top 3 positioning strategies:

For each strategy:
- **Strategy name** — a concise label
- **Core narrative** — the main argument in 2-3 sentences
- **Key differentiators** — what makes this positioning unique
- **Supporting evidence needed** — what the researcher needs to demonstrate
- **Risk assessment** — potential downsides of this positioning
- **Recommended priority** — primary / secondary / backup

---

## OUTPUT FORMAT
Structure as a markdown document titled "# Competitive Landscape Analysis: [Grant Name]". Begin with a 3-sentence executive summary of the competitive landscape and the strongest positioning opportunity. Use tables and visual formatting throughout.

**CRITICAL:** Where competitive data is based on inference rather than confirmed data, mark with [ESTIMATED] tags.`,
};
