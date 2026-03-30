import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase2.step3-psychology",
  phase: 2,
  step: 3,
  name: "Evaluator Psychology Profile",
  description:
    "Profile the evaluator mindset, cognitive biases, and decision-making patterns to craft a proposal that resonates at a psychological level.",
  requiredInputs: ["discipline", "grantName"],
  optionalInputs: [
    "careerStage",
    "Grant_Intelligence.md",
    "grantScheme",
  ],
  outputName: "Evaluator_Psychology.md",
  epTags: ["EP-02", "EP-03", "EP-05", "EP-09", "EP-10"],
  estimatedWords: 4000,
  template: `You are an expert in evaluator psychology and decision science applied to research funding. Your task is to build a comprehensive psychological profile of the evaluators for this grant, enabling the applicant to write a proposal that resonates at every cognitive and emotional level.

This is a KEY DIFFERENTIATOR of this proposal system. Most applicants focus only on content — we also optimize for how evaluators think, feel, and decide.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Grant Name:** {{grantName}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if grantScheme}}
## MOHE PANEL REVIEW CONTEXT
For Malaysian MOHE grants (FRGS, PRGS, TRGS, LRGS, PPRN), the evaluation panel has specific characteristics:

**Panel Composition:**
- Evaluators are typically senior Malaysian academics (Professors and Associate Professors) from related disciplines
- Each proposal receives 2–3 independent reviews via MyGRANTS
- A panel meeting may consolidate scores, but individual reviewer scores dominate
- Reviewers evaluate 20–50+ proposals per cycle — fatigue is a real factor

**Malaysian Reviewer Priorities (by scheme):**
- **FRGS:** Novelty is king. Reviewers look for clear evidence that this research has not been done before (patent search report is mandatory). Methodology rigor is second. National relevance is valued but secondary to scientific merit.
- **PRGS:** Prototype feasibility and TRL progression are paramount. Reviewers want to see a realistic path from concept to working prototype within the grant period.
- **TRGS:** Trans-disciplinary integration quality matters most. Reviewers assess whether the collaboration is genuine or tokenistic.
- **LRGS:** National strategic alignment and consortium governance are critical. Reviewers evaluate programme-level coherence across sub-projects.
- **PPRN:** Industry partner commitment and applied relevance are the main criteria. Note: PPRN is submitted via pprn.mohe.gov.my, not MyGRANTS.

**Cultural Considerations for Malaysian Academic Panels:**
- Respect for institutional hierarchy — demonstrate senior researcher oversight
- Strong emphasis on capacity building (postgraduate training counts heavily)
- National service framing resonates — position research as serving Malaysia's development
- Publications in indexed journals (Scopus/WoS) are expected as key outputs
- Prior grant completion rate is checked — address any gaps proactively
{{/if}}

## INSTRUCTIONS

Produce a comprehensive Evaluator Psychology Profile with these sections:

---

### 1. Evaluator Persona Construction
Build detailed personas for the likely evaluator types:

For each persona (typically 3-4):
- **Role profile** — academic rank, discipline, experience with this funder
- **Review load** — how many proposals they likely review per cycle
- **Time per proposal** — realistic estimate of minutes spent per application
- **Reading pattern** — what they read first, what they skim, what they skip
- **Decision weight** — how much influence they have (panel chair vs. external reviewer)
- **Fatigue factor** — how proposal position in the stack affects assessment

### 2. EP Deployment Map (EP-02, EP-03, EP-05)
Create a tactical map of Evaluator Psychology tags and where to deploy them:

| EP Tag | Psychology Principle | Deployment Point | Implementation |
|--------|---------------------|------------------|----------------|
| EP-01 | First Impression Anchoring | Title, Abstract, Opening paragraph | Set a strong anchor with a compelling problem statement that frames everything that follows |
| EP-02 | Evaluation Criteria Alignment | Each section mapped to criteria | Mirror the exact language and structure of evaluation criteria in your section headings |
| EP-03 | Novelty Signal | Research gap, Methods, Innovation | Use "first," "novel," "unique" strategically — evaluators scan for innovation markers |
| EP-04 | Strategic Funder Alignment | Objectives, Impact, Background | Reference funder's strategic plan language directly — creates subconscious alignment |
| EP-05 | Internal Coherence | Throughout — cross-references | Proposals that feel "tight" score higher — explicitly link sections to each other |
| EP-06 | Competitive Awareness | Positioning, Literature review | Show awareness of the field without being dismissive — evaluators know your competitors |
| EP-07 | Impact Amplification | Impact section, Abstract, Conclusion | Make impact feel inevitable, not aspirational — use concrete pathways |
| EP-08 | Track Record Framing | CV, Team section, Feasibility | Frame past work as a trajectory pointing to this project as the natural next step |
| EP-09 | Cognitive Load Reduction | Structure, Formatting, Language | Evaluators reward proposals that are easy to process — reduce cognitive load at every turn |
| EP-10 | Emotional Resonance | Opening, Impact, Significance | Create moments of "this matters" — evaluators are human and respond to meaning |

### 3. Champion Phrase Library (EP-09, EP-10)
Provide 15-20 "champion phrases" — specific phrases that evaluators tend to highlight when advocating for a proposal in panel discussions:

**Category: Scientific Merit**
- "[Phrase]" — Why it works: [psychological mechanism]

**Category: Innovation**
- "[Phrase]" — Why it works: [psychological mechanism]

**Category: Impact**
- "[Phrase]" — Why it works: [psychological mechanism]

**Category: Feasibility**
- "[Phrase]" — Why it works: [psychological mechanism]

**Category: Team/Capacity**
- "[Phrase]" — Why it works: [psychological mechanism]

These phrases should be specific to the discipline and grant type, not generic.

### 4. Loss-Frame Narrative Seeds (EP-10)
Loss framing is more psychologically powerful than gain framing. Provide 5-7 "loss-frame narrative seeds" — ways to frame the research need in terms of what will be LOST or what COST will be incurred if this research is NOT funded:

For each seed:
- **The loss frame:** "[What happens if we don't act]"
- **Supporting evidence:** What data or trends support this framing
- **Emotional register:** What feeling this evokes (urgency, concern, responsibility)
- **Deployment suggestion:** Where in the proposal to use this

### 5. Cognitive Bias Exploitation Map (EP-09)
Identify specific cognitive biases that affect grant evaluation, and how to ethically leverage them:

| Bias | Description | How It Affects Review | How to Leverage |
|------|-------------|----------------------|-----------------|
| Anchoring | First information disproportionately influences judgment | Strong opening sets the tone for entire review | Lead with your strongest claim |
| Halo effect | Positive impression in one area colors all judgments | Excellence in one section elevates the entire proposal | Make your first section exceptional |
| Confirmation bias | Evaluators seek evidence confirming initial impression | Once an evaluator "likes" a proposal, they find reasons to support it | Front-load compelling arguments |
| Status quo bias | Preference for established approaches | Novel methods can feel risky to evaluators | Frame innovation as extending proven approaches |
| Bandwagon effect | People follow perceived consensus | Show that the field is moving in your direction | Reference growing interest, trending topics |
| Peak-end rule | Experiences judged by their peak moment and ending | The strongest section and the conclusion matter most | Engineer a "peak moment" and strong close |

### 6. Evaluator Red Flags
List 10-15 things that immediately trigger negative evaluator responses:
- [Red flag] — [Why evaluators react negatively] — [How to avoid]

### 7. Scoring Psychology
Analyze how evaluators actually assign scores:
- Score clustering patterns (tendency toward middle scores)
- The "champion effect" — what makes an evaluator fight for a proposal in panel
- Score justification behavior — evaluators need to explain scores to peers
- How to write for the evaluator's written comments (which go to the panel)
- The difference between "this is good" and "I will advocate for this"

---

## OUTPUT FORMAT
Structure as a markdown document titled "# Evaluator Psychology Profile: [Grant Name]". Begin with a 3-sentence summary of the most important psychological insights for this specific grant. Use tables for the EP Deployment Map and Bias Map. Use callout-style formatting (> blockquotes) for Champion Phrases and Loss-Frame Seeds.

**CRITICAL:** All recommendations must be ethically sound — we optimize for clear communication and persuasion, never for deception or misrepresentation.`,
};
