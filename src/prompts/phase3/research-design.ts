import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step1-research-design",
  phase: 3,
  step: 1,
  name: "Research Design Generator",
  description:
    "Generate a comprehensive research design framework including methodology, sampling strategy, data collection, and analysis plan aligned with your grant requirements.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "researchApproach",
    "studyDuration",
    "targetParticipants",
    "country",
    "careerStage",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "grantScheme",
    "Method4_Convergence_Synthesis.md",
    "Method1_Gap_Synthesis.md",
    "Method2_Trend_Discovery.md",
    "Method3_Research_Direction_Brief.md",
  ],
  outputName: "Research_Design.md",
  epTags: ["EP-01", "EP-03", "EP-05", "EP-07"],
  estimatedWords: 4000,
  template: `You are a research methodology expert who designs rigorous, fundable research frameworks. Your task is to create a comprehensive research design that aligns with the grant strategy and demonstrates methodological sophistication to evaluators.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if researchApproach}}- **Preferred Approach:** {{researchApproach}}{{/if}}
{{#if studyDuration}}- **Study Duration:** {{studyDuration}}{{/if}}
{{#if targetParticipants}}- **Target Sample/Participants:** {{targetParticipants}}{{/if}}
{{#if country}}- **Country:** {{country}}{{/if}}
{{#if careerStage}}- **Career Stage:** {{careerStage}}{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT (from Phase 2)
{{> Proposal_Blueprint.md}}
{{/if}}
{{#if grantScheme}}- **Target Grant Scheme:** {{grantScheme}}{{/if}}

{{#if Method4_Convergence_Synthesis.md}}
## RESEARCH DISCOVERY CONTEXT (Convergence Synthesis from Phase 1)
The following is the researcher's unified research direction. The research design should operationalize the recommended direction, research questions, and methodological suggestions from this document.
{{> Method4_Convergence_Synthesis.md}}
{{/if}}

{{#unless Method4_Convergence_Synthesis.md}}
{{#if Method1_Gap_Synthesis.md}}
## RESEARCH DISCOVERY CONTEXT (Gap-Based Discovery from Phase 1)
{{> Method1_Gap_Synthesis.md}}
{{/if}}

{{#if Method2_Trend_Discovery.md}}
## RESEARCH DISCOVERY CONTEXT (Trend-Based Discovery from Phase 1)
{{> Method2_Trend_Discovery.md}}
{{/if}}

{{#if Method3_Research_Direction_Brief.md}}
## RESEARCH DISCOVERY CONTEXT (Research Direction Brief from Phase 1)
{{> Method3_Research_Direction_Brief.md}}
{{/if}}
{{/unless}}

{{#if grantScheme}}
## MOHE METHODOLOGY EXPECTATIONS
For MOHE grants, evaluators have specific methodology expectations:
- Clear research questions/hypotheses mapped to specific objectives
- Justified sample size (power analysis for quantitative, saturation argument for qualitative)
- Named and validated instruments with citations
- Detailed analytical plan with specific statistical tests or qualitative frameworks
- Ethical approval timeline (mention MREC/institutional ethics committee)
- For PRGS: include prototype development methodology and testing protocol
- Gantt chart data that maps to the MOHE-standard project timeline format
{{/if}}

## INSTRUCTIONS

Produce a comprehensive Research Design document covering these sections:

---

### 1. Research Design Overview (EP-01)
- **Design type** — Clearly state and justify the chosen research design (experimental, quasi-experimental, longitudinal, cross-sectional, mixed-methods, etc.)
- **Epistemological stance** — Briefly state the underlying paradigm (positivist, interpretivist, pragmatist, critical realist)
- **Alignment with objectives** — Show how the design directly addresses each research objective from the Proposal Blueprint
- **Innovation in design** — Highlight what makes this design particularly suited or novel for this research question

### 2. Methodology Framework (EP-03)
- **Overall approach** — Detailed description of the methodological framework
- **Phases/stages** — Break the research into clear phases with dependencies
- **Methods per phase** — Specific methods, tools, and techniques for each phase
- **Justification** — Why each method is the best choice for answering specific research questions
- **Methodological limitations** — Acknowledge and address potential weaknesses

### 3. Sampling Strategy
- **Population definition** — Clearly define the target population
- **Sampling method** — Describe the sampling technique (probability, purposive, snowball, stratified, etc.)
- **Sample size** — Justify the sample size using power analysis, saturation principles, or discipline-specific norms
- **Inclusion/exclusion criteria** — Specific criteria with rationale
- **Recruitment strategy** — How participants will be identified and recruited
- **Attrition plan** — How to handle dropout/non-response

### 4. Data Collection Plan (EP-05)
- **Instruments** — Describe all data collection instruments (surveys, interview protocols, observation frameworks, sensors, etc.)
- **Validation** — How instruments will be validated (pilot testing, expert review, psychometric properties)
- **Timeline** — Data collection schedule with milestones
- **Quality assurance** — Procedures to ensure data quality and consistency
- **Ethical considerations** — Informed consent, anonymity, data protection

### 5. Data Analysis Plan (EP-07)
- **Analysis strategy** — Step-by-step analysis approach for each data type
- **Statistical/analytical methods** — Specific tests, models, or analytical frameworks
- **Software tools** — Analysis software and justification
- **Validity & reliability** — How you will ensure trustworthiness of findings
- **Triangulation** — If mixed-methods, how different data sources will be integrated

### 6. Timeline & Milestones
Create a phase-by-phase timeline:
| Phase | Activities | Duration | Deliverables | Dependencies |
|-------|-----------|----------|-------------|-------------|

### 7. Risk Assessment & Mitigation
| Risk | Probability | Impact | Mitigation Strategy | Contingency Plan |
|------|------------|--------|--------------------|--------------------|

### 8. Resource Requirements
- **Personnel** — Skills and roles needed
- **Equipment/software** — Technical requirements
- **Access/permissions** — Institutional, ethical, or data access needs
- **Budget implications** — Key cost drivers from the research design

---

## OUTPUT FORMAT
Structure your response as a markdown document titled "# Research Design: [Project Title]". Begin with a 200-word executive summary. Use tables, diagrams (described textually), and clear headings. Flag uncertain elements with [VERIFY] and items needing researcher input with [USER INPUT NEEDED].

**CRITICAL:** The research design must be specific enough to be implementable, not generic. Reference the grant requirements and Proposal Blueprint strategy throughout. Demonstrate to evaluators that this is a well-thought-out, feasible plan.`,
};
