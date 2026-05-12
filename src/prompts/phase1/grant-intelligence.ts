import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase1.grant-intelligence",
  phase: 1,
  step: 3,
  name: "Grant Intelligence Gathering",
  description:
    "Analyze grant guidelines to extract evaluation criteria, form-field-level content requirements, submission rules, and strategic insights. Produces the foundational Grant_Intelligence.md document that downstream Phase 5 writers (Steps 2-8) use to derive each proposal section's structure from its corresponding form field's stated content requirements.",
  requiredInputs: ["discipline", "country", "grantName"],
  optionalInputs: [
    "grant_guidelines_text",
    "grant_url",
    "evaluation_criteria_text",
    "application_form_text",
    "careerStage",
    "targetFunder",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Grant_Intelligence.md",
  epTags: ["EP-01", "EP-02", "EP-04"],
  estimatedWords: 4500,
  template: `You are a research intelligence analyst specializing in grant funding landscapes. Your task is to conduct an exhaustive analysis of the specified grant opportunity, extracting every relevant detail that will inform a competitive proposal. This document will serve as the FOUNDATION for the entire proposal — every subsequent step depends on the accuracy and completeness of this analysis.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}
{{#if grant_url}}- **Grant URL:** {{grant_url}}{{/if}}
{{#if grantScheme}}- **Grant Scheme:** {{grantScheme}}{{/if}}

{{#if grantScheme}}
## MYRANTS & MOHE CONTEXT
If this is a MOHE competitive grant (FRGS, PRGS, TRGS, LRGS, PPRN), incorporate the following into your intelligence gathering:

**MyGRANTS System:**
- All MOHE grants are submitted via [MyGRANTS](https://mygrants.gov.my/)
- The portal has specific form fields, character limits, and required sections — identify these
- Researcher profiles in MyGRANTS are evaluated as part of the application (H-index, publication record, prior grant completion rate)
- MyGRANTS requires a Turnitin similarity report (typically <20% for FRGS/PRGS)

**MOHE Evaluation Framework:**
- FRGS: evaluated on Novelty, Research Methodology, Researcher Competency, and Expected Outcomes. Patent search is encouraged (not mandatory as of Pindaan 2025). Risk assessment plan is mandatory. Prior projects must be 75% complete for new applications.
- PRGS: evaluated on Innovation/Novelty, Prototype Feasibility, Commercialisation Potential, and TRL Progression
- TRGS: evaluated on Trans-disciplinary Integration, National Impact, Multi-institutional Collaboration Quality
- LRGS: evaluated on Strategic National Priority Alignment, Research Programme Quality, Consortium Strength
- PPRN: evaluated on Industry Relevance, Partnership Strength, Applied Research Quality
- **GET (Geran Penyelidikan Eksploratori dan Transformatif):** Two sub-categories — Exploratory (TRL 1-2) and Transformative (TRL 2-3). Evaluated with EXPLICIT scoring weights: Title & Keywords 5%, Executive Summary 10%, Background 15%, Objectives 10%, Methodology 20%, Expected Results/ROV 20%, Team Collaboration 10%, Industry Partner/Evidence 10%. Key differentiators from FRGS: industry collaboration is MANDATORY (LOI/MoU/MoA required, not just encouraged), patent search is MANDATORY (via lens.org, keywords must be consistent with project title), minimum 1 IP filing required (priority: patent), ROV (Return of Value) is MANDATORY with 3-year post-completion monitoring, mentor required for Associate Professor and below (Gred Khas C or equivalent). Maximum 3 GET projects as PI across entire career (lifetime cap). GRA rates: PhD RM3,000/month, Masters RM2,500/month. Travel capped at 20% (not 40%). Equipment capped at 30%. Must align with: RPTM 2026-2035, Mega Trends RMK13, BITARA, MADANI Big Bolds, ESG, MySTIE 10-10, SDGs. Integrity requirement: applicants must be free from disciplinary action, bankruptcy, high debt, or criminal record. No overlap with PRGS allowed.

**Key Malaysian Policy Documents to Reference:**
- 13th Malaysia Plan (RMKe-13)
- National Policy on Science, Technology and Innovation (NPSTI) 2021–2030
- Madani Economy Framework
- Malaysia Education Blueprint 2015–2025 (Higher Education)
- National Technology and Innovation Sandbox (NTIS)

**Required Attachments for MOHE Grants (verify against current guidelines):**
- Simplified Patent Search Report (PRGS — mandatory; FRGS — encouraged/digalakkan as of Pindaan 2025)
- Risk Assessment Plan (FRGS — mandatory/dimestikan as of Pindaan 2025)
- Turnitin Similarity Report
- Gantt chart
- Detailed budget using MOHE template
- Letters of support (if applicable)
- Researcher CV in MyGRANTS profile format

**Additional GET-Specific Attachments (verify against current MyGRANTS form):**
- Patent search report from lens.org (mandatory for both Exploratory and Transformative)
- Industry collaboration evidence: LOI / MoU / MoA with clear description of partner roles and contributions
- Risk assessment plan (mandatory — must include risk level estimation)
- ROV projection (Return of Value — estimate of research return commensurate with investment)
- Mentor details (for Associate Professor and below): name, position (Gred Khas C or equivalent), institution, expertise alignment
- Target TRL declaration (TRL 1, 2, or 3)

Search for the latest MyGRANTS guidelines and any recent changes to the evaluation criteria for the {{grantScheme}} scheme specifically.
If this is a GET application, also search for the latest GET guidelines, the GET application form structure, the RPTM 2026-2035 document, and the Mega Trends RMK13 framework to inform the intelligence gathering.
{{/if}}

{{#if grant_guidelines_text}}
## GRANT GUIDELINES (PROVIDED BY USER)
{{grant_guidelines_text}}
{{/if}}

{{#if evaluation_criteria_text}}
## EVALUATION CRITERIA (PROVIDED BY USER)
{{evaluation_criteria_text}}
{{/if}}

{{#if application_form_text}}
## APPLICATION FORM DETAILS (PROVIDED BY USER)
{{application_form_text}}
{{/if}}

{{#unless grant_guidelines_text}}{{#unless evaluation_criteria_text}}{{#unless application_form_text}}
## NOTE
No grant documentation was provided. Please base your analysis on publicly available information about this grant program. If you cannot find specific details, clearly state your assumptions and flag them as needing verification.
{{/unless}}{{/unless}}{{/unless}}

## INSTRUCTIONS

Produce a comprehensive Grant Intelligence document with the following 8 sections. Be thorough, specific, and actionable throughout.

---

### 1. Grant Overview & Objectives (EP-01)
- Full official name and administering body/funder
- Mission and strategic priorities of the funding organization
- Program objectives and what it aims to achieve
- Funding amount (range if applicable) and typical award sizes
- Duration of funding period
- Number of awards typically given per cycle
- History: how long has this program existed, any recent changes in scope or priorities
- Geographic scope and any regional preferences

### 2. Eligibility Requirements
- Who can apply (PI qualifications, career stage, institutional requirements)
- Nationality/residency restrictions
- Institutional eligibility (types of organizations, accreditation requirements)
- Team composition requirements (co-PIs, collaborators, international partners)
- Previous funding restrictions (can past awardees reapply?)
- Exclusions or disqualifying factors
- Any pre-application steps required (letters of intent, expressions of interest)

### 3. Evaluation Criteria & Weights (EP-02)
For each evaluation criterion:
- **Criterion name** and weighting/points (if specified)
- **What reviewers are looking for** — interpret from a reviewer's perspective
- **Common pitfalls** — what applicants typically get wrong
- **Strategic recommendation** — how to address this criterion most effectively
- **Evidence expected** — what kind of evidence strengthens this criterion

Create a summary table:
| Criterion | Weight | Key Focus | Common Pitfall |
|-----------|--------|-----------|----------------|

### 4. Formatting & Submission Requirements

#### 4.1 Form Structure & Content Requirements per Field (CRITICAL)

For EVERY form section/field referenced in the application form source (e.g., A, B(i), C(xv), D(i), D(ii), E, F, G — IDs vary per funder), extract the following four data points into a single structured table:

1. **Form section ID** verbatim from the source form (e.g., "D(i)", not "Section D part 1" or "Executive Summary section")
2. **Field name in source language(s)** — when the form is bilingual (e.g., Bahasa Malaysia + English in MyGRANTS), preserve BOTH languages joined by " / " (e.g., "Ringkasan Eksekutif Cadangan Penyelidikan / Executive Summary of Research Proposal"). Do not paraphrase.
3. **Word/page limit** verbatim from the form (e.g., "Not more than 300 words", "Max 5 pages", "No limit specified"). If no limit is stated, record "No limit stated" exactly.
4. **Stated content requirements** — the parenthetical or directive in the form that specifies what content goes in that field. Preserve verbatim including punctuation, brackets, and bilingual content. If the form has no stated content requirements for a field, record "No content requirements stated; verify against actual form" exactly.

**Why this matters:** The content requirements parenthetical is the funder's contract for that field. It tells the applicant what MUST be included in that specific field. Downstream proposal-writing steps (Phase 5 Steps 2-8) derive their section structure from this column. Missing or paraphrasing the content requirements forces downstream steps to guess section structure from scoring weights — which is a different input. Scoring weights tell you what to be good at across the whole proposal. Content requirements tell you what to put where in each field. Conflating them is the root cause of Round 21's executive-summary structural error (see project history).

**Output the table in this exact format:**

| Form section ID | Field name (source language / English if bilingual) | Word/page limit | Stated content requirements |
|---|---|---|---|
| [ID] | [Name] | [Limit] | [Content requirements verbatim] |

**Example extraction** (from the MyGRANTS GET 2026 form, field D(i)):

| Form section ID | Field name (BM / EN) | Word/page limit | Stated content requirements |
|---|---|---|---|
| D(i) | Ringkasan Eksekutif Cadangan Penyelidikan / Executive Summary of Research Proposal | Not more than 300 words | (Sila sertakan pernyataan masalah, objektif, metodologi penyelidikan, jangkaan output/hasil/implikasi, dan kepentingan output daripada projek penyelidikan) / (Please include the problem statement, objectives, research methodology, expected output/outcomes/implication, and significance of output from the research project) |

**Rules:**
- Do NOT invent field IDs. If the form is not provided in {{application_form_text}} or {{grant_guidelines_text}}, state explicitly that "Form structure could not be captured at field level because the application form source was not provided. Applicant must supply the actual form for downstream Phase 5 steps to align section structures to form fields." Then provide only the rows you can verify from public sources, and flag each with [VERIFY: confirm against actual form].
- Do NOT paraphrase content requirements. If the form says "(Please include problem statement, objectives, research methodology, expected output/outcomes/implication, and significance of output from the research project)", do not shorten it to "include problem, objectives, methodology, output, significance" — the verbatim version is what downstream writers consume.
- Do NOT collapse multiple form fields into "Other sections | No limits stated". Each form field gets its own row, even when its word limit is "No limit stated". Missing rows hide structure from downstream.
- Do NOT fabricate content requirements from scoring weights or "what reviewers typically want". If the form does not state content requirements for a field, the cell value is "No content requirements stated; verify against actual form" — nothing more.

#### 4.2 General Submission Requirements

- Font, margins, spacing requirements
- Mandatory attachments (CV format, letters of support, data management plan, patent search report, ROV projection, risk assessment, Gantt chart, etc. — verify each against the actual call)
- Submission portal/system details (MyGRANTS, ReDI, agency-specific portal)
- File format requirements (PDF, Word, etc.)
- Language requirements
- Any templates or forms that must be used

### 5. Budget Constraints & Rules
- Total budget ceiling and floor
- Allowable cost categories (personnel, equipment, travel, etc.)
- Prohibited expenses
- Overhead/indirect cost policies
- Cost-sharing or matching fund requirements
- Budget justification requirements
- Multi-year budget considerations
- Subcontracting rules and limits

### 6. Timeline & Deadlines
- Application submission deadline (exact date and time with timezone)
- Review timeline (when are reviews typically conducted)
- Notification of results (expected date)
- Earliest project start date
- Reporting requirements and milestones during the grant period
- Interim and final report deadlines
- No-cost extension policies
- Key dates table:
| Event | Date | Notes |
|-------|------|-------|

### 7. Strategic Insights (EP-04)
- Funder priorities and recent trends in funding decisions
- What successful proposals in this program typically look like
- Alignment opportunities between the researcher's field and funder goals
- Competitive landscape assessment (typical applicant pool, success rates)
- Key differentiators that could strengthen the application
- Potential weaknesses to address proactively
- Reviewer profile (who typically reviews, what expertise they bring)
- Political or policy context that may influence funding decisions
- How to frame interdisciplinary or novel approaches within the program's scope
- Recommended narrative strategy

### 8. Intelligence Gaps
- What specific information could NOT be determined from available sources
- Questions the applicant should ask the program officer
- Documents or resources that should be obtained before writing
- Assumptions made that need verification
- Recommendations for filling each gap (e.g., "Contact program officer about X", "Check funder website for Y")
- Priority ranking of gaps (which ones are most critical to resolve first)

---

## OUTPUT FORMAT
Structure your response as a well-organized markdown document titled "# Grant Intelligence: [Grant Name]" with clear headings for each of the 8 sections. Use tables, bullet points, and bold text for emphasis. Include a brief executive summary at the top (3-4 sentences highlighting the most critical findings).

**CRITICAL:** Flag any information you are uncertain about with [VERIFY] tags. Flag any information that appears outdated with [CHECK DATE] tags. This document is the foundation for everything that follows — accuracy is paramount.`,
};
