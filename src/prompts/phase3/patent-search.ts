import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step11-patent-search",
  phase: 3,
  step: 11,
  name: "Patent Search Strategy",
  description:
    "Walk through a Lens.org search session and populate a one-page patent search worksheet.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "country",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Patent_Search_Strategy.md",
  epTags: ["EP-01"],
  estimatedWords: 1500,
  template: `## ROLE

You are a patent-search coach for a senior academician preparing the patent-search evidence required by their grant application{{#if grantScheme}}, specifically the {{grantScheme}} scheme{{/if}}. Your job is to walk them through a single Lens.org search session and help them populate the one-page Simplified Patent Search Report that MyGRANTS or their funder requires. You are not producing a freedom-to-operate opinion. You are not producing a competitive landscape analysis. Those come later, in the Novelty and TRL Assessment step.

## READER

The reader is a senior academician in {{discipline}}, applying through their national research funding ministry. They have used PubMed, Scopus, and Google Scholar. They have NOT used a patent database before. They have read their grant garis panduan once and noticed that "patent search" is required, but they do not know how to execute one.

They want to open Lens.org once, run the search you give them, and capture exactly what their funder's form is asking for. Nothing more. They have 30 to 45 minutes.

If the reader needs to open three different patent databases to follow your instructions, you have failed. If the reader needs an external glossary in front of them to understand a sentence, you have failed. If the reader cannot map your output to the MyGRANTS Simplified Patent Search Report fields, you have failed.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}
{{#if grantSubCategory}}- **Grant Sub-Category:** {{grantSubCategory}}{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1, background only)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT (from Phase 2, background only)
{{> Proposal_Blueprint.md}}
{{/if}}

{{#if Research_Design.md}}
## RESEARCH DESIGN (from Phase 3, background only)
{{> Research_Design.md}}
{{/if}}

The injected background documents are reference material. The reader has not re-read them in detail before this step. Use them to extract the project specifics you need (primary innovation, intended IP filing target, key technical terms, target jurisdictions). Do not echo their content. Do not produce a grant overview. Do not list compliance requirements unrelated to patent search. The deliverable is a Patent Search Strategy, not a grant summary.

{{#if grantScheme}}
## SCHEME COMPLIANCE

Apply the rule that matches {{grantScheme}}:

- **GET (Geran Penyelidikan Eksploratori dan Transformatif):** Patent search is MANDATORY for both Exploratory (TRL 1 to 2) and Transformative (TRL 2 to 3) categories. Lens.org is the required primary database. Output must populate the MyGRANTS Simplified Patent Search Report template. Proposals without this evidence are rejected at the internal evaluation stage.
- **PRGS (Prototype Research Grant Scheme):** Patent search is MANDATORY. MyGRANTS Simplified Patent Search Report template applies. Lens.org is the recommended primary database.
- **FRGS (Fundamental Research Grant Scheme):** Patent search is ENCOURAGED (digalakkan) per FRGS Pindaan 2025. Not mandatory but strengthens novelty defense. The same MyGRANTS form is the easiest format to use.
- **TRGS, LRGS, PPRN, or international schemes:** No mandated patent-search format. Use this output as a structured novelty audit. The MyGRANTS-aligned structure still works.

If the scheme is GET or PRGS, label the worksheet "MyGRANTS Simplified Patent Search Report worksheet" in the output. For all other schemes, label it "Patent Search Worksheet". Same content, different framing.
{{/if}}

## GOAL

Produce a Patent_Search_Strategy.md that does four things:

1. Names the reader's invention in plain language across three layers (problem, technical solution, protectable claim), with tagged slots for project-specific facts the reader must supply.
2. Walks the reader through a single Lens.org search session, step by step, with copy-paste-ready Boolean queries and exact filter settings.
3. Maps each output field to the MyGRANTS Simplified Patent Search Report so the reader can transfer their findings directly into the form their funder requires.
4. Stays under 1,500 words total.

## SUCCESS CRITERIA

Your output succeeds if:

- A senior academician with no prior patent-search experience can complete the search in one 30 to 45 minute Lens.org session.
- The opening "Quick read" delivers the core message in four scannable bullets, before the reader commits attention to detail.
- Lens.org is the primary tool throughout. Espacenet and Google Patents appear only as a short opt-in cross-check section with at most two queries each. If the Espacenet and Google Patents text takes up more lines than the Lens.org section, you have failed the brief.
- Every Boolean query string is paste-ready, uses at most six Boolean operators, and stays under 250 characters.
- Every patent classification code is defined inline on first use. CPC is the Cooperative Patent Classification system. IPC is the International Patent Classification system. Any specific sub-class introduced (for example, G16H 50/20) is described in one plain-language phrase such as "ICT for medical diagnosis or decision support".
- Every domain-specific abbreviation used in queries is glossed inline on first use, including any clinical, technical, or device-class shorthand. UACR, eGFR, EHR, EMR, FTO, MyIPO are examples. Define on first use, then use freely.
- Every project-specific claim the LLM cannot verify from the injected background is marked [USER INPUT NEEDED: <one-sentence prompt>]: exact research title, primary protectable claim, target jurisdictions beyond Malaysia, partner identity if relevant.
- Every MyGRANTS form field has a one-row worksheet line in Section 3 with example text in brackets showing what the filled answer should look like.
- If the grant scheme is GET or PRGS, the Quick read explicitly states that patent search is MANDATORY for this scheme in one of the four bullets.

## CONSTRAINTS

Do use the injected background documents to extract project specifics. Generic advice fails this brief.

Do not invent specific assignee names, specific patent numbers, specific named inventors, or specific competitor companies. That intelligence comes from running the search on Lens.org. It does not come from the LLM. If you find yourself naming Oracle, Cerner, Epic, IBM, Philips, Siemens, Google, Microsoft, or any other organization as relevant, stop and replace with [USER INPUT NEEDED: Names the reader will fill in after running the search.].

Do not produce a freedom-to-operate analysis. Do not produce a competitive landscape table. Do not list assignee portfolios to review. Those belong in the next sub-step of the application, Novelty and TRL Assessment.

Do not produce a separate "patent result capture template" worksheet for the reader to fill row by row during searching. The MyGRANTS Simplified Patent Search Report IS the form the reader fills. Anything else duplicates it.

Do not exceed 1,500 words.

Do not introduce a CPC code or IPC class without one plain-language sentence describing what that class covers.

Do not produce more than 4 Lens.org Boolean queries. The reader has 30 to 45 minutes, not three hours.

Do not invent Lens.org UI labels. Use the actual filter names: Classifications, Jurisdictions, Applicants, Inventors, and the Simple Patent Family grouping toggle.

Do not write methods-paper register. No "model card", no "subgroup calibration", no TRIPOD+AI, no PROBAST+AI, no DECIDE-AI, no "fairness audit metric". Those belong in the methods section of the proposal, not in a patent-search worksheet.

Write in plain research register. Short sentences. Active voice. No em-dashes. No semicolons.

## OUTPUT STRUCTURE

Produce exactly these sections, in this order, with no others.

### Quick read

Four short bullets at the very top. No introductory paragraph above them. Each bullet is a single complete sentence answering one of these questions, in this order:

1. What is your invention, in one sentence?
2. Where will you search and why? (Lens.org primary, Espacenet and Google Patents as optional cross-check)
3. What will you populate at the end? (the worksheet in Section 3, which maps to your funder's required form)
4. What is the single most important next click?

If the grant scheme requires patent search (GET or PRGS), state that fact in bullet 3.

### 1. Your invention in plain language

A three-row table. No more, no less.

| Layer | Plain-language answer |
| --- | --- |
| Problem you are solving | [USER INPUT NEEDED: One sentence naming the specific problem in plain language.] |
| Technical solution | [USER INPUT NEEDED: One sentence naming what your invention does technically.] |
| Protectable claim | [USER INPUT NEEDED: One sentence naming the specific thing you would file an IP claim around, such as the rule set, the workflow, the apparatus, the formulation, the algorithm output, or the device design.] |

Below the table, write two to three sentences (no more) summarizing how the three layers fit together. Use plain language. No CPC codes in this section.

### 2. Lens.org search session

A numbered step list of 7 to 10 steps. Each step is one sentence or one short paragraph. The sequence MUST include, in order:

1. Opening https://www.lens.org/ and reaching the patent search page. Note that anonymous search exports up to 1,000 records, free account registration extends this to 50,000.
2. Pasting the first query into the Lens.org search bar and clicking Search.
3. On the results page, opening the Classifications filter on the left and noting the top 3 CPC codes returned. The top CPC code populates the MyGRANTS "Highest CPC classification" field.
4. Grouping results by Simple Patent Family using the toggle above the results to deduplicate the same invention filed in multiple countries.
5. Sorting by Earliest Priority Date and skimming the top 20 titles and abstracts.
6. Running queries 2, 3, and 4 in turn, each targeting a different invention layer.
7. Applying the Jurisdictions filter to Malaysia, then in turn Thailand, Indonesia, Singapore. These directly populate the MyGRANTS "Similar patents in Malaysia" and "Similar patents in ASEAN neighbours" fields.
8. Applying the Applicants filter and capturing the top 10 applicant names. The reader classifies these into stakeholders versus competitors in Section 3.
9. Applying the Inventors filter and noting whether any single inventor has more than 2 patents in this space.

Then provide the 4 Lens.org Boolean queries in a table:

| # | Query (paste into Lens.org search bar) | Invention layer it targets |
| --- | --- | --- |

Each query MUST:
- Use Boolean operators AND, OR, NOT, with quoted phrases for multi-word terms.
- Stay under 250 characters.
- Target a distinct layer of the invention. Suggested coverage: (1) the problem space, (2) the technical method, (3) the protectable claim narrowed to your specific differentiator, (4) the application context if relevant.
- Mark any term cluster the LLM cannot derive from background as [USER INPUT NEEDED: One-sentence prompt explaining what the reader fills in.].

For each query, write one sentence (no more) explaining what it is meant to surface. Do not speculate about specific patent numbers, specific assignees, or expected result counts.

### 3. MyGRANTS Simplified Patent Search Report worksheet

A one-page worksheet structured to match the MyGRANTS form fields. The reader fills each row from their Lens.org session results. Use this exact table structure:

| Field | What to write |
| --- | --- |
| Research title | [USER INPUT NEEDED: Your project title, exactly as it will appear on the application.] |
| Search keywords | The 4 Boolean strings from Section 2 above, joined by line breaks. |
| Number of patents found | [Reader fills from Lens.org result count, after grouping by Simple Patent Family.] |
| Highest CPC classification | [Reader fills the top CPC code from the Lens.org Classifications filter, with one plain-language phrase describing what it covers.] |
| Does the CPC classification accurately represent your research? | [Reader answers Yes or No with one-sentence rationale.] |
| Top 5 patent applicants, potential STAKEHOLDERS | [Reader fills 5 names from the Lens.org Applicants filter. Stakeholders share the problem space and would benefit from your solution.] |
| Top 5 patent applicants, potential COMPETITORS | [Reader fills 5 names from the same filter. Competitors own IP you would have to design around to commercialize.] |
| Similar patents already filed in Malaysia | [Reader fills count and 1 to 2 example titles, or "None found".] |
| Similar patents in Thailand, Indonesia, Singapore | [Reader fills count per country, or "None found per country".] |
| Top inventor with more than 2 patents | [Reader fills name and patent count from the Lens.org Inventors filter, or "None with more than 2".] |
| Novelty narrative | [Reader writes 2 to 3 sentences. Template provided in Section 4.] |

Below the table, add one short paragraph (50 words or fewer) explaining the stakeholders versus competitors heuristic, since the MyGRANTS form asks the reader to separate the two. Do not pre-classify named organizations. The reader makes that call.

### 4. Novelty narrative template

Provide a 2-3 sentence template the reader adapts. Use this exact structure:

"Existing patents in this space focus on [USER INPUT NEEDED: what the existing patents do, in plain language, based on what you found in Lens.org]. My research differs because [USER INPUT NEEDED: what your invention does that the existing patents do not, in plain language]. This positions the work as [USER INPUT NEEDED: one phrase from this list: a new technical method, a new application of an existing method, an improvement on an existing system, a workflow transformation, a regional adaptation for Malaysian context, or a safety- or equity-audited variant]."

After the template, write two to three sentences (no more) explaining what makes a defensible novelty claim versus an indefensible one. Defensible novelty is specific, technical, and tied to the protectable claim from Section 1. Indefensible novelty is "first of its kind in Malaysia" with no search evidence, or "no one has done this before" without naming the closest prior art.

### 5. Optional cross-check (Espacenet and Google Patents)

A short opt-in section. Maximum two queries per database. Maximum 60 words of explanatory text across the whole section.

Begin with one sentence telling the reader explicitly: "Skip this section if Lens.org returned a manageable result set and you have no specific commercialization partner yet. You can return to it during the Novelty and TRL Assessment step."

If the reader opts in, provide:
- 2 Espacenet queries (Smart Search style, no field labels, since Espacenet field syntax varies by interface mode).
- 2 Google Patents queries (with parentheses for Boolean grouping, since Google Patents parses ambiguously without them).

For each, one sentence explaining what the cross-check catches that Lens.org might have missed.

### 6. Things you might be wondering

Three to five plain-language questions a first-time patent searcher would ask, with answers under 40 words each. At minimum, include:

- What if my search returns 5,000 results?
- What if my search returns zero results?
- Do I need to read full patent texts, or just titles and abstracts?

Add one or two more if relevant to the project or the scheme. One useful addition is whether MyIPO is needed when Lens.org already filters by Malaysia jurisdiction (it is not, unless the reader needs to verify a specific known Malaysian filing).

## STOP RULES

If you reach 1,500 words, stop. Do not add a closing section.

If you are about to produce a competitive landscape table with named assignees, stop. That belongs in Novelty and TRL Assessment, not here.

If you are about to produce more than 4 Lens.org queries, you are over-engineering. The reader has 45 minutes. Trim.

If you are about to invent a specific patent number, a specific inventor name, a specific company name, or a specific CPC code without one plain-language phrase explaining what it covers, stop. Replace with [USER INPUT NEEDED] or add the gloss.

If you find yourself writing methods-paper jargon (TRIPOD+AI, PROBAST+AI, DECIDE-AI, "model card", "subgroup calibration"), stop. Replace with plain language or cut.

If you find yourself adding a result-capture template worksheet for the reader to fill while searching, stop. The MyGRANTS worksheet in Section 3 IS the capture template.

If the Espacenet and Google Patents content is taking up more text than the Lens.org content, stop. Cut the cross-check section back to the minimum.

Do not narrate what you are about to do. Do not summarize what you wrote at the end. Do not add an "Executive Summary", "Interpretation Rule", or "Methodological Claim" section no matter how natural the closing feels.

## BEGIN

Produce Patent_Search_Strategy.md now.`,
};
