import type { PromptTemplate } from "./types";

import { template as grantIntelligence } from "./phase1/grant-intelligence";
import { template as grantMatching } from "./phase1/grant-matching";
import { template as method1Discovery } from "./phase1/method1-discovery";
import { template as method1Synthesis } from "./phase1/method1-synthesis";
import { template as method2Discovery } from "./phase1/method2-discovery";
import { template as method3Discovery } from "./phase1/method3-discovery";
import { template as method4Convergence } from "./phase1/method4-convergence";
import { template as step1Requirements } from "./phase2/step1-requirements";
import { template as step2Competitive } from "./phase2/step2-competitive";
import { template as step3Psychology } from "./phase2/step3-psychology";
import { template as step4Impact } from "./phase2/step4-impact";
import { template as step5Synthesis } from "./phase2/step5-synthesis";
import { template as combinedSession } from "./phase2/combined-session";
import { template as researchDesign } from "./phase3/research-design";
import { template as partnershipStrategy } from "./phase3/partnership-strategy";
import { template as partnerLetter } from "./phase3/partner-letter";
import { template as patentSearch } from "./phase3/patent-search";
import { template as noveltyAssessment } from "./phase3/novelty-assessment";
import { template as sdgAlignment } from "./phase3/sdg-alignment";
import { template as nationalAlignment } from "./phase3/national-alignment";
import { template as kpiPlanning } from "./phase3/kpi-planning";
import { template as researcherProfile } from "./phase3/researcher-profile";
import { template as originalityCheck } from "./phase3/originality-check";
import { template as trlAssessment } from "./phase3/trl-assessment";
import { template as dataCompiler } from "./phase5/step1-data-compiler";
import { template as executiveSummary } from "./phase5/step2-executive-summary";
import { template as methodsWriter } from "./phase5/step3-methods";
import { template as backgroundWriter } from "./phase5/step4-background";
import { template as teamAssembly } from "./phase4/team-assembly";
import { template as budgetConstruction } from "./phase4/budget-construction";
import { template as budgetJustification } from "./phase4/budget-justification";

export type { PromptTemplate } from "./types";

export const templates: PromptTemplate[] = [
  grantIntelligence,
  grantMatching,
  method1Discovery,
  method1Synthesis,
  method2Discovery,
  method3Discovery,
  method4Convergence,
  step1Requirements,
  step2Competitive,
  step3Psychology,
  step4Impact,
  step5Synthesis,
  combinedSession,
  researchDesign,
  partnershipStrategy,
  partnerLetter,
  patentSearch,
  noveltyAssessment,
  sdgAlignment,
  nationalAlignment,
  kpiPlanning,
  researcherProfile,
  originalityCheck,
  trlAssessment,
  teamAssembly,
  budgetConstruction,
  budgetJustification,
  dataCompiler,
  executiveSummary,
  methodsWriter,
  backgroundWriter,
];

export const templateMap: Record<string, PromptTemplate> = Object.fromEntries(
  templates.map((t) => [t.id, t]),
);
