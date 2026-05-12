import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase4.step3-budget-justification",
  phase: 4,
  step: 3,
  name: "Budget Justification & Compliance",
  description:
    "Generate a persuasive budget justification narrative with compliance verification against funder guidelines, linking every budget line to specific research activities and outcomes.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "country",
    "targetFunder",
    "Team_Strategy.md",
    "Budget_Draft.md",
    "Grant_Intelligence.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Budget_Justification.md",
  epTags: ["EP-08", "EP-09", "EP-10"],
  estimatedWords: 3500,
  template: `You are a grant budget justification expert. Your task is to write a persuasive, defensible budget justification that converts the line-itemized budget from Phase 4 Step 2 into a coherent argument: every ringgit is necessary, linked to a specific research activity, compliant with funder rules, and represents value for money. The output ships into the assembled proposal as a standalone deliverable that grants-office reviewers, TTO staff, and bursar units can act on.

A weak justification kills a strong budget. A strong justification signals operational seriousness, methodological depth, and grants-office literacy.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if Team_Strategy.md}}
## TEAM STRATEGY (from Phase 4, Step 1)
{{> Team_Strategy.md}}
{{/if}}

{{#if Budget_Draft.md}}
## BUDGET DRAFT (from Phase 4, Step 2)
{{> Budget_Draft.md}}
{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

## CANONICAL DATA SOURCES (read these first)

The injected \`Budget_Draft.md\` from Phase 4 Step 2 contains three parts: narrative tables (Part 1), prose notes (Part 2), and a fenced JSON code block (Part 3) titled "Machine-readable budget JSON". **The Part 3 JSON is the canonical source of truth for every numeric and structural fact in this justification.** Read it BEFORE writing any percentages, Vot codes, amounts, or totals. The Part 1 narrative tables are derived from the same JSON and may carry inline tags; use them for prose context, not numeric authority.

From the Part 3 JSON, extract:

- \`budget_rows[].category\`, \`item\`, \`amounts\`, \`vot\`, \`justification\` — one entry per requested line item. The Vot code on each row MUST appear verbatim in this justification document (e.g., "Vot 11000" not "Vot 1100" or "personnel vot"). The \`justification\` string is plain prose; expand it into a full defence paragraph here.
- \`budget_summary.by_category\` — per-category yearly totals. Reference these when writing per-category Justification sections.
- \`budget_summary.grand_total\` — the single authoritative total. Use this exact number everywhere. Do not recompute by summing categories in prose.
- \`budget_summary.by_year\` — annual totals. Use when discussing year-by-year shape.
- \`compliance.ceiling\`, \`compliance.travel_pct\`, \`compliance.equipment_pct\`, \`compliance.indirect_pct\`, \`compliance.notes\` — the canonical compliance facts. Use these exact percentages in the Compliance Checklist (Section 9) and Value for Money Statement (Section 10). Do not recompute percentages from category totals.

The injected \`Team_Strategy.md\` from Phase 4 Step 1 contains a fenced JSON code block titled "Recommended Role Matrix scaffold". From it, extract:

- \`recommended_roles[].role\`, \`responsibility\`, \`suggested_effort_pct\` — one entry per team member. The \`suggested_effort_pct\` value MUST appear verbatim in this justification's Section 2 (Personnel Justification) for each role. Do not invent percentages. Do not round (15 stays 15, not "approximately 15%").

If a fact is required by this document but absent from both injected JSON blocks, mark it with \`[USER INPUT NEEDED: <what to confirm>]\` (canonical UPPERCASE with colon-hint) and proceed. Do not invent.

## SUCCESS CRITERIA

Your output succeeds when:

1. **Numeric agreement with Budget Draft Part 3 JSON.** Every amount, Vot code, percentage, and grand total in this justification matches the Part 3 JSON exactly. A grants-office reviewer comparing the two documents finds zero discrepancies.
2. **Effort agreement with Team Strategy JSON.** Every team-member effort percentage in Section 2 matches \`recommended_roles[].suggested_effort_pct\` exactly.
3. **Activity linkage.** Every Section 2-7 line item names a specific Research Design phase, activity, or work package. Generic phrases like "supports research" or "for project execution" fail.
4. **Funder-prohibition compliance.** No section requests, defends, or apologizes for items the funder prohibits. Prohibited items simply do not appear.
5. **Tag discipline.** Bracket tags appear ONLY in Section 1-10 narrative prose, NEVER inside markdown table cells. Tag names are canonical UPPERCASE with mandatory colon-hint: \`[VERIFY: <question>]\`, \`[USER INPUT NEEDED: <what to confirm>]\`. Bare \`[VERIFY]\` is a hard failure.
6. **Compliance Checklist is operational.** Section 9's table uses three Status values only — ✓, ✗, or "Pending verification" — never hybrid forms like "✓ / [VERIFY]". Tag-bearing items appear in Section 12 (Verification Items), not as Status hybrids.
7. **Defence Matrix is the reviewer's friend.** Section 11 enumerates every budget line in one row each, allowing a grants-office reviewer to verify ringgit-to-activity linkage in 90 seconds.
8. **Verification Items are portable.** Section 12 consolidates every \`[VERIFY: ...]\` and \`[USER INPUT NEEDED: ...]\` tag from the document into one actionable table with responsible parties named, suitable to hand directly to RMC, TTO, or bursar without further editing.

## CONSTRAINTS

- **No invented numbers.** Every amount, percentage, and effort figure comes from the injected JSON blocks. If a number is missing, tag it with \`[USER INPUT NEEDED: <what to confirm>]\` and continue.
- **Vot codes verbatim.** Use the exact Vot string from \`budget_rows[].vot\` (e.g., "Vot 11000", "Vot 21000"). The narrative should reference Vot codes in prose to demonstrate funder-rule literacy: "This appointment is budgeted under Vot 11000 personnel allowance" not "This is a personnel cost".
- **Effort percentages verbatim.** "25%" not "approximately 25%" when the JSON says 25. Use "approximately" only if the JSON value is itself flagged uncertain.
- **Bracket tags inline in prose only.** Place \`[VERIFY: <question>]\` and \`[USER INPUT NEEDED: <what to confirm>]\` in narrative paragraphs ONLY. Never inside markdown table cells (Personnel Summary, Travel Summary, Compliance Checklist, Defence Matrix, Verification Items). Tags inside table cells break the markdown structure and the in-app placeholder resolver cannot act on them reliably.
- **Canonical tag syntax mandatory.** Use ONLY the five canonical UPPERCASE forms with colon-hint: \`[CITATION NEEDED: <hint>]\`, \`[USER INPUT NEEDED: <what to confirm>]\`, \`[VERIFY: <hint>]\`, \`[ESTIMATED: <hint>]\`, \`[CHECK DATE: <hint>]\`. Lowercase variants (\`[verify ...]\`, \`[needs ...]\`) and bare forms (\`[VERIFY]\` without colon-hint) are NEVER recognized by the in-app placeholder resolver and render as inert prose.
- **Section 8 Indirect Costs follows funder rule.** {{#if grantScheme}}MOHE GET prohibits indirect costs and overheads. Section 8 is a single prose paragraph stating no overheads are requested and why this strengthens value-for-money. No zero-row table. No "0-value with apology" entries.{{/if}}{{#unless grantScheme}}Match Section 8 to the funder's overhead policy. Quote the institutional rate and basis if the funder permits overheads; produce a prose statement only if the funder prohibits them.{{/unless}}
- **No zero-row tables.** If a category has no requested items (e.g., Equipment for a service-based project), state the absence in prose with reasoning. Do not produce a markdown table with all-zero rows.
- **Persuasive but disciplined tone.** Defend without inflating. "This role prevents the project from becoming a model-only study with no service change" is a reviewer-grade defence. "This indispensable role is critical to leverage cutting-edge capabilities" is hollow.

## STOP RULES

Do not produce any of the following. Each is a failure of the round:

1. **Recomputed percentages.** Do not compute travel %, equipment %, or any compliance percentage from category totals in prose. Read these from \`compliance.travel_pct\`, \`compliance.equipment_pct\`, \`compliance.indirect_pct\` in the Part 3 JSON. If the JSON value is missing, tag with \`[USER INPUT NEEDED: ...]\` and continue.
2. **Indirect Costs zero-row table** when the funder prohibits overheads. State the absence in prose. No "Indirect costs | RM0 | Funder prohibits" row.
3. **Equipment zero-row table** when no equipment is requested. State the absence in prose with the reasoning (service-based methodology, existing institutional infrastructure, etc.).
4. **Bracket tags inside markdown table cells.** Tags belong in prose paragraphs adjacent to the table, not inside cells. A tag inside a cell breaks pipe-delimited parsing and confuses the in-app placeholder resolver.
5. **Hybrid Status values in Compliance Checklist.** "✓ / [VERIFY]", "✓ subject to verification", "✓ pending" are not Status values. Use ✓, ✗, or "Pending verification" only. Tag-bearing concerns go to Section 12, not Status hybrids.
6. **Bare \`[VERIFY]\` or \`[USER INPUT NEEDED]\` without colon-hint.** Every tag carries a specific question. \`[VERIFY: Confirm GRA is registered in full-time research mode]\` passes. \`[VERIFY]\` fails.
7. **Lowercase or non-canonical tag names.** \`[verify quotation]\`, \`[needs citation]\`, \`[check this]\` are silently ignored by the in-app placeholder resolver. Use ONLY canonical UPPERCASE with colon-hint.
8. **Invented effort percentages or amounts.** Numbers come from the injected JSON. If a Team Strategy role has no \`suggested_effort_pct\`, tag with \`[USER INPUT NEEDED: confirm effort percentage for <role>]\` and continue.
9. **Numeric divergence from Budget Draft.** If a Personnel item totals RM66,000 in the Part 3 JSON, it totals RM66,000 here. Not RM65,000 with a footnote. Not "approximately RM66,000". The numbers agree exactly.
10. **Generic value-for-money platitudes.** "World-class research at competitive cost", "leveraging cutting-edge methodologies for transformative impact" — banned. Section 10 makes concrete cost-effectiveness arguments tied to specific budget choices.
11. **Section reordering or section skipping.** The 12-section structure below is mandatory and ordered. A section with no content states the absence in one prose sentence and is retained for assembly-doc consistency.

## OUTPUT STRUCTURE

Produce a markdown document titled "# Budget Justification: [Project Title]" with the following 12 sections in this exact order.

### Section 1 — Executive Budget Summary

Three short paragraphs plus a bulleted cost-driver list:

- **Paragraph 1:** Total request (use \`compliance.grand_total\` value exactly) framed against the funder ceiling (\`compliance.ceiling\`), with the deliberate headroom stated as evidence of genuine costing. Name the principal cost-shape decision (lean personnel, no equipment, service-heavy, etc.).
- **Paragraph 2:** Why this cost shape fits the funder scheme. Reference the scheme's stated priorities (transformative intent, ROV expectation, talent development).
- **Bulleted list:** Top 4-6 cost drivers, each one bullet, format "**Category name, RM X,000**, for <specific function>. <One-sentence linkage to project objective>."
- **Paragraph 3:** What the funder receives in return. Concrete deliverables (publications, IP filings, trained personnel, adoption-readiness evidence, ROV framework) not abstract benefits.

### Section 2 — Personnel Justification (EP-08)

Open with a Personnel Budget Summary markdown table:

| Personnel item | Year 1 | Year 2 | Year 3 | Total | Vot |
|---|---:|---:|---:|---:|---|
| <PhD GRA item from JSON> | <Y1> | <Y2> | <Y3> | <total> | <vot> |
| <RA item from JSON> | <Y1> | <Y2> | <Y3> | <total> | <vot> |
| **Total personnel** | <sum> | <sum> | <sum> | **<sum>** | — |

Then, for EACH role in \`Team_Strategy.md\` \`recommended_roles\` JSON (PI, Co-Investigators, Senior Mentor if present, Continuity Successor if present, GRA, RA), produce a sub-section in this exact format:

\`\`\`
### <Role name from JSON>

**Role and responsibilities.**
<2-3 sentences expanding the JSON \`responsibility\` field. Link to specific project phases or work packages.>

Specific responsibilities include:

| Activity | Contribution |
|---|---|
| <activity 1> | <contribution sentence> |
| <activity 2> | <contribution sentence> |
| ... | ... |

**Effort level justification.**
The proposed effort of **<suggested_effort_pct from JSON>%** is <justified | necessary | appropriate | sufficient> because <reasoning tied to project complexity, phase intensity, or risk control>.

**Salary basis.**
<For PI/Co-I/Mentor/Successor: state that no salary is requested and the contribution is in-kind academic effort. For GRA/RA: state the monthly rate from \`Budget_Draft.md\` budget_rows justification, the funded duration, and the funder cap compliance basis. Use canonical Vot reference.>

**Career development.**
<1-2 sentences on how this role builds capacity, supports trainees, or develops institutional expertise.>
\`\`\`

Tags (when needed) appear in the **paragraph text** of Salary basis or Effort level justification, never inside the Activity/Contribution table.

### Section 3 — Equipment Justification

If \`budget_summary.by_category.Equipment\` totals zero across all years:

> No equipment is requested. <One paragraph explaining the methodological reason: service-based costs under Vot 29000, existing institutional infrastructure leveraged, partner-provided EHR access, etc.> This is a deliberate compliance and value-for-money decision because <funder cap reference, e.g., GET caps equipment at 30% but the project's needs are workflow-based and service-based>.

No zero-row table. No "Specifications: not applicable" subheaders.

Otherwise, produce Equipment Budget Summary table followed by per-item sub-sections covering Necessity, Specifications, Alternatives Considered, Shared Use.

### Section 4 — Travel Justification

Travel Budget Summary table. Then prose covering Purpose (linked to specific project activities), Frequency and Duration (year-by-year shape table), Cost Basis (institutional rate references, with \`[VERIFY: ...]\` tag in adjacent prose if not yet confirmed), and Compliance (cite \`compliance.travel_pct\` from JSON exactly: "Travel is X.X% of total budget, below the GET 20% cap" — do not recompute).

### Section 5 — Materials & Supplies Justification

Materials Budget Summary table. Then prose linking each material type to research activities, consumption-rate logic (year-by-year if amounts vary), and a Reasonableness paragraph.

### Section 6 — Publication & Dissemination Justification (EP-09)

Publication Budget Summary table. Then prose covering open-access strategy with APC basis, conference plan (or stated absence with justification), and knowledge-dissemination beyond academia.

### Section 7 — Other Costs Justification

For EACH "Other" category line in the Budget Draft JSON, produce a sub-section:

\`\`\`
### <Item name>

**Budget requested:** RM<total> under Vot <vot>
**Year breakdown:** RM<Y1> in Year 1, RM<Y2> in Year 2, RM<Y3> in Year 3

**Purpose and link to project activities.**
<2-3 sentences expanding the JSON \`justification\` field with specific phase or work-package linkage.>

**Necessity.** <Why this cannot be absorbed by existing infrastructure or investigator effort.>
**Reasonableness.** <Why the year-by-year shape matches the activity intensity.>
**Compliance.** <Vot mapping verification, cap reference if applicable.>
\`\`\`

Tags adjacent to the sub-section's prose only.

### Section 8 — Indirect Costs / Overheads

{{#if grantScheme}}
A single prose paragraph stating no indirect costs or overheads are requested, citing the funder's prohibition explicitly. Add a second paragraph framing this as value-for-money advantage (full request directed to project execution, not overhead recovery). No table. No zero-row entry.
{{/if}}
{{#unless grantScheme}}
Match the funder's policy. State the institutional rate and basis if permitted; produce a prose statement only if prohibited.
{{/unless}}

### Section 9 — Compliance Checklist (EP-10)

Single markdown table with these exact columns and these Status values only:

| Requirement | Status | Evidence |
|---|---|---|
| Within budget ceiling | ✓ \\| ✗ \\| Pending verification | <evidence sentence citing exact total and ceiling> |
| Eligible cost categories | ✓ \\| ✗ \\| Pending verification | <list of Vot codes used> |
| Personnel effort limits | ✓ \\| ✗ \\| Pending verification | <PI/Co-I in-kind, GRA/RA salaried statement> |
| GRA allowance limit | ✓ \\| ✗ \\| Pending verification | <rate vs cap statement; if confirmation pending, Status = "Pending verification" and a Section 12 entry is created> |
| RA eligibility | ✓ \\| ✗ \\| Pending verification | <Malaysian citizenship and appointment rules statement; tag-bearing concerns go to Section 12> |
| Equipment threshold | ✓ \\| ✗ \\| Pending verification | <exact equipment % vs cap from JSON> |
| Travel restriction | ✓ \\| ✗ \\| Pending verification | <exact travel % vs cap from JSON> |
| Special service or training cap | ✓ \\| ✗ \\| Pending verification | <exact % vs 5% cap if applicable> |
| Indirect cost cap | ✓ \\| ✗ \\| Pending verification | <RM0, funder prohibits overheads> |
| Cost sharing requirements | ✓ \\| ✗ \\| Pending verification | <matching fund statement or "not required by funder"> |
| Industry/agency collaboration | ✓ \\| ✗ \\| Pending verification | <LOI/MoU statement; tag-bearing concerns go to Section 12> |
| Patent search requirement | ✓ \\| ✗ \\| Pending verification | <IP filing budget statement, TTO route> |
| ROV requirement | ✓ \\| ✗ \\| Pending verification | <ROV framework cost driver references> |
| Ethics and data governance | ✓ \\| ✗ \\| Pending verification | <ethics, PDPA, data-sharing documentation status> |
| Procurement and quotations | ✓ \\| ✗ \\| Pending verification | <quotation status for service-line items> |

Rules for this table:

- Status column accepts ONLY one of three values: ✓, ✗, or "Pending verification". No hybrid forms.
- Evidence column carries factual statements. NO bracket tags. Tag-bearing concerns appear in Section 12.
- Use the exact percentages from \`compliance.*\` JSON fields, not recomputed values.
- If a row genuinely does not apply (e.g., Cost sharing when funder does not require it), Status = ✓ and Evidence = "Not required by funder."

### Section 10 — Value for Money Statement

Four concrete cost-effectiveness arguments, each one paragraph, each tied to specific budget choices made in this proposal. Format:

- **Argument 1 — <one-line claim>.** <2-3 sentences citing specific budget choices that deliver this value.>
- **Argument 2 — <one-line claim>.** <2-3 sentences.>
- **Argument 3 — <one-line claim>.** <2-3 sentences.>
- **Argument 4 — <one-line claim>.** <2-3 sentences.>

Then one closing paragraph contrasting this budget shape with typical alternatives (equipment-heavy, conference-heavy, etc.) and naming the funder-distinctive value (talent + IP + ROV + partner alignment for MOHE GET).

Banned phrases in this section: "world-class", "cutting-edge", "transformative impact" (as decoration), "leveraging" (as verb), "synergies", "robust" (without specification). Concrete claims only.

### Section 11 — Budget Line Defence Matrix

Single markdown table enumerating every line item from the Budget Draft Part 3 JSON in one row each. This is the grants-office reviewer's quick-scan surface.

| Budget line | Amount | Why necessary | Linked phase(s) | Compliance argument |
|---|---:|---|---|---|
| <budget_rows[0].item> | RM<total> | <one-sentence necessity argument> | <phases referenced in justification> | <Vot reference + cap statement if applicable> |
| <budget_rows[1].item> | RM<total> | ... | ... | ... |
| ... | ... | ... | ... | ... |

Rules:

- One row per \`budget_rows[]\` entry. Order: follow Section 2-7 ordering (Personnel rows first, then Equipment, Travel, Materials, Publication, Other).
- Amount column uses exact line total from JSON.
- Why necessary: one tight sentence, no hedging, no tags.
- Linked phases: comma-separated phase references (e.g., "Phases 1, 2, 4").
- Compliance argument: Vot code + cap statement if relevant (e.g., "Vot 11000. RM2,500/month below PhD GRA cap").
- NO bracket tags inside this table. The Matrix is reviewer-facing; tag-bearing concerns appear in Section 12.

### Section 12 — Verification Items Before Final Submission

Single markdown table consolidating every \`[VERIFY: ...]\` and \`[USER INPUT NEEDED: ...]\` tag from Sections 1-10 narrative prose into one actionable checklist. This is the handoff artifact for RMC, TTO, bursar, and PI follow-up.

| Item needing verification | Why it matters | Responsible party |
|---|---|---|
| <Specific question pulled from a [VERIFY] or [USER INPUT NEEDED] tag in the body> | <One-sentence consequence if unresolved> | <PI \\| RMC \\| TTO \\| Bursar \\| Graduate School \\| HR \\| Partner \\| Institutional Data Unit> |
| ... | ... | ... |

Rules:

- One row per unique verification concern. If the same concern appears in multiple sections (e.g., GRA full-time registration tagged in Section 2 and Section 9), consolidate to one row.
- Item column is a specific question, not the raw tag text. Convert "[VERIFY: Confirm GRA is registered in full-time research mode]" to "Confirm GRA is registered in full-time research mode".
- Why it matters: name the consequence (compliance failure, funding ineligibility, audit risk, etc.).
- Responsible party: name the specific institutional function. If unclear, use "PI" and add a sub-row for the institutional function.

A document with zero verification items is suspicious. A document with 8-15 verification items signals appropriate due diligence. More than 25 suggests the proposal is not ready.

---

## CLOSING REQUIREMENT

End the document with one short paragraph (no heading) summarizing the defensibility argument: each line is tied to a research activity, each activity supports a declared objective, each objective contributes to the funder's expected return. State the funder-distinctive return (for MOHE GET: new knowledge, IP, talent, partner value, measurable ROV). No hedging. No tags. No tricolons.
`,
};
