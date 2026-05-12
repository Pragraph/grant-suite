import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase5.step1-data-compiler",
  phase: 5,
  step: 1,
  name: "Proposal Data Compiler",
  description:
    "Aggregate upstream Phase 1-4 documents into a reviewer-grade Proposal_Data.md, embedding canonical JSON anchors verbatim. Single source of truth for Phase 5 Steps 2-8.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "budgetRange",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
    "Budget_Justification.md",
    "Budget_Draft.md",
    "Team_Strategy.md",
    "Partnership_Plan.md",
    "Patent_Analysis.md",
    "SDG_Alignment.md",
    "National_Alignment.md",
    "KPI_Plan.md",
    "Researcher_Profile.md",
    "grantScheme",
    "grantSubCategory",
    "Method4_Convergence_Synthesis.md",
    "Method1_Gap_Synthesis.md",
    "Method2_Trend_Discovery.md",
    "Method3_Research_Direction_Brief.md",
  ],
  outputName: "Proposal_Data.md",
  epTags: ["EP-01", "EP-02", "EP-03", "EP-04", "EP-05", "EP-06", "EP-07", "EP-08", "EP-09", "EP-10"],
  estimatedWords: 10000,
  template: `You are a research proposal compiler. Your task is to aggregate upstream planning documents into a single reviewer-grade reference document, **Proposal_Data.md**, which serves as the sole input for every downstream writing step in Phase 5 (executive summary, methods, background, impact, budget justification, supporting documents, final assembly).

This document is the single source of truth for seven downstream writers. Reviewer-grade or fail.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if budgetRange}}- **Budget Range:** {{budgetRange}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

---

## SOURCE DOCUMENTS

### Grant Intelligence (Phase 1)
{{> Grant_Intelligence.md}}

### Proposal Blueprint (Phase 2)
{{> Proposal_Blueprint.md}}

### Research Design (Phase 3)
{{> Research_Design.md}}

### Budget Justification (Phase 4 Step 3)
{{> Budget_Justification.md}}

{{#if Budget_Draft.md}}
### Budget Draft (Phase 4 Step 2)
{{> Budget_Draft.md}}
{{/if}}

{{#if Team_Strategy.md}}
### Team Strategy (Phase 4 Step 1)
{{> Team_Strategy.md}}
{{/if}}

{{#if Partnership_Plan.md}}
### Partnership Plan (Phase 3A)
{{> Partnership_Plan.md}}
{{/if}}

{{#if Patent_Analysis.md}}
### Patent & Novelty Analysis (Phase 3B)
{{> Patent_Analysis.md}}
{{/if}}

{{#if SDG_Alignment.md}}
### SDG Alignment (Phase 3C)
{{> SDG_Alignment.md}}
{{/if}}

{{#if National_Alignment.md}}
### National Priority Alignment (Phase 3C)
{{> National_Alignment.md}}
{{/if}}

{{#if KPI_Plan.md}}
### KPI Plan (Phase 3C)
{{> KPI_Plan.md}}
{{/if}}

{{#if Researcher_Profile.md}}
### Researcher Profile (Phase 3C)
{{> Researcher_Profile.md}}
{{/if}}

{{#if Method4_Convergence_Synthesis.md}}
### Research Discovery — Convergence Synthesis (Phase 1)
{{> Method4_Convergence_Synthesis.md}}
{{/if}}

{{#unless Method4_Convergence_Synthesis.md}}
{{#if Method1_Gap_Synthesis.md}}
### Research Discovery — Gap-Based Discovery (Phase 1)
{{> Method1_Gap_Synthesis.md}}
{{/if}}

{{#if Method2_Trend_Discovery.md}}
### Research Discovery — Trend-Based Discovery (Phase 1)
{{> Method2_Trend_Discovery.md}}
{{/if}}

{{#if Method3_Research_Direction_Brief.md}}
### Research Discovery — Research Direction Brief (Phase 1)
{{> Method3_Research_Direction_Brief.md}}
{{/if}}
{{/unless}}

---

## CANONICAL DATA SOURCES (read these first)

Two upstream documents may carry fenced JSON blocks that hold canonical numeric and structural truth. When present, these JSON blocks supersede any prose representation of the same facts. Read them BEFORE composing any numeric content in this compilation.

{{#if Budget_Draft.md}}
**Budget_Draft.md** (Phase 4 Step 2) contains three parts: narrative tables (Part 1), prose notes (Part 2), and a fenced JSON code block (Part 3) titled "Machine-readable budget JSON". From the Part 3 JSON, extract:

- \`budget_rows[].category\`, \`item\`, \`amounts\`, \`vot\`, \`justification\` — one entry per requested line item. Vot codes appear verbatim in this compilation (e.g., "Vot 11000" not "Vot 1100" or "personnel vot").
- \`budget_summary.by_category\`, \`budget_summary.grand_total\`, \`budget_summary.by_year\` — canonical totals. Use these exact numbers everywhere.
- \`compliance.ceiling\`, \`compliance.travel_pct\`, \`compliance.equipment_pct\`, \`compliance.indirect_pct\`, \`compliance.notes\` — canonical compliance facts. Do not recompute percentages from category totals.
{{/if}}

{{#if Team_Strategy.md}}
**Team_Strategy.md** (Phase 4 Step 1) contains a fenced JSON code block titled "Recommended Role Matrix scaffold". From it, extract:

- \`recommended_roles[].role\`, \`responsibility\`, \`suggested_effort_pct\` — one entry per team member. The \`suggested_effort_pct\` value appears verbatim in §5.
{{/if}}

**Embedding rule.** §5 of this compilation embeds these upstream JSON blocks **verbatim**, wrapped in their original triple-backtick fences with their original titles. Downstream writers (Steps 2 through 8) read them the same way Phase 4 Step 3 does. Do not paraphrase. Do not re-render as markdown tables. Do not strip fields. Do not change field order.

**Absence rule.** If a numeric or structural fact is required by a section below but is absent from the injected JSON blocks and absent from the prose source documents, tag the fact with \`[USER INPUT NEEDED: <what to confirm>]\` (canonical UPPERCASE with colon-hint) and proceed. Do not invent.

---

## SUCCESS CRITERIA

Your output succeeds when:

1. **Numeric agreement with upstream JSON.** Every amount, Vot code, percentage, and effort figure in this compilation matches the source JSON exactly. A grants-office reviewer comparing this document to Budget_Draft.md Part 3 JSON and Team_Strategy.md Section 7 JSON finds zero discrepancies.
2. **Source attribution at first appearance.** Every preserved number, named person, partner organization, and date carries a parenthetical source reference at first appearance, e.g. "MYR 239,000 (from Budget_Justification.md §1)" or "Prof Aishah Mohammad, UM Department of Nephrology (from Team_Strategy.md §2)".
3. **JSON embedding verbatim.** §5 contains the upstream JSON blocks with their original triple-backtick fences and original titles. The blocks are not paraphrased, re-rendered as tables, or partially extracted.
4. **Cross-Reference Matrix is operational.** §12's table uses three Status values only: ✓, ✗, or "Pending verification". No bracket tags inside table cells. Tag-bearing concerns route to §13.
5. **Verification Items consolidated.** §13 enumerates every \`[VERIFY: ...]\` and \`[USER INPUT NEEDED: ...]\` tag in the compilation, with the responsible party named (PI, RMC, TTO, Bursar, Graduate School, HR, Partner, Ethics Committee, Institutional Data Unit), suitable to hand directly to the named party without further editing.
6. **PI track record verbatim.** §11 (when present) carries the PI's track record extracted verbatim from Researcher_Profile.md. No metric inflation. No reframing facts to fit grant criteria more flatteringly than the source supports.
7. **Tag discipline.** Bracket tags appear ONLY in narrative prose paragraphs, NEVER inside markdown table cells. Tag names are canonical UPPERCASE with mandatory colon-hint. Bare \`[VERIFY]\` is a hard failure.
8. **Funder-prohibition compliance.** If the funder prohibits indirect costs, the compilation does not include an Indirect Costs row in §5. If no equipment is requested, §5 does not include an Equipment row. State the absence in one prose sentence and move on.

---

## CONSTRAINTS

- **No invented numbers, names, or affiliations.** Every amount, percentage, effort figure, person name, partner organization, and date traces to a source document. If a fact is missing, tag with \`[USER INPUT NEEDED: <what to confirm>]\` or \`[VERIFY: <hint>]\` and continue. Do not interpolate.
- **JSON embedding verbatim.** When Budget_Draft.md or Team_Strategy.md is present, embed their fenced JSON blocks in §5 unchanged. Same triple-backtick fence, same language tag, same title. No partial extraction. No re-rendering as tables.
- **Source attribution at first appearance.** Every preserved number, named person, partner, and date carries a parenthetical source reference at first appearance. Subsequent appearances need no repeat attribution.
- **Bracket tags inline in prose only.** Place tags in narrative paragraphs ONLY. Never inside markdown table cells in §2 (word-limits table), §4 (work-packages table), §6 (partners table), §10 (KPIs table), §11 (recent-grants table), §12 (Cross-Reference Matrix), or §13 (Verification Items). Tags inside table cells break pipe-delimited parsing and the in-app placeholder resolver cannot act on them reliably.
- **Canonical tag syntax mandatory.** Use ONLY the five canonical UPPERCASE forms with colon-hint: \`[CITATION NEEDED: <hint>]\`, \`[USER INPUT NEEDED: <what to confirm>]\`, \`[VERIFY: <hint>]\`, \`[ESTIMATED: <hint>]\`, \`[CHECK DATE: <hint>]\`. Lowercase variants and bare forms are NEVER recognized by the in-app placeholder resolver and render as inert prose.
- **PI track record verbatim.** §11 preserves Researcher_Profile.md content. Reframing for clarity is fine. Inflating metrics or claims is not. "5 publications, 23 citations (Scopus, 2026)" passes. "Extensive publication record with growing citation impact" fails.
- **Funder-prohibition compliance.** If the funder prohibits a category (e.g., MOHE GET prohibits indirect costs and overheads), the compilation does not include that category in §5. State the absence in prose. No zero-row entries.
- **Active voice, present tense.** "The team requests MYR 239,000" not "MYR 239,000 has been requested". Improves reviewer comprehension and matches funder writing conventions.

---

## STOP RULES

Do not produce any of the following. Each is a failure of the round:

1. **Generalized numbers when source carries the exact value.** "Approximately MYR 250,000", "around RM240k", "circa 25% effort" are banned when the source JSON or prose carries the exact value. Use the exact value or tag with \`[USER INPUT NEEDED: <what to confirm>]\` if the source is genuinely missing.
2. **Re-rendered JSON.** Do not extract the fenced JSON blocks, parse them in your head, and rewrite as markdown tables in §5. Embed the original fenced blocks verbatim.
3. **Bracket tags inside markdown table cells.** Tags belong in adjacent prose, not inside cells. A tag inside a cell breaks pipe-delimited parsing.
4. **Hybrid Status values in §12 Cross-Reference Matrix.** "✓ / [VERIFY]", "✓ pending", "✓ subject to verification" are not Status values. Use ✓, ✗, or "Pending verification" only. Tag-bearing items route to §13.
5. **Bare \`[VERIFY]\` or \`[USER INPUT NEEDED]\` without colon-hint.** Every tag carries a specific question. \`[VERIFY: confirm partner letter received]\` passes. \`[VERIFY]\` fails.
6. **Lowercase or non-canonical tag names.** \`[verify]\`, \`[needs citation]\`, \`[check this]\` are silently ignored by the in-app placeholder resolver.
7. **Fabricated names, affiliations, or partner organizations.** If a Co-Investigator name is absent from Team_Strategy.md JSON and prose, do not invent. Tag with \`[USER INPUT NEEDED: confirm Co-I N name and affiliation]\`.
8. **Embellished PI track record.** §11 preserves what Researcher_Profile.md states. Reframing "5 publications in past 3 years" as "demonstrated research productivity in past 3 years" passes (still verifiable). Reframing "5 publications" as "extensive publication record" fails (claim exceeds source).
9. **Generic compilation prose.** "This compilation brings together the upstream documents to support proposal writing" is banned. Every line of every section has specific content, named entities, exact numbers, or a tagged absence.
10. **Banned value-laden phrases.** "world-class", "cutting-edge", "transformative impact" (as decoration), "leveraging" (as verb), "synergies", "robust" (unspecified), "seamlessly", "ecosystem", "best practices" (unspecified), "powerful" — all banned. Concrete language only. This rule binds the compilation; downstream writers inherit it.
11. **Section reordering or skipping.** The §1 through §13 structure below is mandatory and ordered. A section with no available source data states the absence in one prose sentence and is retained for downstream-step navigation consistency.
12. **Carrying forward unresolved upstream tags as resolved.** If Budget_Justification.md contains \`[USER INPUT NEEDED: confirm GRA effort percentage]\`, this compilation preserves it in §5 prose or §13 Verification Items. Do not paper over with a guess.

---

## OUTPUT STRUCTURE

Produce a markdown document titled "# Proposal Data Compilation: [Project Title from Proposal_Blueprint.md]" with the following 13 sections in this exact order.

### §1 — Project Overview

Three short paragraphs:

- **Paragraph 1:** Project title (verbatim from Proposal_Blueprint.md), discipline, target grant scheme, funder, country, duration, and ceiling amount (with source attribution). One fact per sentence.
- **Paragraph 2:** Research summary in 3-5 sentences, drawn from Proposal_Blueprint.md narrative arc. A reviewer reading this paragraph alone understands what the project does and why.
- **Paragraph 3:** The single most important innovation or unique contribution, stated in one sentence with no embellishment. If the source documents support multiple candidate framings, pick the one most aligned with the funder's stated priorities and note the choice with \`[VERIFY: confirm framing emphasis with PI]\`.

### §2 — Funder Intelligence Summary

From Grant_Intelligence.md:

- **Funder priorities** as a bulleted list with weights when published (e.g., "Methodology: 20%, Expected Results/ROV: 20%, Background: 15%"). Preserve verbatim percentages.
- **Word limits and formatting requirements** per section, as a small table with columns Section | Word Limit | Format Notes. No tags in cells.
- **Reviewer expectations** in 3-5 bullets, each one specific behavior or check a reviewer performs.
- **Submission window and key dates.** Apply \`[CHECK DATE: <hint>]\` in adjacent prose to any date older than 3 months from today's date.

### §3 — Strategic Positioning

From Proposal_Blueprint.md:

- **Competitive advantage** in one paragraph: what this proposal does better than the comparable proposals the funder receives.
- **Narrative arc** as 5-7 numbered beats (problem → gap → opportunity → approach → method → outcome → impact) with one sentence per beat.
- **Key claims the proposal must support** as a bulleted list of 6-10 claims. Each claim is one sentence. These claims become §12 Cross-Reference Matrix anchors.

### §4 — Research Design Summary

From Research_Design.md:

- **Research questions or hypotheses** verbatim from source, numbered.
- **Methodology overview** in one paragraph naming the core method (retrospective cohort, prospective RCT, in-vitro assay, etc.) and the key technical pillars (AI/ML model class, biomarker panel, sample size estimate).
- **Work packages and timeline** as a table with columns WP # | Title | Duration | Lead Role. No tags in cells. Route gaps to §13.
- **Expected outputs and deliverables** as a bulleted list. Quantify where possible (e.g., "≥2 Q1 publications, 1 patent filing, 1 trained PhD").

### §5 — Team & Budget Summary

This section embeds upstream JSON blocks verbatim.

{{#if Team_Strategy.md}}
**Team composition.** Write one short prose paragraph summarizing team size, total effort, and the institutional spread (e.g., "Seven-member team across three Malaysian institutions, total effort 95% with PI 25%, four Co-Is at 15/15/15/10%, Mentor 5%, Successor 5%"). Then embed the "Recommended Role Matrix scaffold" fenced JSON block from Team_Strategy.md verbatim immediately below, preserving its original triple-backtick fence, language tag, and section heading.
{{/if}}

{{#unless Team_Strategy.md}}
**Team composition.** Team_Strategy.md was not provided. Tag with \`[USER INPUT NEEDED: provide Team_Strategy.md from Phase 4 Step 1 or supply team scaffold manually]\` and continue. Pull whatever team information Budget_Justification.md §2 carries in prose form, with each role tagged \`[VERIFY: confirm against Team_Strategy.md when canonical source loaded]\`.
{{/unless}}

{{#if Budget_Draft.md}}
**Budget summary.** Write one short prose paragraph stating grand total against ceiling and the principal cost-shape decision (e.g., "MYR 239,000 against the MYR 250,000 GET ceiling, lean-personnel cost shape with no equipment or indirect costs requested"). Then embed the "Machine-readable budget JSON" Part 3 fenced block from Budget_Draft.md verbatim immediately below, preserving its original triple-backtick fence, language tag, and Part 3 heading.
{{/if}}

{{#unless Budget_Draft.md}}
**Budget summary.** Budget_Draft.md was not provided. Compose a fallback summary from Budget_Justification.md prose:
- **Total budget** with source attribution. Tag with \`[VERIFY: confirm grand total matches Budget_Draft.md when canonical source loaded]\`.
- **Per-category totals** as a bulleted list (Personnel: RM X, Travel: RM Y, etc.). Tag each with \`[VERIFY: ...]\` because the canonical JSON was not loaded.
- **Vot codes** as listed in Budget_Justification.md, or tagged \`[USER INPUT NEEDED: confirm Vot codes per category]\` if absent.
{{/unless}}

**Key justification points** in 3-5 bullets, each pointing to a specific budget line and its activity linkage to a Research Design work package. Source: Budget_Justification.md §2 through §7.

{{#if Partnership_Plan.md}}
### §6 — Partnership & Collaboration

From Partnership_Plan.md:

- **Partner organizations** as a table with columns Partner | Type (industry / academic / community) | Role in project | Letter status (✓ / ✗ / Pending verification). No tags in cells.
- **Collaboration framework** in one paragraph: how the partnerships fit the funder's evidence-of-collaboration requirement.
- **Letters of support outstanding** as a bulleted list naming each missing letter with a target date, or tag in adjacent prose \`[USER INPUT NEEDED: confirm letter target date for <partner>]\`.
{{/if}}

{{#if Patent_Analysis.md}}
### §7 — Novelty & IP Landscape

From Patent_Analysis.md:

- **Key prior art findings** in one paragraph: the closest 2-3 existing patents or publications and what they do.
- **Novelty claims** as a numbered list. Each claim states what this project does that the prior art does not. Cite specific patents or publications in each claim.
- **IP strategy** in one paragraph: filing intent, freedom-to-operate position, institutional IP ownership pathway. Tag any commercial-pathway claim with \`[VERIFY: <hint>]\` in adjacent prose if the source is exploratory.
{{/if}}

{{#if SDG_Alignment.md}}
### §8 — SDG Alignment

From SDG_Alignment.md:

- **Relevant SDGs** with SDG number, title, and specific target (e.g., "SDG 3.4: Reduce premature mortality from non-communicable diseases by one third by 2030").
- **Alignment rationale** in one paragraph per SDG explaining how this project contributes specifically. No generic alignment claims.
{{/if}}

{{#if National_Alignment.md}}
### §9 — National Priority Alignment

From National_Alignment.md:

- **Relevant national priorities** with policy document name and specific clause (e.g., "RMKe-13 Thrust 2: Health and Wellbeing, Strategy B2: Strengthen non-communicable disease prevention and management").
- **Alignment rationale** in one paragraph per priority. No platitudes.
{{/if}}

{{#if KPI_Plan.md}}
### §10 — KPIs & Success Metrics

From KPI_Plan.md:

- **KPIs** as a table with columns Indicator | Baseline | Year 1 Target | Year 2 Target | Year 3 Target | Measurement Method. No tags in cells.
- **Success thresholds** in a short paragraph identifying which KPIs are floor (must achieve) vs ceiling (stretch).
- Apply \`[USER INPUT NEEDED: provide baseline measurement for <KPI>]\` in adjacent prose for any KPI with no baseline.
{{/if}}

{{#if Researcher_Profile.md}}
### §11 — Researcher Profile & Track Record

From Researcher_Profile.md, verbatim. No reframing beyond clarity. No embellishment.

- **PI track record** as 3-5 bullets, each one quantified achievement (publications, citations, grants, patents). Numbers and dates verbatim from source.
- **Recent grants and outcomes** as a small table with columns Grant | Funder | Amount | Period | Outcome. Outcome is one phrase per row with no value-laden adjectives. No tags in cells.
- **Alignment with this grant's criteria** in one paragraph mapping specific PI experience to specific funder requirements. If a criterion is unmet, state the gap plainly and tag in adjacent prose with \`[USER INPUT NEEDED: confirm gap mitigation strategy for <criterion>]\`.
{{/if}}

### §12 — Cross-Reference Matrix

A table mapping each downstream proposal section to the source data it draws from. Columns: Proposal Section (Phase 5 Step) | Source §s in this Compilation | Required Claims | Status. Status uses ✓, ✗, or "Pending verification" only. Bracket tags do not appear in this table. Tag-bearing concerns route to §13.

Produce one row for each of Steps 2 through 8:
- Executive Summary (Step 2): sources §1, §2, §3
- Methods (Step 3): source §4
- Background (Step 4): sources §3, §4, §7
- Impact (Step 5): sources §8, §9, §10
- Budget Justification (Step 6): source §5
- Supporting Documents (Step 7): sources §5, §6, §11
- Final Assembly (Step 8): all §s

The "Required Claims" column lists 2-4 specific claims that section must defend. The "Status" column reflects whether the required claims are fully supported (✓), absent (✗), or partially supported (Pending verification).

### §13 — Verification Items Before Downstream Writing

A consolidated table of every tag-bearing item in this compilation, with the responsible party named and the action required. Columns: Item | Tag Type | Source § | Responsible Party | Action.

Tag Type values: USER INPUT NEEDED, VERIFY, CITATION NEEDED, ESTIMATED, CHECK DATE.

Responsible Party values: PI, RMC, TTO, Bursar, Graduate School, HR, Partner, Ethics Committee, Institutional Data Unit. Pick the single most appropriate party per row.

Every \`[VERIFY: ...]\` and \`[USER INPUT NEEDED: ...]\` tag appearing in §1 through §11 has a corresponding row here. No tag is left unactioned. The table is handed directly to the responsible party.

---

## FINAL INSTRUCTIONS

Output a single markdown document. Wrap nothing in fenced code blocks except the upstream JSON blocks embedded in §5 (those keep their original fences). Do not add a preamble. Do not summarize what you just did. Start directly with "# Proposal Data Compilation: [Project Title]" and produce §1 through §13 in order.
`,
};
