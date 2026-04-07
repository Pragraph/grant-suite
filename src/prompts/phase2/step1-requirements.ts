import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase2.step1-requirements",
  phase: 2,
  step: 1,
  name: "Grant Requirements Analysis",
  description:
    "Analyze grant requirements against your profile to identify alignment strengths, gaps, and strategic positioning opportunities.",
  requiredInputs: ["discipline", "grantName"],
  optionalInputs: [
    "careerStage",
    "country",
    "cvSummary",
    "Grant_Intelligence.md",
    "grantScheme",
    "grantSubCategory",
    "Method4_Convergence_Synthesis.md",
    "Method1_Gap_Synthesis.md",
    "Method2_Trend_Discovery.md",
    "Method3_Research_Direction_Brief.md",
  ],
  outputName: "Requirements_Analysis.md",
  epTags: ["EP-01", "EP-02", "EP-04"],
  estimatedWords: 3000,
  template: `You are a grant strategy consultant who specializes in matching researcher profiles to grant requirements. Your task is to conduct a deep requirements analysis that reveals the strategic landscape for a specific grant application.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}

{{#if cvSummary}}
## RESEARCHER CV / CAREER SUMMARY
{{cvSummary}}
{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if Method4_Convergence_Synthesis.md}}
## RESEARCH DISCOVERY CONTEXT (Convergence Synthesis from Phase 1)
The following synthesizes the researcher's Gap-Based and Trend-Based Discovery outputs into a unified research direction. Use this to align requirements analysis with the researcher's established direction.
{{> Method4_Convergence_Synthesis.md}}
{{/if}}

{{#unless Method4_Convergence_Synthesis.md}}
{{#if Method1_Gap_Synthesis.md}}
## RESEARCH DISCOVERY CONTEXT (Gap-Based Discovery from Phase 1)
{{> Method1_Gap_Synthesis.md}}
{{/if}}

{{#if Method2_Trend_Discovery.md}}
## RESEARCH DISCOVERY CONTEXT (Trend-Based Discovery from Phase 1)
{{> Method2_Trend_Discovery.md}}
{{/if}}

{{#if Method3_Research_Direction_Brief.md}}
## RESEARCH DISCOVERY CONTEXT (Research Direction Brief from Phase 1)
{{> Method3_Research_Direction_Brief.md}}
{{/if}}
{{/unless}}

## INSTRUCTIONS

Produce a comprehensive Requirements Analysis covering these sections:

---

### 1. Requirements Decomposition (EP-01)
Break down every grant requirement into three categories:
- **Hard requirements** — non-negotiable eligibility criteria (e.g., career stage, institutional affiliation, nationality)
- **Soft requirements** — strongly preferred but not disqualifying (e.g., prior international collaboration, specific methodologies)
- **Implicit requirements** — unstated expectations inferred from funder priorities, past awards, and evaluation culture

For each requirement, specify:
| Requirement | Type | Source | Your Status | Gap/Action |
|-------------|------|--------|-------------|------------|

### 2. Profile–Grant Alignment Matrix (EP-02)
Map the researcher's profile against each evaluation criterion:
- **Strong alignment** — criteria where the researcher clearly excels
- **Moderate alignment** — criteria where positioning or framing can strengthen the case
- **Weak alignment** — criteria requiring creative strategy or additional evidence

For each criterion, provide a specific recommendation for how to demonstrate alignment in the proposal.

### 3. Hidden Expectations Analysis
Identify what evaluators expect but the guidelines don't explicitly state:
- Disciplinary norms for proposals in this field
- Typical track record expectations (publications, grants, supervision)
- Methodological preferences of this funder
- Impact framing preferences (societal, economic, scientific, policy)
- Collaboration expectations (interdisciplinary, international, industry)

### 4. Compliance Checklist
Create a detailed checklist of every required element:
- [ ] Document format requirements (page limits, fonts, margins)
- [ ] Required sections and their order
- [ ] Mandatory attachments (CV format, letters, data management plan)
- [ ] Budget constraints and allowable costs
- [ ] Ethical approvals or statements required
- [ ] Timeline/milestone requirements
- [ ] Any pre-submission steps (registration, letter of intent)

### 5. Strategic Gap Analysis (EP-04)
For each identified gap between the researcher's profile and grant requirements:
- **Gap description** — what's missing or weak
- **Severity** — critical / moderate / minor
- **Mitigation strategy** — specific actions to address or reframe
- **Timeline** — can this be addressed before submission?
- **Evidence needed** — what would strengthen this area

### 6. Priority Action Items
Rank the top 10 actions the researcher should take before writing the proposal, ordered by impact:
1. [Action] — [Rationale] — [Deadline/Urgency]

---

## OUTPUT FORMAT
Structure your response as a markdown document titled "# Grant Requirements Analysis: [Grant Name]". Use tables, checklists, and clear headings. Begin with a 3-sentence executive summary highlighting the strongest alignment points and the most critical gaps to address.

**CRITICAL:** Flag uncertain information with [VERIFY] tags. Flag items requiring researcher input with [USER INPUT NEEDED] tags.`,
};
