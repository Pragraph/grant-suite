import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.citation-resolver",
  phase: 5,
  step: 8, // Same step as assembly — it's an optional tool, not a sequential step
  name: "Citation Resolution Assistant",
  description:
    "Extract all [CITATION NEEDED] markers from the assembled proposal and generate a suggested reference list with search strategies.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "assembledProposal",
    "grantScheme",
  ],
  outputName: "Citation_Resolution.md",
  epTags: ["EP-03", "EP-08"],
  estimatedWords: 3000,
  template: `You are an academic reference specialist. Your task is to extract every [CITATION NEEDED] marker from the proposal below and produce a structured reference resolution guide.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

## ASSEMBLED PROPOSAL
{{assembledProposal}}

---

## INSTRUCTIONS

### Step 1: Extract All Citation Markers

Find every instance of [CITATION NEEDED] or [CITATION NEEDED: ...] in the proposal. List them in order of appearance:

| # | Marker Text | Section | Context (surrounding sentence) | Citation Type Needed |
|---|------------|---------|-------------------------------|---------------------|
| 1 | [CITATION NEEDED] | Background | "Recent studies show X is increasing [CITATION NEEDED]" | Empirical study |
| 2 | ... | ... | ... | ... |

Citation types: Empirical study, Review article, Methodology reference, Statistical benchmark, Policy document, Technical standard, Theoretical framework, Dataset/tool reference.

### Step 2: Suggested References

For each citation marker, suggest 2-3 likely references the researcher should look for:

#### Citation #1: [Context summary]
**What to cite:** [Description of ideal reference]
**Search strategy:**
- Google Scholar query: \`[exact search string to copy-paste]\`
- Scopus query: \`[exact search string]\`
**Likely sources:**
- [Author (Year)] — "[Probable paper title based on the claim being made]" — [Why this would work]
- [Author (Year)] — "[Alternative]" — [Why]

**Important:** These are educated guesses based on the field and claim. The researcher MUST verify these exist and say what is claimed. Do not fabricate DOIs or exact titles you are uncertain about.

### Step 3: Reference List Template

Produce a draft reference list in APA 7th edition format using the suggested references. Mark uncertain entries with [VERIFY]:

1. [VERIFY] Author, A. A. (Year). Title of article. *Journal Name*, *Volume*(Issue), Pages. https://doi.org/...
2. ...

### Step 4: Quick Wins

Identify the 5 citations that would be easiest to find and have the highest impact on proposal credibility. These are the ones to resolve first:

1. Citation #X — [Why it's easy + high impact]
2. ...

{{#if grantScheme}}
### Step 5: MOHE-Specific Citation Notes
- Prioritize Scopus/WoS-indexed sources (Malaysian evaluators check this)
- Include at least 2-3 Malaysian-authored references where relevant (shows local context awareness)
- Reference recent publications (last 5 years preferred) to show currency
- For national alignment claims, cite official Malaysian policy documents with full titles and publication years
{{/if}}

## OUTPUT FORMAT
Output as a markdown document titled "# Citation Resolution Guide". Include the extraction table first, then detailed suggestions per citation, then the draft reference list. End with the Quick Wins list.`,
};
