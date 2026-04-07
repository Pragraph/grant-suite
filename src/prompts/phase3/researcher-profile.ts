import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step15-researcher-profile",
  phase: 3,
  step: 15,
  name: "Researcher Profile Optimizer",
  description:
    "Optimize your researcher profile narrative to maximize alignment with grant requirements and evaluator expectations.",
  requiredInputs: ["discipline", "cvSummary"],
  optionalInputs: [
    "careerStage",
    "country",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "grantScheme",
  ],
  outputName: "Researcher_Profile.md",
  epTags: ["EP-02", "EP-06", "EP-09"],
  estimatedWords: 2000,
  template: `You are an academic career strategist who specializes in optimizing researcher profiles for grant applications. Your task is to reframe and highlight the researcher's track record to maximize alignment with grant evaluation criteria.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}

## RESEARCHER CV / CAREER SUMMARY
{{cvSummary}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT (from Phase 2)
{{> Proposal_Blueprint.md}}
{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if grantScheme}}
## MYGRANTS PROFILE CONTEXT
For MOHE grants submitted via MyGRANTS, the researcher profile is evaluated directly as part of the application:
- **H-index** and **publication count** (Scopus-indexed) are visible to reviewers
- **Prior grant completion rate** is tracked — as of Pindaan 2025, new FRGS applications require previous projects to be at least 75% complete (verified by RMC in MyGRANTS Monitoring Module). Flag if below 75% and prepare mitigation language.
- **Postgraduate supervision record** is valued (number of PhD/Masters students supervised to completion)
- **International collaboration evidence** strengthens the profile
- Ensure ORCID profile is up-to-date and linked to MyGRANTS
- List publications strategically: prioritise those most relevant to the proposed research, not just highest impact factor
- For senior researchers: highlight leadership of prior funded projects and their outcomes
{{/if}}

## INSTRUCTIONS

Produce a Researcher Profile Optimization document covering:

---

### 1. Profile-Grant Alignment Assessment (EP-02)
| Evaluation Criterion | Researcher Evidence | Strength | Recommended Framing |
|---------------------|-------------------|---------|-------------------|

### 2. Optimized Track Record Narrative (EP-09)
Write a 500-word narrative that:
- Opens with the strongest alignment to grant priorities
- Weaves publications, grants, and impact into a coherent story
- Addresses career stage appropriately (early career = potential; senior = track record)
- Highlights interdisciplinary breadth or methodological innovation
- Demonstrates leadership and independence

### 3. Key Achievements Reframing
For each major achievement, provide:
| Achievement | Standard Description | Grant-Optimized Framing | Why This Works |
|------------|---------------------|------------------------|---------------|

### 4. Gap Mitigation Strategy (EP-06)
For identified weaknesses:
| Gap | Severity | Mitigation Strategy | Evidence to Cite |
|-----|---------|--------------------|-----------------|

### 5. Publication Strategy
- Which publications to highlight and why
- How to frame citation metrics appropriately
- Preprints, datasets, or software to include
- Collaboration evidence from co-authorships

### 6. Complementary Evidence
Recommend additional evidence to strengthen the profile:
- Letters of support from mentors/collaborators
- Teaching and supervision track record
- Service and leadership roles
- Media coverage or public engagement
- Awards and recognitions

### 7. CV Formatting Recommendations
- Recommended CV structure for this specific grant
- What to include/exclude
- How to order sections for maximum impact
- Page limit considerations

---

## OUTPUT FORMAT
Structure as "# Researcher Profile Optimization". Begin with a 3-sentence assessment of current profile strength. Use tables for analysis, prose for the narrative sections. Flag items needing researcher input with [USER INPUT NEEDED].`,
};
