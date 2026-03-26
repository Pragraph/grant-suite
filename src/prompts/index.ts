import type { PromptTemplate } from "./types";

import { template as grantIntelligence } from "./phase1/grant-intelligence";
import { template as method1Discovery } from "./phase1/method1-discovery";
import { template as method1Synthesis } from "./phase1/method1-synthesis";
import { template as method2Discovery } from "./phase1/method2-discovery";
import { template as method3Discovery } from "./phase1/method3-discovery";
import { template as frameworkSynthesis } from "./phase2/step5-synthesis";
import { template as dataCompiler } from "./phase5/step1-data-compiler";

export type { PromptTemplate } from "./types";

export const templates: PromptTemplate[] = [
  grantIntelligence,
  method1Discovery,
  method1Synthesis,
  method2Discovery,
  method3Discovery,
  frameworkSynthesis,
  dataCompiler,
];

export const templateMap: Record<string, PromptTemplate> = Object.fromEntries(
  templates.map((t) => [t.id, t]),
);
