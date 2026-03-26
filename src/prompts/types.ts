// ─── Prompt Template Types ──────────────────────────────────────────────────

export interface PromptTemplate {
  id: string;
  phase: number;
  step: number;
  name: string;
  description: string;
  requiredInputs: string[];
  optionalInputs: string[];
  outputName: string;
  epTags: string[];
  estimatedWords: number;
  template: string;
}
