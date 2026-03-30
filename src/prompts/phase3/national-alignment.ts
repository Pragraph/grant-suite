import type { PromptTemplate } from "../types";

export const template: PromptTemplate = {
  id: "phase3.step13-national-alignment",
  phase: 3,
  step: 13,
  name: "National Agenda Alignment",
  description:
    "Align your research with national priorities, policies, and strategic agendas to demonstrate relevance and strengthen funder appeal.",
  requiredInputs: ["discipline", "country"],
  optionalInputs: [
    "Grant_Intelligence.md",
    "Proposal_Blueprint.md",
    "Research_Design.md",
    "grantScheme",
  ],
  outputName: "National_Alignment.md",
  epTags: ["EP-02", "EP-04"],
  estimatedWords: 2000,
  template: `You are a research policy analyst who specializes in mapping research projects to national strategic priorities. Your task is to identify how this research aligns with the country's national agendas, policies, and strategic plans.

## USER CONTEXT
- **Field/Discipline:** {{discipline}}
- **Country:** {{country}}

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

Produce a National Agenda Alignment Analysis covering:

---

### 1. Key National Policies & Strategies (EP-02)

{{#if grantScheme}}
**For Malaysia, prioritise these current national policy documents (search the web for the latest versions):**
- **13th Malaysia Plan (Rancangan Malaysia Ke-13 / RMKe-13, 2026–2030)** — the overarching national development blueprint themed "Melakar Semula Pembangunan" (Reshaping Development). Three pillars: Strengthening Governance, Raising the Ceiling, Raising the Floor. Identify the specific thrust, strategy, and focus area this research aligns with.
- **National Policy on Science, Technology and Innovation (NPSTI) 2021–2030** — the primary S&T policy. Map research to its strategic thrusts and the 10-10 MySTIE Framework's 30 national STIE niche areas.
- **Madani Economy Framework** — the Madani government's economic framework emphasising sustainability, innovation, and inclusivity. RMKe-13 is anchored on this framework.
- **Rancangan Pendidikan Tinggi Malaysia (RPTM) 2026–2035** — the new higher education development plan replacing the Malaysia Education Blueprint 2015–2025 (Higher Education). Covers research excellence, talent development, and internationalisation of Malaysian HEIs.
- **MyDigital / Malaysia Digital Economy Blueprint** — for digital/ICT research.
- **National Biotechnology Policy** — for biotech/health research.
- **National Semiconductor Strategy (NSS)** — for semiconductor, electronics, and advanced manufacturing research.
- **National Energy Transition Roadmap (NETR)** — for energy and sustainability research.
- **National AI Action Plan 2030** — for AI and data science research.
- **Sector-specific policies** — search for the latest policy relevant to the researcher's specific discipline.

Use direct quotations from these documents where possible — Malaysian evaluators value seeing their national language mirrored in proposals. Include Malay terminology where standard (e.g., "Teras Strategik", "Pemacu Pertumbuhan").
{{/if}}

{{#unless grantScheme}}
Identify the most relevant national documents, policies, and strategic plans:
{{/unless}}

| Policy/Strategy | Issuing Body | Relevant Priority Area | How Research Aligns |
|----------------|-------------|----------------------|-------------------|

### 2. National Research Priority Areas
- Map the research to officially designated national research priority areas
- Identify specific calls, programs, or initiatives that this research supports
- Note any recent policy shifts or emerging priorities

### 3. Economic & Social Impact Alignment (EP-04)

{{#if grantScheme}}
For Malaysian grants, map to these specific impact dimensions valued by MOHE:
- **High-income nation transition** — how does this research support Malaysia's economic advancement towards top-30 global economy by 2030?
- **Bumiputera development agenda** — if applicable, note any relevance to equitable development
- **Regional development** — impact on less-developed Malaysian states (Sabah, Sarawak, East Coast)
- **Halal economy** — for relevant sectors (food science, pharmaceuticals, cosmetics, finance)
- **Green economy and sustainability** — ESG alignment, renewable energy, NETR goals
{{/if}}

- **Economic development** — How this research contributes to national economic goals
- **Social development** — Health, education, welfare, equity implications
- **Industry relevance** — Links to key national industries or sectors
- **Human capital** — Training, capacity building, workforce development

### 4. Institutional & Infrastructure Alignment
- Existing national infrastructure this research leverages
- National centers of excellence or networks to reference
- Government agencies that would benefit from outcomes

### 5. Proposal Integration Recommendations
Provide specific language and framing for:
- How to reference national priorities in the proposal abstract
- Key policy documents to cite
- Phrases and terminology that resonate with national funders
- How to position local impact within global context

### 6. Competitive Advantage
- How national alignment differentiates this proposal
- Specific evaluation criteria where national relevance scores points
- Evidence of government commitment to this research area

---

## OUTPUT FORMAT
Structure as "# National Agenda Alignment: {{country}}". Begin with a 100-word summary. Use tables and specific policy references. Flag items requiring verification with [VERIFY] — national policies change frequently.`,
};
