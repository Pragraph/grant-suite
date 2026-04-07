import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase2.combined-session",
  phase: 2,
  step: 5,
  name: "Combined Strategic Positioning",
  description:
    "Complete all Phase 2 analysis in a single session: requirements, competition, evaluator psychology, impact, and synthesis into the Proposal Blueprint.",
  requiredInputs: ["discipline", "grantName"],
  optionalInputs: [
    "careerStage",
    "country",
    "cvSummary",
    "Grant_Intelligence.md",
    "grantScheme",
    "grantSubCategory",
  ],
  outputName: "Proposal_Blueprint.md",
  epTags: ["EP-01", "EP-02", "EP-03", "EP-04", "EP-05", "EP-07", "EP-09", "EP-10"],
  estimatedWords: 12000,
  template: `You are a senior grant strategist. Your task is to conduct a COMPLETE strategic positioning analysis for a grant proposal, covering requirements analysis, competitive landscape, evaluator psychology, impact maximization, and final synthesis — all in one comprehensive session.

**IMPORTANT:** This is a combined analysis that normally takes 5 separate sessions. Take your time and be thorough in every section.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}

{{#if cvSummary}}
## RESEARCHER CV / CAREER SUMMARY
{{cvSummary}}
{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

## INSTRUCTIONS

Produce a comprehensive Proposal Blueprint that covers all five strategic analyses. Structure the output as follows:

---

# Proposal Blueprint: {{grantName}}

## Part 1: Grant Requirements Analysis

### 1.1 Requirements Decomposition
Break down every grant requirement into:
- **Hard requirements** — non-negotiable eligibility criteria
- **Soft requirements** — strongly preferred but not disqualifying
- **Implicit requirements** — unstated expectations inferred from funder priorities

| Requirement | Type | Status | Gap/Action |
|-------------|------|--------|------------|

### 1.2 Profile–Grant Alignment Matrix
Map the researcher's profile against each evaluation criterion with alignment ratings (Strong/Moderate/Weak).

### 1.3 Compliance Checklist
Itemized checklist of every required document, format, and submission element.

---

## Part 2: Competitive Landscape Analysis

### 2.1 Applicant Pool Profile
Estimated competition, success rates, typical applicant profiles.

### 2.2 Competitor Archetypes
Define 3-4 competitor archetypes with strengths and weaknesses.

### 2.3 Differentiation Opportunities
Specific ways to stand out, rated by distinctiveness, credibility, and funder appeal.

### 2.4 White Space Map
Areas where funder priorities exist but competition is low.

---

## Part 3: Evaluator Psychology Profile

### 3.1 Evaluator Personas
Likely reviewer types, their reading patterns, and decision influences.

### 3.2 EP Deployment Map
| EP Tag | Psychology Principle | Deployment Point | Implementation |
|--------|---------------------|------------------|----------------|
| EP-01 | First Impression Anchoring | Title, Abstract, Opening | Set strong anchor with compelling problem |
| EP-02 | Criteria Alignment | Each section | Mirror evaluation criteria language |
| EP-03 | Novelty Signal | Gap, Methods, Innovation | Strategic use of "first," "novel," "unique" |
| EP-04 | Funder Alignment | Objectives, Impact | Reference funder strategy directly |
| EP-05 | Internal Coherence | Cross-references | Link sections explicitly |
| EP-07 | Impact Amplification | Impact, Abstract, Conclusion | Concrete pathways, not aspirations |
| EP-09 | Cognitive Load Reduction | Structure, Language | Easy to process = higher scores |
| EP-10 | Emotional Resonance | Opening, Impact | Create "this matters" moments |

### 3.3 Champion Phrase Library
15-20 discipline-specific phrases evaluators use when advocating for proposals, organized by category (Merit, Innovation, Impact, Feasibility, Team).

### 3.4 Loss-Frame Narrative Seeds
5-7 loss-framed statements about what happens if this research is NOT funded.

### 3.5 Cognitive Bias Exploitation Map
Key biases and how to ethically leverage them in the proposal.

---

## Part 4: Impact Maximization Framework

### 4.1 Impact Dimension Map
| Dimension | Impact | Timeframe | Beneficiaries | Funder Priority |
|-----------|--------|-----------|---------------|-----------------|

### 4.2 Impact Pathways
For each primary dimension: outputs → outcomes → medium-term impacts → long-term transformation.

### 4.3 Impact Narrative Templates
- **Short** (50 words) — for abstracts
- **Medium** (150 words) — for impact sections
- **Extended** (300 words) — for detailed descriptions

---

## Part 5: Strategic Synthesis & Blueprint

### 5.1 Executive Strategy Summary (300 words)
Core positioning, competitive advantage, impact narrative, EP deployment strategy, overall narrative arc.

### 5.2 Proposal Narrative Architecture
- Opening Hook (draft 2-3 sentences)
- Problem Statement framing
- Gap Identification
- Proposed Solution positioning
- Impact Vision
- Feasibility Argument

### 5.3 Section-by-Section Blueprint
| Section | Key Message | EP Tags | Word Budget | Priority Arguments |
|---------|-------------|---------|-------------|-------------------|

### 5.4 Champion Phrase Integration Plan
Top 10 phrases mapped to specific sections.

### 5.5 Differentiation Strategy
Primary differentiator, secondary differentiators, defensive positioning.

### 5.6 Writing Guidelines
Tone, voice, technical level, key terminology, phrases to avoid.

---

## OUTPUT FORMAT
Structure as a single comprehensive markdown document titled "# Proposal Blueprint: [Grant Name]" with all 5 parts clearly separated. Use tables, checklists, and clear formatting. This document must be complete enough to serve as the sole strategic foundation for writing the entire proposal.

**CRITICAL:** Be thorough. This combined format must deliver the same quality and depth as the 5 individual analyses. Mark uncertain information with [VERIFY] and items needing researcher input with [USER INPUT NEEDED].`,
};
