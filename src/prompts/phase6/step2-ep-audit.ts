import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase6.step2-ep-audit",
  phase: 6,
  step: 2,
  name: "Evaluator Psychology Audit",
  description:
    "Audit your proposal for deployment of all 16 Evaluator Psychology (EP) persuasion tags and identify gaps.",
  requiredInputs: ["discipline", "grantName", "country"],
  optionalInputs: [
    "careerStage",
    "targetFunder",
    "Complete_Proposal.md",
  ],
  outputName: "EP_Audit_Report.md",
  epTags: [
    "EP-01", "EP-02", "EP-03", "EP-04", "EP-05", "EP-06", "EP-07", "EP-08",
    "EP-09", "EP-10", "EP-11", "EP-12", "EP-13", "EP-14", "EP-15", "EP-16",
  ],
  estimatedWords: 5000,
  template: `You are an expert in grant evaluator psychology and persuasion architecture. Your task is to audit the proposal below for deployment of all 16 Evaluator Psychology (EP) tags — persuasion techniques that influence grant reviewers.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if targetFunder}}- **Target Funder:** {{targetFunder}}{{/if}}

---

## COMPLETE PROPOSAL
{{> Complete_Proposal.md}}

---

## THE 16 EP TAGS

- **EP-01: Anchoring** — First impression framing that sets high expectations
- **EP-02: Social Proof** — Evidence that credible others endorse or use similar approaches
- **EP-03: Authority Signaling** — Credibility indicators (publications, track record, institutional prestige)
- **EP-04: Scarcity / Urgency** — Why this research must happen NOW and why this team is uniquely positioned
- **EP-05: Loss Framing** — What is lost if this research is NOT funded (stronger than gain framing)
- **EP-06: Narrative Transportation** — Story-based engagement that makes reviewers emotionally invested
- **EP-07: Cognitive Ease** — Clear structure, familiar frameworks, and accessible writing that reduces reviewer effort
- **EP-08: Specificity Bias** — Concrete numbers, dates, and details that signal competence
- **EP-09: Reciprocity / Value-First** — Showing what you have already delivered (pilot data, publications)
- **EP-10: Consistency / Commitment** — Building on established trajectories and institutional commitments
- **EP-11: Liking / Similarity** — Alignment with funder priorities and reviewer values
- **EP-12: Peak-End Rule** — Strong opening and closing that dominate memory
- **EP-13: Chunking / Processing Fluency** — Information organized in digestible units
- **EP-14: Bandwagon Effect** — Demonstrating momentum and growing support
- **EP-15: Contrast Principle** — Strategic comparisons that make your approach look superior
- **EP-16: Halo Effect** — Leveraging strong elements to cast a positive light on weaker areas

---

## INSTRUCTIONS

Audit the proposal and produce a report with this EXACT structure:

### EP TAG DEPLOYMENT GRID

For each of the 16 EP tags, assess deployment status:

| Tag | Name | Status | Location(s) | Effectiveness |
|-----|------|--------|-------------|---------------|
| EP-01 | Anchoring | DEPLOYED / PARTIAL / MISSING | [Section where found] | Strong / Moderate / Weak |
| EP-02 | Social Proof | DEPLOYED / PARTIAL / MISSING | [Section where found] | Strong / Moderate / Weak |
| ... | ... | ... | ... | ... |
| EP-16 | Halo Effect | DEPLOYED / PARTIAL / MISSING | [Section where found] | Strong / Moderate / Weak |

**Summary:** X/16 fully deployed, Y/16 partially deployed, Z/16 missing

---

### CHAMPION PHRASES

Identify 5-10 "champion phrases" — sentences or phrases in the proposal that are particularly powerful and would stick in a reviewer's mind. Quote each one and explain why it works:

1. > "[quoted phrase]"
   **Why it works:** [explanation]

---

### LOSS-FRAME EFFECTIVENESS

Rate the proposal's use of loss framing (EP-05) specifically:
- **Current strength:** [Strong / Moderate / Weak / Absent]
- **Where deployed:** [locations]
- **Improvement suggestions:** [specific rewrites that would strengthen loss framing]

---

### GAP ANALYSIS & REMEDIATION

For each MISSING or PARTIAL EP tag, provide:

#### EP-XX: [Tag Name] — [MISSING/PARTIAL]
- **Why it matters for this proposal:** [explanation]
- **Where to deploy:** [specific section]
- **Suggested language:** [draft sentence or paragraph to add]

---

### OVERALL EP SCORE

- **Deployment Rate:** X/16 (Y%)
- **Average Effectiveness:** [Strong / Moderate / Weak]
- **Top 3 Strengths:** [list]
- **Top 3 Gaps:** [list]
- **Priority Fixes:** [numbered list of highest-impact improvements]

Be thorough and specific. Quote the actual proposal text when identifying EP tag deployments.`,
};
