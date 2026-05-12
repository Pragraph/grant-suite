import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step2-executive-summary",
  phase: 5,
  step: 2,
  name: "Executive Summary Writer",
  description:
    "Draft a reviewer-grade executive summary with GET-weight-driven word allocation, anti-AI-voice discipline (Writer-Voice canonical), canonical tag handling, and a Promise Registry that Steps 3-8 must defend.",
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
- **§6 Partnership & Collaboration** → partner organisation name and operational contribution. The funder requires industry/agency collaboration evidence; the executive summary names the partner and their concrete contribution.
- **§7 Novelty & IP Landscape** → novelty claim, IP filing intent.
- **§11 Researcher Profile** → when present, extract verbatim PI track-record fact for the Team & Partnership section. When §11 carries a \`[USER INPUT NEEDED: ...]\` absence tag (Researcher_Profile.md not provided), preserve the absence with a fresh tag in this output and do not invent metrics.

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

1. **Prose word count within budget.** Total prose (above the \`---\` separator, excluding the title line) is between 90% and 100% of {{wordLimit}}. Hitting 280 words against a 300-word limit is acceptable; 240 words is under-developed and fails.
2. **Funder vocabulary mirrored verbatim.** Priority terminology, scheme name, score-weight category names, ROV phrasing — all appear in the executive summary in their exact §2-source form. A reviewer reading the executive summary sees their own assessment criteria reflected back.
3. **Numeric agreement with §5 JSON.** Every effort percentage, team-member role count, budget total, and ceiling reference matches the embedded JSON exactly. No paraphrasing of numbers.
4. **Section structure mandatory.** Five sections in this exact order: Opening Frame, Objectives & Hypothesis, Methodology Preview, Expected Results & ROV Preview, Team & Partnership. No reordering. No skipping. No section title variation.
5. **GET weight allocation honoured.** When \`grantScheme = GET\`, word distribution across the five sections approximates 20/10/25/25/20. Methodology Preview and Expected Results & ROV each receive ~25% of the word budget because they map to the highest-weighted GET score items (20% each).
6. **Promise Registry complete.** Every substantive claim in the executive summary has a corresponding row in the Promise Registry JSON with a downstream-step anchor and a Proposal_Data.md evidence source. Claims about methodology anchor to Methods (Step 3), claims about ROV anchor to Impact (Step 5), claims about IP anchor to Background (Step 4), claims about cost-effectiveness anchor to Budget Justification (Step 6), claims about team or partnership anchor to Supporting Documents (Step 7).
7. **Tag discipline.** Bracket tags appear ONLY in narrative prose paragraphs, NEVER as free-floating JSON keys or values in the Promise Registry. Tag names are canonical UPPERCASE with mandatory colon-hint: \`[CITATION NEEDED: <hint>]\`, \`[USER INPUT NEEDED: <what to confirm>]\`, \`[VERIFY: <hint>]\`. Bare \`[CITATION NEEDED]\` is a hard failure.
8. **PI track record verbatim.** Team & Partnership section preserves any PI track-record fact from Proposal_Data §11 in its source form (e.g., "5 publications" not "extensive publication record"). If §11 carries an absence tag, this section carries the same tag forward and does not invent credibility.
9. **Voice discipline.** The prose does not betray AI authorship. Sentence length varies (mix of short and long, occasional fragment). Paragraphs are not symmetric. No banned words or banned constructions appear. Specific numbers and named mechanisms replace abstractions where source data exists. Hedge constructions are absent. A reviewer reading the first two paragraphs does not pattern-match to AI.

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

16. **Section reordering or skipping.** The five sections appear in this exact order: Opening Frame, Objectives & Hypothesis, Methodology Preview, Expected Results & ROV Preview, Team & Partnership. A section with thin source material is shorter, not omitted.

17. **Source attribution in submission prose.** "(from Proposal_Data §3)" inside the executive-summary prose is a hard failure. Attributions live in the Promise Registry's \`evidence_source\` field, never in the prose the user copies to the funder portal.

---

## OUTPUT STRUCTURE

Produce a markdown document titled "# Executive Summary: [Project Title from Proposal_Data §1]" with the following five prose sections, followed by a \`---\` separator, followed by the Promise Registry JSON block.

The five sections appear in this exact order. The word budget per section is fixed. The internal rhythm — how many paragraphs, how many sentences per paragraph, sentence length variation — is yours, subject to the VOICE rules above. Do not impose symmetric paragraph patterns. Vary deliberately.

### Opening Frame
Word budget: ~{{wordLimit}} × 0.20 (60-100 words when {{wordLimit}} = 300-500).

Content to include:
- The specific Malaysian or local problem in §3's competitive-advantage vocabulary verbatim. Name a beneficiary group, a clinical workflow, or a policy gap that fails today.
- The funder priority terms verbatim from §2 (e.g., "exploratory and transformative research", "Return of Value", "TRL 2 to TRL 3" for GET).
- The project's core proposition as a declarative claim using the verb the funder rewards (for GET: "develops", "transforms", "delivers", not "explores" or "investigates").

Open on the specific, not the abstract. Do not start with "In..." or "Research has shown" or "Recent advances". The first sentence names a real problem in concrete terms.

### Objectives & Hypothesis
Word budget: ~{{wordLimit}} × 0.10 (30-50 words when {{wordLimit}} = 300-500).

Content to include:
- The central research question from §4, paraphrased only to fit length; numeric figures preserved exactly.
- The central hypothesis or expected finding.

Shortest section. One declarative move per element. Do not pad.

### Methodology Preview
Word budget: ~{{wordLimit}} × 0.25 (75-125 words when {{wordLimit}} = 300-500). Highest-weight section after Expected Results.

Content to include:
- The core method named precisely (LASSO logistic, retrospective cohort, prospective RCT, in-vitro assay, etc.). Name the specific class, not "a machine learning approach" or "advanced analytics".
- The analytical population or sample size from §4 verbatim (e.g., "8,400 UM Medical Centre records" not "a large retrospective dataset").
- One technical pillar named precisely (e.g., "TRIPOD+AI compliance", "subgroup fairness audit across ethnicity, sex, and clinic-resource strata", "decision-curve analysis at probability thresholds 0.1 to 0.3").
- One reviewer-credibility signal (registered protocol, NMRR pathway, named co-investigator institutional access).

This section is where the reviewer decides whether the project is execution-ready. Specificity matters most here. If a sentence could appear in any clinical-AI proposal, rewrite it with the actual mechanism, dataset, or assay named.

### Expected Results & ROV Preview
Word budget: ~{{wordLimit}} × 0.25 (75-125 words when {{wordLimit}} = 300-500). Highest-weight section, ties with Methodology.

Content to include:
- Concrete outputs from §4's expected-outputs list, quantified (e.g., "≥2 Q1 publications, 1 patent filing, 1 trained PhD, an SOP toolkit deployable in 4-6 Klinik Kesihatan sites").
- The primary beneficiary group named specifically (KKM, primary-care clinicians at Klinik Kesihatan, T2DM patients with eGFR <60, MOH policy unit). "Stakeholders" or "the broader community" fails.
- The concrete consequence of NOT doing this work, named for a specific beneficiary and a specific decision point.
- The funder's ROV phrasing verbatim from §2 (for GET: "Return of Value" or "ROV").

### Team & Partnership
Word budget: ~{{wordLimit}} × 0.20 (60-100 words when {{wordLimit}} = 300-500).

Content to include:
- One verbatim PI track-record fact from §11 (one specific metric with a citation source, not "extensive experience"). When §11 carries a \`[USER INPUT NEEDED: ...]\` tag, this section preserves the absence with a fresh tag for the missing metric.
- Team composition from §5 in funder-relevant form (e.g., "Seven-member team across three Malaysian institutions, PI 25%, four Co-Investigators at 15/15/15/10%, mentor 5%, continuity successor 5%").
- The partner organisation name from §6 and their concrete operational contribution (e.g., "Malaysian Primary Care Digital Health Unit provides clinic-network access, EHR field-mapping support, and pilot-feedback liaison").

### Word Count

After the five prose sections, on its own line:

\`**Word count:** <prose word count> / {{wordLimit}}\`

The prose word count covers the five sections from "Opening Frame" through the last sentence of "Team & Partnership". Title line is not counted unless {{wordLimit}} represents the funder's inclusive abstract capacity.

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
