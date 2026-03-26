import type { PromptTemplate } from "./types";

import { template as grantIntelligence } from "./phase1/grant-intelligence";
import { template as frameworkSynthesis } from "./phase2/step5-synthesis";
import { template as dataCompiler } from "./phase5/step1-data-compiler";

export type { PromptTemplate } from "./types";

export const templates: PromptTemplate[] = [
  grantIntelligence,
  frameworkSynthesis,
  dataCompiler,
];

export const templateMap: Record<string, PromptTemplate> = Object.fromEntries(
  templates.map((t) => [t.id, t]),
);
