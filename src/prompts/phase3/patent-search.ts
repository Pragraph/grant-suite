import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step11-patent-search",
  phase: 3,
  step: 11,
  name: "Patent Search Strategy",
  description:
    "Generate targeted search queries for patent databases to assess novelty and identify relevant prior art.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "country",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
  ],
  outputName: "Patent_Search_Queries.md",
  epTags: ["EP-01"],
  estimatedWords: 1500,
  template: `You are a patent research specialist with expertise in prior art searches and intellectual property landscape analysis. Your task is to generate comprehensive search strategies for identifying relevant patents and prior art.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if country}}- **Country:** {{country}}{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT (from Phase 2)
{{> Proposal_Blueprint.md}}
{{/if}}

{{#if Research_Design.md}}
## RESEARCH DESIGN (from Phase 3)
{{> Research_Design.md}}
{{/if}}

## INSTRUCTIONS

Generate a patent and prior art search strategy covering:

---

### 1. Key Technology/Innovation Areas (EP-01)
- Identify the core innovations in this research
- Map each innovation to relevant patent classification codes (IPC/CPC)
- Identify key terminology and synonyms

### 2. Search Queries for Google Patents
Provide 8-10 specific search queries optimized for Google Patents:
| # | Query String | Target Innovation | Expected Results |
|---|-------------|-------------------|-----------------|

### 3. Search Queries for Espacenet
Provide 5-8 queries optimized for Espacenet (EPO):
| # | Query String | Classification Codes | Notes |
|---|-------------|---------------------|-------|

### 4. Academic Prior Art Searches
Provide 5-8 queries for academic databases (Scopus, Web of Science):
| # | Query String | Database | Focus Area |
|---|-------------|----------|-----------|

### 5. Key Competitors & Assignees
- List organizations/companies likely to hold relevant patents
- Identify key researchers in adjacent patent spaces
- Note any known licensing or freedom-to-operate considerations

### 6. Search Execution Checklist
- [ ] Google Patents — all queries executed
- [ ] Espacenet — all queries executed
- [ ] Academic databases — all queries executed
- [ ] Key assignee portfolios reviewed
- [ ] Results compiled and deduplicated

---

## OUTPUT FORMAT
Structure as "# Patent Search Strategy". For each query, provide the exact string to copy-paste into the search engine. Include direct instructions for the user on how to execute each search. Flag any areas where the research direction is unclear with [USER INPUT NEEDED].

**IMPORTANT:** The user will execute these searches manually and paste the results back for analysis. Make queries specific and actionable.`,
};
