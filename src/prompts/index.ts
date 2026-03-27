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
import { template as dataCompiler } from "./phase5/step1-data-compiler";

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
  dataCompiler,
];

export const templateMap: Record<string, PromptTemplate> = Object.fromEntries(
  templates.map((t) => [t.id, t]),
);
