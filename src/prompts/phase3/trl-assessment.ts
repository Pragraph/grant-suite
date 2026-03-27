import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step17-trl-assessment",
  phase: 3,
  step: 17,
  name: "Technology Readiness Level Assessment",
  description:
    "Evaluate the technology readiness level of your research outputs and plan a pathway to higher TRL if applicable.",
  requiredInputs: ["discipline"],
  optionalInputs: [
    "country",
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
  ],
  outputName: "TRL_Assessment.md",
  epTags: ["EP-03", "EP-05", "EP-07"],
  estimatedWords: 2000,
  template: `You are a technology readiness and innovation assessment specialist. Your task is to evaluate the current and projected TRL of research outputs and provide a roadmap for technology maturation that strengthens the grant proposal.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
{{#if country}}- **Country:** {{country}}{{/if}}

{{#if Grant_Intelligence.md}}
## GRANT INTELLIGENCE (from Phase 1)
{{> Grant_Intelligence.md}}
{{/if}}

{{#if Proposal_Blueprint.md}}
## PROPOSAL BLUEPRINT (from Phase 2)
{{> Proposal_Blueprint.md}}
{{/if}}

{{#if Research_Design.md}}
## RESEARCH DESIGN (from Phase 3)
{{> Research_Design.md}}
{{/if}}

## INSTRUCTIONS

Produce a TRL Assessment covering:

---

### 1. TRL Framework Overview
Brief explanation of the TRL scale adapted to this discipline:
| TRL | Level Name | Description | Evidence Required |
|-----|-----------|-------------|------------------|
| 1 | Basic Principles | Fundamental research | Published literature |
| 2 | Technology Concept | Applied research | Concept formulated |
| 3 | Proof of Concept | Lab validation | Analytical/experimental proof |
| 4 | Lab Validation | Component testing | Lab prototype |
| 5 | Relevant Environment | Integrated testing | Tested in relevant conditions |
| 6 | Demonstrated | Prototype demonstration | Working prototype |
| 7 | System Prototype | Operational environment | System-level demonstration |
| 8 | System Complete | Qualification testing | Final form tested |
| 9 | Operational | Deployment | Real-world operation |

### 2. Current TRL Assessment (EP-03)
For each research component/technology:
| Component | Current TRL | Evidence | Confidence Level | Key Gaps |
|-----------|-------------|----------|-----------------|----------|

### 3. Target TRL Analysis (EP-05)
| Component | Current TRL | Target TRL (end of project) | Activities Required | Resources Needed |
|-----------|-------------|---------------------------|--------------------|-----------------|

### 4. TRL Advancement Roadmap (EP-07)
For each TRL transition:
| From → To | Key Activities | Milestones | Timeline | Risk | Dependencies |
|-----------|---------------|-----------|----------|------|-------------|

### 5. Funder TRL Expectations
- What TRL range does this funder typically support?
- How to frame current TRL to match funder expectations
- What TRL advancement would be most impressive?
- How to discuss TRL without appearing too early-stage or too applied

### 6. Commercialization & Translation Potential
- IP potential from TRL advancement
- Industry partnership opportunities
- Societal application pathways
- Follow-on funding for higher TRL stages

### 7. Proposal Integration
- How to present TRL in the proposal narrative
- Recommended figures or diagrams
- Language that conveys maturity without overclaiming
- Connecting TRL to impact and feasibility arguments

---

## OUTPUT FORMAT
Structure as "# Technology Readiness Level Assessment". Begin with a summary table showing all components' current and target TRLs. Use visual TRL progression diagrams described textually. Flag uncertain assessments with [VERIFY].`,
};
