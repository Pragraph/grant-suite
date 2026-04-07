import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.grant-matching",
  phase: 1,
  step: 2,
  name: "Grant Matching",
  description:
    "Identify and rank grant opportunities that best match your research profile and topic.",
  requiredInputs: ["discipline", "country"],
  optionalInputs: [
    "researchTopic",
    "careerStage",
    "budgetRange",
    "keywords",
    "grantScheme",
    "Method4_Convergence_Synthesis.md",
    "Method1_Gap_Synthesis.md",
    "Method3_Research_Direction_Brief.md",
  ],
  outputName: "Grant_Matching.md",
  epTags: ["EP-01"],
  estimatedWords: 2500,
  template: `You are a grant funding expert with encyclopedic knowledge of international research funding programs. Your task is to identify and rank the most suitable grant opportunities for the researcher's profile and proposed research.

## RESEARCHER PROFILE
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
{{#if researchTopic}}- **Research Topic/Title:** {{researchTopic}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if budgetRange}}- **Funding Range Sought:** {{budgetRange}}{{/if}}
{{#if keywords}}- **Keywords:** {{keywords}}{{/if}}

{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if grantScheme}}
## MALAYSIAN GRANT LANDSCAPE CONTEXT
If the target grant scheme is one of the MOHE competitive grants (FRGS, PRGS, TRGS, LRGS, PPRN), prioritise the following Malaysian grant databases in your search:

**Primary Malaysian Databases:**
- [MyGRANTS](https://mygrants.gov.my/) — MOHE's official grant application and management portal for all competitive research grants
- [Dimensions.ai](https://app.dimensions.ai/discover/grant) — filter by Funder = "Ministry of Higher Education, Malaysia" for funded project history
- [NIH Malaysia (NMRR)](https://www.nmrr.gov.my/) — for health/medical research grants

**Key Malaysian Funders to Include:**
- Ministry of Higher Education (MOHE) — FRGS, PRGS, TRGS, LRGS, PPRN
- Ministry of Science, Technology and Innovation (MOSTI)
- Malaysian Toray Science Foundation (MTSF)
- Academy of Sciences Malaysia (ASM)
- Yayasan Khazanah
- Cradle Fund / MTDC — for commercialisation-oriented research
- University-level internal grants (Dana Dalaman, GPUI, etc.)

**International Grants Popular with Malaysian Researchers:**
- MTSF Science & Technology Research Grant (STRG)
- Fulbright Malaysian Scholar Program
- ISPF Research Collaborations (UK–Malaysia)
- Merdeka Award Grant for International Attachment
- International Foundation for Science (IFS) Grants
- Newton Fund / British Council partnerships
- JSPS (Japan) and DAAD (Germany) bilateral programmes

When the grant scheme is a MOHE grant, frame your match scores relative to the selected scheme's requirements and evaluation criteria. Note any specific eligibility requirements (e.g., FRGS requires the PI to be a full-time academic at a Malaysian public university).
{{/if}}

{{#if Method4_Convergence_Synthesis.md}}
## RESEARCH DIRECTION CONTEXT (Convergence Synthesis from Phase 1)
{{> Method4_Convergence_Synthesis.md}}
{{/if}}

{{#if Method1_Gap_Synthesis.md}}
## GAP-BASED DISCOVERY CONTEXT
{{> Method1_Gap_Synthesis.md}}
{{/if}}

{{#if Method3_Research_Direction_Brief.md}}
## RESEARCH DIRECTION BRIEF
{{> Method3_Research_Direction_Brief.md}}
{{/if}}

## INSTRUCTIONS

### 1. Grant Opportunity Scan (EP-01)
Identify at least 10-15 grant programs that match this researcher's profile. For each grant, provide:

| # | Grant Program | Funder | Country/Region | Amount Range | Deadline Cycle | Match Score |
|---|--------------|--------|----------------|-------------|----------------|-------------|

### 2. Top 5 Detailed Analysis
For the top 5 best-matching grants, provide:
- **Grant Name & Funder** — full official name
- **Funding Amount** — range or typical award size
- **Duration** — typical project length
- **Eligibility** — key requirements (career stage, nationality, institutional affiliation)
- **Thematic Fit** — how well the research topic aligns with the grant's priorities
- **Success Rate** — if known, typical success rates or competitiveness
- **Key Dates** — application deadlines, notification periods
- **Application Components** — what documents are typically required
- **Strategic Tips** — insider knowledge about what makes applications successful
- **Match Score** — 1-100, with justification

### 3. Funding Strategy Recommendations
- Which grants to prioritize and why
- Suggested application timeline (which to apply to first)
- Grants that could serve as stepping stones to larger funding
- Potential for combining or sequencing grants

### 4. Alternative Funding Sources
- Industry partnerships or sponsored research opportunities
- Institutional internal grants that could fund pilot work
- International collaboration grants
- Fellowship opportunities if applicable

### 5. Gap Analysis
- What types of funding are NOT available for this research area
- Adaptations that could open additional funding streams
- Missing qualifications that could be addressed

## OUTPUT FORMAT
Structure your response as a well-organized markdown document with clear headings, tables, and actionable recommendations. Be specific about grant names, amounts, and deadlines where possible.

**IMPORTANT:** Your knowledge may not include the most current deadlines. Clearly flag any dates that may need verification and recommend the researcher check official funder websites for current calls.`,
};
