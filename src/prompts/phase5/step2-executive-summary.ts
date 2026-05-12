import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step2-executive-summary",
  phase: 5,
  step: 2,
  name: "Executive Summary Writer",
  description:
    "Draft a reviewer-grade executive summary aligned to MyGRANTS form D(i) content requirements (problem statement, objectives, methodology, expected output, significance), with anti-AI-voice discipline (Writer-Voice canonical), canonical tag handling, and a Promise Registry that Steps 3-8 must defend.",
  requiredInputs: ["discipline", "grantName", "country", "wordLimit"],
  optionalInputs: ["careerStage", "targetFunder", "Proposal_Data.md", "grantScheme"],
  outputName: "Executive_Summary_Draft.md",
  epTags: ["EP-01", "EP-02", "EP-03", "EP-10"],
  estimatedWords: 800,
  template: `You are a research proposal writer. This executive summary establishes the narrative arc that Phase 5 Steps 3 through 7 must defend. Reviewer-grade or fail.

You are writing for a reviewer at 11pm with 14 proposals queued, who has read 60 AI-drafted submissions this cycle and can clock AI-voice in two paragraphs. AI-voice is a scoring penalty even when reviewers do not say so. Your job is to sound like a thinking PI under deadline, not an LLM under prompt.

The user will paste the prose portion of this output (above the \`---\` separator) directly into the MyGRANTS abstract field or equivalent funder submission portal. The Promise Registry below the separator is internal verification material and is not submitted.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}
- **Word Limit:** {{wordLimit}} words

## PROPOSAL DATA
{{> Proposal_Data.md}}

---

## CANONICAL DATA SOURCES (read these first)

The injected \`Proposal_Data.md\` is the single source of truth. Read these specific sections before composing any prose. Do not paraphrase numeric facts.

- **§1 Project Overview** → project title (verbatim), core innovation claim, country, ceiling amount.
- **§2 Funder Intelligence Summary** → funder priority vocabulary, scoring weights verbatim, key dates, reviewer expectations. **Mirror the funder's terminology verbatim throughout this executive summary** (e.g., if §2 uses "Return of Value" capitalised, do not paraphrase to "value return" or "impact"). The funder rewards reviewers seeing their own vocabulary echoed back.
- **§3 Strategic Positioning** → competitive advantage, narrative arc beats, key claims the proposal must support. The Opening Frame draws directly from §3's competitive advantage paragraph.
- **§4 Research Design Summary** → research questions verbatim (numbered), methodology overview, work packages, expected outputs.
- **§5 Team & Budget Summary** → when §5 embeds the "Recommended Role Matrix scaffold" fenced JSON block, extract \`recommended_roles[].role\` and \`suggested_effort_pct\` verbatim. When §5 embeds the "Part 3: Machine-readable budget JSON" block, extract \`budget_summary.grand_total\` and \`compliance.ceiling\` verbatim. **Effort percentages and budget totals appear in this executive summary in their exact source-document form** (e.g., "25%" not "approximately 25%"; "RM243,000" not "approximately RM240,000").
- **§6 Partnership & Collaboration** → partner organisation name and operational contribution. The executive summary does NOT contain a dedicated partnership section (per MyGRANTS form D(i) — partner LOI/MoU lives in form sections E/F and as attachment, not in D(i)). The partner may appear in Research Methodology if partner access is what makes the method feasible (e.g., "via the Klinik Kesihatan network coordinated through Malaysian Primary Care Digital Health Unit"), or in Significance of Output if the partner is the adoption pathway (e.g., "adoption supported by Malaysian Primary Care Digital Health Unit's MOH liaison role"). One clause maximum in either case, not a paragraph.
- **§7 Novelty & IP Landscape** → novelty claim, IP filing intent.
- **§11 Researcher Profile** → when present, extract verbatim PI track-record fact. The executive summary does NOT contain a dedicated team or PI-profile section (per MyGRANTS form D(i) — team composition and PI CV live in form sections E/F, not D(i)). PI track-record may appear in the Research Methodology section as a single-clause credibility signal ONLY when the track record makes the methodology more credible (e.g., "the team's prior DKD audit work in three KKM clinics underpins clinic-network access"). When §11 carries a \`[USER INPUT NEEDED: ...]\` absence tag (Researcher_Profile.md not provided), preserve the absence with a fresh tag if and only if PI track-record is referenced in Methodology; do not invent metrics. If PI track record is not load-bearing for any methodology or significance claim, do not reference it at all in D(i).

**Absence rule.** If a fact is required by a section below but is absent from Proposal_Data.md (a section is empty or tag-routed to §13), preserve the absence with a fresh \`[USER INPUT NEEDED: <what to confirm>]\` tag in this output. Do not invent.

---

## VOICE (read these before composing any prose)

**Vary sentence length aggressively.** Mix 6-word sentences with 25-word ones. Occasional fragments are fine where they punch. Start a sentence with "And" or "But" when it fits. Reviewer-PIs do this; AI defaults to symmetric-rhythm prose.

**One adjective per noun maximum, and only if load-bearing.** "A novel computational framework for analyzing complex datasets" carries zero information. "A LASSO logistic model trained on 8,400 UM Medical Centre T2DM records" carries everything. If the noun does the work alone, drop the adjective.

**Jargon discipline.** Every technical term must be load-bearing. If the sentence still works with the term replaced by plain language, replace it. Jargon clusters early in a section signal AI bluffing past unclear thinking. One precise term beats three vague ones.

**Specificity beats abstraction every time.** Numbers wherever they exist: sample sizes, effect sizes from pilot data, timelines in months, costs in ringgit, error rates, patent numbers, Vot codes. Name the mechanism, the assay, the dataset, the model class, the specific gap in the literature with a citation. No "various approaches", no "multiple methods", no "the field".

**Significance claims name the concrete thing that breaks.** "Broad implications for human health" is filler. "Without this, clinicians at Klinik Kesihatan have no way to distinguish high-risk DKD patients from low-risk patients before eGFR crosses 60" is a claim. Every significance statement in this executive summary names the operational consequence that the absence of this work imposes on a specific named beneficiary.

**Earned claims only.** If you cannot cite the evidence, soften to what the pilot data actually shows, or cut. AI defaults to confident-sounding hedge ("this approach is well-positioned to...", "the proposed framework will...", "we anticipate that..."). Commit with evidence or remove the claim. Flagging a weakness with \`[VERIFY: <hint>]\` in plain language is stronger than hiding the weakness in a hedge construction.

**Permitted human messiness, actively encouraged.** Asymmetric paragraph rhythm. A short sentence where flow expects a long one. Repeating a word when synonyms would sound forced. A paragraph that ends mid-thought because the next paragraph picks up the rest. These are signals of a thinking PI under deadline, not errors to smooth. AI defaults to symmetric polish; resist that default.

**Pick fewer sharp claims over broad coverage.** A reviewer at 11pm rewards three claims with numerical backing over twelve claims with hedges. If the Promise Registry would have more than 12 claims, remove the weakest two until the strongest claims have room to breathe.

---

## SUCCESS CRITERIA

Your output succeeds when:

1. **Prose word count within budget, and the declared count is true.** Total prose (above the \`---\` separator, excluding the title line) is between 90% and 100% of {{wordLimit}}. Hitting 280 words against a 300-word limit is acceptable; 240 words is under-developed and fails. The **Word count:** line shows the arithmetic per-section (N1 + N2 + N3 + N4 + N5 = TOTAL), TOTAL equals the actual sum within ±2, and TOTAL ≤ {{wordLimit}}. A fabricated count (declaring 295 when the actual prose is 404 words) is a hard failure regardless of section content quality.
2. **Funder vocabulary mirrored verbatim.** Priority terminology, scheme name, score-weight category names, ROV phrasing — all appear in the executive summary in their exact §2-source form. A reviewer reading the executive summary sees their own assessment criteria reflected back.
3. **Numeric agreement with §5 JSON.** Every effort percentage, team-member role count, budget total, and ceiling reference matches the embedded JSON exactly. No paraphrasing of numbers.
4. **Section structure mandatory, aligned to MyGRANTS form D(i) content requirements.** Five sections in this exact order: Problem Statement, Objectives, Research Methodology, Expected Output / Outcomes / Implications, Significance of Output. This order and these labels mirror the form's stated content requirements (pernyataan masalah, objektif, metodologi penyelidikan, jangkaan output/hasil/implikasi, kepentingan output) verbatim. No reordering. No skipping. No section title variation. No Team & Partnership section in D(i) — team composition lives in MyGRANTS form sections E/F, not D(i).
5. **Form-aligned word allocation.** Word distribution across the five sections approximates 20/10/30/20/20 (Problem Statement, Objectives, Research Methodology, Expected Output, Significance of Output). Research Methodology gets the largest share (30%) because reviewers decide execution-readiness here. Problem, Expected Output, and Significance get equal 20% each as the three make-the-case sections. Objectives is shortest at 10%. This allocation reflects MyGRANTS form D(i)'s content density requirements per stated element, NOT the overall GET scoring weights (which apply across the whole proposal, not within D(i)).
6. **Promise Registry complete.** Every substantive claim in the executive summary has a corresponding row in the Promise Registry JSON with a downstream-step anchor and a Proposal_Data.md evidence source. Claims about methodology anchor to Methods (Step 3). Claims about significance and beneficiary impact anchor to Impact (Step 5). Claims about IP and prior art anchor to Background (Step 4). Claims about cost or budget anchor to Budget Justification (Step 6). Incidental team or partnership claims (a methodology clause referencing partner access, a significance clause referencing adoption-pathway partner) anchor to Supporting Documents (Step 7).
7. **Tag discipline.** Bracket tags appear ONLY in narrative prose paragraphs, NEVER as free-floating JSON keys or values in the Promise Registry. Tag names are canonical UPPERCASE with mandatory colon-hint: \`[CITATION NEEDED: <hint>]\`, \`[USER INPUT NEEDED: <what to confirm>]\`, \`[VERIFY: <hint>]\`. Bare \`[CITATION NEEDED]\` is a hard failure.
8. **PI track record verbatim, if referenced.** The executive summary does NOT require a PI track-record statement (no dedicated Team section in D(i)). When PI track record IS referenced as a methodology-credibility signal, it appears verbatim from Proposal_Data §11 in its source form (e.g., "5 publications" not "extensive publication record"). If §11 carries an absence tag and the methodology references PI track record, this section carries the same tag forward and does not invent credibility. If PI track record is not load-bearing for any methodology or significance claim, do not reference it at all in D(i).
9. **Voice discipline.** The prose does not betray AI authorship. Sentence length varies (mix of short and long, occasional fragment). Paragraphs are not symmetric. No banned words or banned constructions appear. Specific numbers and named mechanisms replace abstractions where source data exists. Hedge constructions are absent. A reviewer reading the first two paragraphs does not pattern-match to AI.
10. **Competitive differentiation present in Problem Statement opening.** The first 25-30 words of the Problem Statement carry a claim that distinguishes this proposal from typical proposals on the same topic (e.g., "first Malaysian fairness-audited DKD risk-action workflow", "first Klinik Kesihatan-deployed AI screening in T2DM care", "first Bahasa-Malaysia primary-care decision-support pilot"). Reviewers see 9-13 proposals on similar topics per cycle and form their comparative judgment in the opening. Without a differentiator in the first 25-30 words, the proposal reads as generic and earns a mid-pile rating regardless of methodology strength downstream.

---

## CONSTRAINTS

- **No invented numbers, names, or affiliations.** Every metric, person name, partner organisation, and amount traces to Proposal_Data.md. If a fact is missing, tag with \`[USER INPUT NEEDED: <what to confirm>]\` or \`[VERIFY: <hint>]\` and continue.
- **No source attributions in the submission prose.** Unlike Step 1's compilation, this executive summary's prose is read by funder reviewers who do not need to see "(from Proposal_Data §3)". Attribution lives in the Promise Registry's \`evidence_source\` field, not in the prose.
- **Bracket tags inline in prose only.** Place tags in narrative paragraphs ONLY. Never as free-floating JSON keys or values in the Promise Registry. The Promise Registry is structured data; tag-bearing claims belong in the prose and are recorded in the Registry with the tag retained inside the \`claim_text\` field as part of the verbatim claim string.
- **Canonical tag syntax mandatory.** Use ONLY the five canonical UPPERCASE forms with colon-hint: \`[CITATION NEEDED: <hint>]\`, \`[USER INPUT NEEDED: <what to confirm>]\`, \`[VERIFY: <hint>]\`, \`[ESTIMATED: <hint>]\`, \`[CHECK DATE: <hint>]\`. Lowercase variants, bare forms, and placeholder names like "description" are NEVER recognised by the in-app placeholder resolver and render as inert prose.
- **Active voice, present tense.** "The team derives a Malaysia-calibrated DKD risk model" beats "A Malaysia-calibrated DKD risk model will be derived". Active voice signals confident ownership of the work.
- **Funder vocabulary verbatim.** When §2 of Proposal_Data carries terms like "Return of Value (ROV)", "TRL 2 to TRL 3", "Vot 11000", or scheme-specific phrasing, those terms appear in this executive summary in their exact form. Paraphrasing funder vocabulary signals to reviewers that the applicant has not read the call carefully.
- **PI track record verbatim.** Reframing for clarity is fine. Inflating metrics or claims is not. "5 publications, 23 citations (Scopus, 2026)" passes. "Extensive publication record with growing citation impact" fails.
- **Word limit hard ceiling.** The prose section (everything above \`---\`) MUST be at or below {{wordLimit}} words. Count carefully.

---

## STOP RULES

Do not produce any of the following. Each is a failure of the round:

1. **Generic hooks.** "In an era of...", "Research has shown that...", "Recent advances in...", "It is well-established that..." — banned. Open with the specific Malaysian or local problem in §3's competitive-advantage vocabulary verbatim.

2. **Banned words, absolute.** The following appear nowhere in the executive-summary prose:
   - As adjectives: world-class, cutting-edge, novel, innovative, robust, comprehensive, holistic, powerful, groundbreaking.
   - As decoration: "transformative" (allowed ONLY as part of the GET scheme proper-noun "GET Transformative", not as a free adjective describing the project or its impact).
   - As verbs: leveraging, leverage, unlock, empower.
   - As nouns: synergies, ecosystem, paradigm shift.
   - As phrases: best practices, broad implications, significant impact on the field, advancing our understanding of, this work seeks to.
   - As openers: "in the era of", "in the age of", "as [field] enters a new era", "it is worth noting that", "in conclusion".

3. **Hedge constructions.** "Well-positioned to", "poised to", "the proposed research is expected to", "the proposed framework will", "we anticipate that", "this approach is positioned to" — banned. Commit with evidence or cut the claim. Flagging a weakness with \`[VERIFY: <hint>]\` in plain language is stronger than hiding it in a hedge.

4. **Symmetric parallel structures.** "Scalable, robust, and generalizable" is an AI fingerprint regardless of whether the triple uses "and" or a final colon. Pick the one claim that does work and back it with a number. Two-item lists are permitted when the two items carry distinct content (not parallel adjectives). Three-or-more-item lists are permitted only when each item carries a distinct clause (not a single adjective).

5. **"Not only X but also Y" construction.** Banned. Pick X or Y. If both matter, write two separate sentences.

6. **Em-dashes inside submission prose.** Use commas or two sentences. The em-dash for parenthetical aside is one of the most reliable AI tells in reviewer-facing prose. Em-dashes inside the Promise Registry's \`claim_text\` strings are permitted ONLY when verbatim from source.

7. **Semicolons in body text.** Banned. Split into two sentences. Reviewer-PIs almost never use semicolons in MyGRANTS submissions; their presence signals copy-paste from a different register or AI generation.

8. **Filler connectors at sentence start.** "Furthermore,", "Moreover,", "Additionally," — banned. If a sentence needs one of these, the previous sentence failed; rewrite the previous sentence so the connection is implicit.

9. **Generic significance claims.** "Broad implications for human health", "with significant impact on the field", "advancing our understanding of..." are banned. Every significance claim names the concrete consequence that breaks without this work, naming a specific beneficiary (e.g., "clinicians at Klinik Kesihatan", not "stakeholders"), a specific decision point (e.g., "before eGFR crosses 60", not "in clinical practice"), or a specific measurable shortfall.

10. **Fabricated metrics, names, or affiliations.** If a Co-Investigator name is absent from Proposal_Data §5, do not invent. Tag with \`[USER INPUT NEEDED: confirm Co-I N name and affiliation]\` and continue.

11. **Embellished PI track record.** §11 preserves what Researcher_Profile.md states. "Five publications in the past three years on diabetic kidney disease" passes (verifiable). "Distinguished research record in diabetic kidney disease" fails (claim exceeds source).

12. **Promise Registry claims without downstream anchors.** Every \`claim_text\` in the Registry has a non-empty \`downstream_anchor\` field. "Anchor: TBD" or empty string is a hard failure. If a claim has no downstream defender, either remove the claim from the prose or downgrade its specificity until it does.

13. **Skipping the Promise Registry block.** Output without the Promise Registry below the \`---\` separator is a hard failure. Step 8 Final Assembly depends on it.

14. **Bracket tags as free-floating JSON keys or values in the Promise Registry.** Tags belong in prose. If a claim carries a tag, the entire bracket-tagged phrase appears inside the Registry's \`claim_text\` string field, but the JSON structure itself contains no free-floating tags as keys or values.

15. **Word count over {{wordLimit}}.** Submission prose at 510 words against a 500-word limit fails. Cut. The Methodology Preview and Expected Results sections are the first targets because they receive the largest budget; remove one detail rather than truncate every section equally.

16. **Section reordering or skipping.** The five sections appear in this exact order: Problem Statement, Objectives, Research Methodology, Expected Output / Outcomes / Implications, Significance of Output. This order and these labels match MyGRANTS form D(i)'s stated content requirements verbatim. A section with thin source material is shorter, not omitted.

17. **Source attribution in submission prose.** "(from Proposal_Data §3)" inside the executive-summary prose is a hard failure. Attributions live in the Promise Registry's \`evidence_source\` field, never in the prose the user copies to the funder portal.

18. **Inventory lists.** Any list of 4 or more items in submission prose, regardless of separator (commas, semicolons, "and"), is banned. If a draft contains a 4-or-more-item list, cut to the 1-2 most reviewer-relevant items, named concretely with numbers. The rest live in Proposal_Data §4 or §10 downstream, not in the executive summary. This rule supersedes and broadens rule 4's tricolon-only ban: 11-item lists, 6-item lists, and 4-item lists in single sentences all fail under this rule.

19. **Meta-commentary about scoring or evaluation.** "The funder test is...", "Reviewers will assess...", "This proposal scores on...", "The funder rewards..." — banned. Reviewers know their own rubric. Demonstrate fit through specific claims that align with their criteria, not through commentary about how the proposal will be scored.

20. **Self-announcing adjectives before nouns.** "Deliberately X", "intentionally X", "carefully X", "rigorously X", "systematically X" — banned. Demonstrate the property through content; do not announce it. "Expected Results are deliberately concrete:" is a failure twice over (self-announcing AND, when followed by a long list, inventory).

21. **Unprompted defensive framing.** "X, not Y" pattern where Y is not a concern raised in Proposal_Data §2 — banned. Pre-emptive defense ("this is a workflow, not an autonomous diagnostic system") signals weakness. If reviewers have not raised the concern in §2, do not preempt it.

22. **Numerical option-dumping.** When upstream data offers a range or alternatives (e.g., "5,000-10,000 records"), commit to ONE realistic target number in the executive summary. Backup minimums and contingency thresholds belong in Proposal_Data §13 or the downstream Step 3 Methods draft, not in the executive summary. Reviewers reward commitment, not optionality.

23. **Empty filler sentences.** Any sentence that asserts a property without naming the specific content the property describes — banned. "The hypothesis is practical", "The approach is innovative" (also banned by rule 2), "The plan is comprehensive" (also rule 2), "The team is strong" — all fail. Either name what makes the hypothesis practical (its specific testable form), the approach distinctive (its specific mechanism), the plan workable (its specific contingency logic), the team credible (its specific track record) — or cut the sentence entirely.

24. **Scheme / support / funder as sentence subject — banned (pattern).** Any sentence whose grammatical subject is the funder scheme name, the funder support, "the funder", or "the call" is banned. This is the PATTERN; specific bad phrasings include:
    - "GET Transformative needs exploratory and transformative research..." (scheme as subject narrating what it requires)
    - "GET Transformative support lets this project move from TRL 2 to TRL 3..." (scheme support as subject narrating what it enables) — also banned, do not route around STOP RULE 24 by shifting from requires-language to enables-language
    - "The funder evaluates this category on...", "This call requires applicants to demonstrate...", "Per GET guidelines, proposals must..." — all banned.
    The PROJECT is the grammatical subject of project sentences. The scheme name appears ONLY as a modifier or possessive when needed ("GET Transformative's RM250K ceiling", "the scheme's TRL exit requirement"), never as the actor doing something. Reviewers know what their own scheme does, allows, requires, or evaluates. Demonstrate fit through claims about what THE PROJECT delivers, not commentary about what THE SCHEME does. This extends STOP RULE 19 (meta-commentary about scoring) to cover all scheme / support / funder-as-actor narration.

25. **Decorative metaphors for technology, method, or workflow.** "With AI as the engine", "the linchpin of the workflow", "the cornerstone of our approach", "the backbone of the pipeline", "X drives the work" — banned. Metaphor-as-decoration signals AI-voice. Reviewer-PIs name the technology or method directly. "AI-triggered" beats "with AI as the engine". "EHR-integrated" beats "powered by EHR data". "We derive a model from 8,000 records" beats "A sequential applied design drives the work". One precise verb beats one metaphor every time.

26. **Methodological-taxonomy openers — banned (pattern).** Methodology section MUST NOT open with any phrase classifying the study by methodological taxonomy. The PATTERN: \`[Determiner] + [taxonomy modifier(s)] + [study | design | work | approach | research | investigation]\`. Banned taxonomy modifiers (regardless of which determiner or noun follows): sequential, concurrent, quantitative-dominant, qualitative-dominant, mixed-method(s), mixed-methods, applied, basic, exploratory, explanatory, descriptive, observational, interventional, theory-driven, evidence-based, design-based, hypothesis-driven, pragmatist, positivist, implementation, empirical. Specific bad openers (the rule applies regardless of small variations):
    - "A sequential quantitative-dominant applied implementation design..."
    - "A mixed-methods approach grounded in pragmatist epistemology..."
    - "This sequential quantitative-dominant study builds..." (the determiner change from "A" to "This" and noun change from "design" to "study" does not exit the pattern)
    - "The applied empirical investigation..."
    Open Methodology with what the team DOES (action verb + concrete activity): "We derive a model from 8,000 retrospective records, then pilot in 4 clinics." "The team builds a LASSO logistic model from UM Medical Centre data, then audits subgroup fairness." Concrete action verbs over methodological self-classification.

27. **Unbenchmarked numeric KPIs — hard failure (enforced at Word Count step).** Every numeric KPI in submission prose (any percentage, ratio, fold-improvement, or absolute-change claim) MUST satisfy ONE of three forms: (a) baseline + absolute target attached ("from current ~30% UACR follow-up rate to ≥45%, a 15-point absolute increase"), (b) comparator attached ("15-point absolute increase over matched-control clinics during pilot"), or (c) \`[VERIFY: baseline value needed for KPI benchmarking]\` tag attached. ANY of the three satisfies; a KPI with NONE of the three is a hard failure of the round. Bare "raise UACR action by 15%" fails. Bare "improves screening rates 20%" fails. Bare "reduces progression by 30%" fails. The reviewer cannot judge whether 15% is ambitious or sandbagging without context — context is mandatory. **Enforced at the Word Count verification step (see OUTPUT STRUCTURE > Word Count below):** scan all numeric KPIs before declaring word count; if any KPI lacks baseline / comparator / tag, return to the section and add one of the three before output.

28. **Prose-self-commentary — banned (pattern, includes short variants).** Any sentence whose grammatical subject is the prose itself rather than the research is banned. PATTERN: subject is "outputs", "deliverables", "results", "claims", "objectives", "sections", "this section", "this paragraph", "the workflow [self-descriptor]" + verb describing prose quantity / quality / structure. Banned regardless of length:
    - "Outputs stay few because the workflow must be usable." (long form)
    - "Outputs are few." (3-word version of the same pattern — also banned; do not route around STOP RULE 28 by truncating)
    - "Claims are concrete." "Results are quantified." "Objectives are clear."
    - "We keep this section brief because..." "This paragraph addresses..." "The next section discusses..."
    The structure speaks for itself. Self-narrating sentences add zero content; they comment ON the prose instead of producing it. Just produce the outputs / claims / results without commenting on their quantity or quality. If a sentence's grammatical subject is a feature of the prose rather than a feature of the research, cut the sentence and replace with content.

29. **Generic-domain-frame Problem Statement opener — banned (pattern).** Problem Statement MUST NOT open with a sentence whose grammatical subject is a generic country / region / sector and whose predicate is a generic problem-claim. PATTERN: \`[Country | region | sector] + [generic problem verb: faces | suffers | lacks | struggles with] + [generic problem description]\`. Specific bad openers:
    - "Malaysian primary care faces missed and delayed DKD screening action."
    - "DKD screening in Malaysia suffers from passive workflows."
    - "Malaysian healthcare lacks integrated risk-stratification tools."
    - "In Malaysian primary care, screening rates remain low."
    These openings are interchangeable across the 9-13 proposals reviewers see on the same topic per cycle. They communicate nothing distinctive. MUST open with the §3 competitive-differentiator framed as the specific gap in the field. Good openers contain "first", "no current X", "existing X are all Y", "of N published, none Y" — explicit comparative claims that distinguish this proposal from the others. Examples:
    - "No Malaysian DKD risk model has been audited for ethnicity-stratified fairness, leaving Klinik Kesihatan clinicians to apply US-derived thresholds to patients whose subgroup risk may differ."
    - "Of 23 DKD risk models published since 2020, none has been derived from Malaysian primary-care data or audited for subgroup fairness across ethnicity."
    - "Current DKD screening in Malaysian Klinik Kesihatan relies on passive annual UACR/eGFR testing with no risk-prioritisation; the only Asian-derived models (2 of 23 published) exclude the ethnicity stratification this work delivers."
    The first 20-30 words MUST contain the competitive comparator, not the generic problem framing. SUCCESS CRITERIA 10 governs the affirmative requirement; STOP RULE 29 enforces the negative.

30. **Tick-list section structure — banned (elevator-pitch failure).** Sections MUST NOT read as N independent sentences each delivering one rule-compliance element ("first sentence carries the output, second sentence carries the KPI, third sentence carries capacity-building, fourth sentence carries budget anchor"). This pattern is rule-compliant but reads as a checkbox exercise and fails the elevator-pitch criterion that executive summaries must satisfy. Each section is ONE integrated argument; required elements appear embedded in the narrative, not as separate items in a sequence. The test: if removing any one required element from the section still leaves coherent argument prose, the element was integrated; if removing it collapses the prose into disconnected fragments, the section was a stack of items. If you find yourself starting a new sentence to carry a different required element, integrate it into the previous sentence instead. Most-enforced for Expected Output / Outcomes / Implications (high inventory risk: outputs + KPI + capacity-building + budget anchor + implication all required) and Significance of Output (medium inventory risk: cost-of-inaction + adoption pathway + ROV + TRL + policy alignment). Required elements per section are listed under OUTPUT STRUCTURE; the listing is for completeness, not for direct translation to sentence-per-bullet prose.

---

## OUTPUT STRUCTURE

Produce a markdown document titled "# Executive Summary: [Project Title from Proposal_Data §1]" with the following five prose sections, followed by a \`---\` separator, followed by the Promise Registry JSON block. The five sections are aligned to MyGRANTS form D(i)'s stated content requirements (problem statement, objectives, research methodology, expected output/outcomes/implications, significance of output) in that exact order.

The five sections use \`### Section Name\` markdown headers for in-document scannability. The user may strip these headers when pasting to MyGRANTS (the form D(i) field is a single text box) or may keep them as bold-inline labels (\`**Problem Statement.**\`) depending on portal rendering. Either is acceptable.

The word budget per section is fixed. The internal rhythm — how many paragraphs, how many sentences per paragraph, sentence length variation — is yours, subject to the VOICE rules above. Do not impose symmetric paragraph patterns. Vary deliberately.

### Problem Statement
Word budget: 0.20 × {{wordLimit}} words. At {{wordLimit}}=300, target 60 words; hard cap 66. At {{wordLimit}}=500, target 100; hard cap 110. The budget is a function of {{wordLimit}}, not a free range to hit at the upper bound.

Content to include:
- **LEAD with competitive differentiation when §3 carries one.** The first 25-30 words carry the claim that distinguishes this proposal from typical proposals on the same topic (e.g., "first Malaysian fairness-audited DKD risk-action workflow", "first Klinik Kesihatan-deployed AI screening in T2DM care"). Reviewers see 9-13 proposals on similar topics per cycle and form comparative judgment in the opening. Without a differentiator in the first 25-30 words, the proposal reads generic (see SUCCESS CRITERIA item 10).
- The specific Malaysian or local problem in §3's competitive-advantage vocabulary verbatim. Name a beneficiary group, a clinical workflow, or a policy gap that fails today — what fails, who notices, when.
- The funder priority terms verbatim from §2 where they anchor the problem framing (e.g., "exploratory and transformative research", "TRL 2 to TRL 3" for GET). Embed the priority terms inside concrete claims; do not narrate the scheme requirement back to the funder (STOP RULE 24).
- The project's core proposition as a declarative claim using the verb the funder rewards (for GET: "develops", "transforms", "delivers", not "explores" or "investigates"). Avoid decorative metaphors ("X as the engine", "X drives the work" — STOP RULE 25).

Open on the specific problem AND its differentiator from competing approaches, not on the abstract domain. Do not start with "In..." or "Research has shown" or "Recent advances". The first sentence names the real problem and why this team's approach is not the same as the other 9 proposals on similar problems.

### Objectives
Word budget: 0.10 × {{wordLimit}} words. At {{wordLimit}}=300, target 30 words; hard cap 33. At {{wordLimit}}=500, target 50; hard cap 55.

Content to include:
- The central research question from §4, paraphrased only to fit length; numeric figures preserved exactly.
- The central hypothesis or expected finding.

Shortest section. One declarative move per element. Do not pad.

### Research Methodology
Word budget: 0.30 × {{wordLimit}} words. At {{wordLimit}}=300, target 90 words; hard cap 99. At {{wordLimit}}=500, target 150; hard cap 165. Largest section. This is where reviewers decide execution-readiness.

Content to include:
- The core method named precisely (LASSO logistic, retrospective cohort, prospective RCT, in-vitro assay, etc.). Name the specific class, not "a machine learning approach" or "advanced analytics".
- The analytical population or sample size from §4 verbatim, committed to ONE number (e.g., "8,400 UM Medical Centre records" not "5,000-10,000 records"). Reviewers reward commitment.
- One technical pillar named precisely (e.g., "TRIPOD+AI compliance", "subgroup fairness audit across ethnicity, sex, and clinic-resource strata", "decision-curve analysis at probability thresholds 0.1 to 0.3").
- **REQUIRED: ONE load-bearing execution-credibility signal.** Options: registered protocol, NMRR pathway, named co-investigator institutional access, single PI-track-record clause from §11 (e.g., "the team's prior 3-clinic DKD audit work in Selangor (2024)"), partner-access clause from §6 (e.g., "via the Klinik Kesihatan network coordinated through Malaysian Primary Care Digital Health Unit"). One clause only. If none of these is available from Proposal_Data, tag with \`[USER INPUT NEEDED: one execution-credibility signal needed for methodology]\` and continue — do NOT omit. A methodology section without ANY credibility signal leaves reviewers wondering "why this team" before the form's separate team section (E/F) is open. Round 21.2 removed the dedicated Team & Partnership section from D(i); this clause is what compensates.
- **Avoid textbook-label methodology openers** (STOP RULE 26). Do not open with "A sequential quantitative-dominant applied implementation design drives the work" or similar abstract methodological self-classification. Open with what the team does: "We derive a model from 8,000 retrospective T2DM EHR records, then pilot the workflow in 4 Klinik Kesihatan sites." Concrete action verbs over methodological labels.

Specificity matters most here. If a sentence could appear in any clinical-AI proposal, rewrite it with the actual mechanism, dataset, or assay named.

### Expected Output / Outcomes / Implications
Word budget: 0.20 × {{wordLimit}} words. At {{wordLimit}}=300, target 60 words; hard cap 66. At {{wordLimit}}=500, target 100; hard cap 110.

**This section is the elevator pitch's payoff line.** NOT a tick-list of deliverables (STOP RULE 30). Write it as ONE integrated argument linking outputs to their measurable impact for a named beneficiary, so a reviewer at 11pm thinks "this project matters and the team can do it." 2-3 connected sentences where each sentence advances the case. NOT one sentence per required element.

Required elements (integrated into 2-3 sentences, NOT as separate sentences each carrying one element):
- 1 to 2 concrete outputs from §4's expected-outputs list, quantified.
- KPI benchmarking for every numeric figure (per STOP RULE 27): baseline+target, comparator, or \`[VERIFY: baseline value needed for KPI benchmarking]\` tag.
- ONE capacity-building output (1 PhD GRA, 1 Masters, N clinic-staff trained, named institutional curriculum integration). If §4/§5 carries one, use verbatim. If neither, tag with \`[USER INPUT NEEDED: capacity-building output count and type needed for 3-year project]\`.
- Optional: budget anchor referencing scheme ceiling, ONE clause only if it strengthens the case.
- The implication for the field, system, or named beneficiary, as a single concrete consequence.

**Bad (rule-compliant but tick-list, fails STOP RULE 30):**
"By month 36, the project delivers 1 IP filing for the risk-action ruleset and trains 1 PhD GRA as the analytics continuity holder. The pilot targets a 15-point UACR action increase over baseline usual-care patterns, \`[VERIFY: baseline value needed]\`. Outputs sit within RM243,000 against the RM250,000 GET ceiling."
↑ Three detached sentences, each carrying one required element. Reads as checkbox exercise. Reviewer sees a list of compliance items, not an argument.

**Good (integrated argument, passes STOP RULE 30):**
"Within 36 months and within the RM250,000 GET ceiling, the project delivers a fairness-audited DKD risk-action workflow ready for MOH primary-care adoption review — currently the only Asian-derived alternative to US/EU-trained models. The pilot demonstrates a 15-point UACR action increase over the current ~30% Klinik Kesihatan baseline \`[VERIFY: baseline value needed]\`, with 1 PhD GRA trained as the institutional continuity holder for adoption beyond month 36."
↑ Two integrated sentences. Outputs, KPI, capacity-building, budget anchor, and implication ALL embedded in narrative. Argues for impact AND feasibility.

The test: if your draft reads as a sequence of independent sentences each carrying one required element, STOP RULE 30 failed. Rewrite as integrated narrative. This section names WHAT the project produces; the next section (Significance of Output) names WHY that production matters.

### Significance of Output
Word budget: 0.20 × {{wordLimit}} words. At {{wordLimit}}=300, target 60 words; hard cap 66. At {{wordLimit}}=500, target 100; hard cap 110.

This is the section MyGRANTS form D(i) explicitly names "kepentingan output daripada projek penyelidikan" / "significance of output from the research project". It is NOT interchangeable with Expected Output. Expected Output names what gets produced; Significance names why that production matters for a specific person making a specific decision.

**This section is the elevator pitch's "why this matters" close.** NOT a tick-list of impact angles (STOP RULE 30). Write it as ONE integrated argument linking the cost of inaction for a named beneficiary to the specific adoption mechanism that delivers Return of Value. 2-3 connected sentences. Opening sentence names beneficiary + cost-of-inaction; subsequent sentences name the adoption pathway, ROV mechanism, and TRL exit state EMBEDDED in deliverable language — NOT as separate items each in its own sentence.

Content to include (integrated into 2-3 sentences per the directive above, NOT as separate sentences each carrying one element):
- The concrete consequence of NOT doing this work, named for a specific beneficiary (e.g., "clinicians at Klinik Kesihatan", not "stakeholders") and a specific decision point (e.g., "before eGFR crosses 60", not "in clinical practice").
- The adoption pathway: who uses the output after the grant, and through which institutional route (e.g., "KKM primary-care SOP through MOH Family Health Development Division", or "MOH policy unit through Malaysian Primary Care Digital Health Unit liaison"). A partner-name clause from §6 fits here if the partner is the adoption route.
- The funder's ROV phrasing verbatim from §2 (for GET: "Return of Value" or "ROV"). Significance is where ROV does its work — name the value that returns, to whom, and through what mechanism.
- **TRL exit state EMBEDDED as deliverable claim, NOT announced as scheme compliance.** Bad: "This work moves TRL 2 to TRL 3 per GET Transformative requirements" (STOP RULE 24 — funder rubric narration). Good: "TRL 3 (proof-of-concept demonstrated in 4 Klinik Kesihatan sites with measured workflow uptake) by month 36" (same content, embedded in concrete deliverable language). One clause only.
- Optional, only if it strengthens the case: policy alignment (MADANI, RPTM, MySTIE, SDG 3) as a single clause, not a paragraph. Avoid generic alignment language ("aligned with MADANI principles") — name the specific policy mechanism the work supports (e.g., "supports KKM's National Diabetes Action Plan 2026-2030 primary-care screening pillar").

### Word Count

After the five prose sections, on its own line, in this exact format:

\`**Word count:** Problem N1 + Objectives N2 + Methodology N3 + Expected N4 + Significance N5 = TOTAL / {{wordLimit}}\`

Where N1 through N5 are the actual word counts of the five sections (Problem Statement, Objectives, Research Methodology, Expected Output / Outcomes / Implications, Significance of Output respectively) and TOTAL is their arithmetic sum.

**Mandatory verification protocol.** Before writing this line: (a) count words in each section by reading the section back, AND (b) scan all numeric KPIs in the prose and verify each carries baseline OR comparator OR \`[VERIFY: ...]\` tag per STOP RULE 27. Show the arithmetic in the format above. Four hard failures around this line:
1. Declaring a TOTAL that does not equal the actual sum of words in the five sections within ±2 words is a hard failure.
2. Declaring a TOTAL that exceeds {{wordLimit}} is a hard failure; return to the longest section and cut before submitting output.
3. Omitting the per-section enumeration (writing "295 / 300" instead of "Problem 60 + Objectives 30 + Methodology 90 + Expected 60 + Significance 60 = 300 / 300") is a hard failure.
4. Outputting any numeric KPI without baseline, comparator, OR \`[VERIFY: baseline value needed]\` tag is a hard failure (STOP RULE 27). Scan the prose for percentages, ratios, fold-changes, and absolute-improvement claims before declaring word count; add benchmarking or tag to any unbenchmarked KPI before output.

The user strips this line before pasting the prose to the MyGRANTS abstract field. Title line is not counted unless {{wordLimit}} represents the funder's inclusive abstract capacity.

---

## PROMISE REGISTRY (internal verification, not for submission)

After the prose and word-count line, output a \`---\` separator, then this section:

\`\`\`
---

## Promise Registry — Internal Verification Only (strip before assembly)

This block records every substantive claim made in the executive summary prose, the downstream Phase 5 step that must defend the claim, and the Proposal_Data.md section that supplies the evidence. Step 8 Final Assembly verifies that every claim here is honoured by the relevant downstream draft.

\`\`\`

Then the fenced JSON code block with the following schema:

\`\`\`json
{
  "claims": [
    {
      "claim_id": "C1",
      "claim_text": "<verbatim claim text from the executive-summary prose, including any inline bracket tags>",
      "downstream_anchor": "Methods (Step 3) | Background (Step 4) | Impact (Step 5) | Budget Justification (Step 6) | Supporting Documents (Step 7) | Final Assembly (Step 8)",
      "evidence_source": "Proposal_Data.md §<n>",
      "claim_type": "factual | methodological | impact | team | partnership | ip | budget | compliance"
    }
  ]
}
\`\`\`

Schema rules:
- \`claim_id\` is a stable identifier (C1, C2, C3, …) in order of first appearance in the prose.
- \`claim_text\` is the substantive claim verbatim from the prose, trimmed to a single sentence. Hooks, transitions, and rhetorical filler do not become claims.
- \`downstream_anchor\` is one of the six enum values above. Pick the single most appropriate downstream section.
- \`evidence_source\` references Proposal_Data.md sections (§1 through §13). Reference the most specific section that supplied the fact.
- \`claim_type\` is one of the eight enum values. Helps Step 8 Final Assembly group claims for verification.

Produce 8-12 claims for a standard executive summary. Fewer than 6 indicates under-development. More than 12 indicates the prose is over-claiming; remove the weakest two until the strongest claims have room to breathe.

---

## FINAL INSTRUCTIONS

Output a single markdown document. Title is "# Executive Summary: [Project Title]". Then the five prose sections in order. Then the word-count line. Then a \`---\` separator. Then the Promise Registry section with its prose preamble and the fenced JSON block. Do not add a preamble. Do not summarise what you just did. Do not include source attributions inside the submission prose; attributions live in the Promise Registry's \`evidence_source\` field only.
`,
};
