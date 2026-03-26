import { templates, templateMap } from "@/prompts";
import type { PromptTemplate } from "@/prompts/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CompileContext {
  project: {
    title: string;
    discipline: string;
    country: string;
    careerStage: string;
    targetFunder?: string;
    budgetRange?: string;
    [key: string]: unknown;
  };
  documents: Record<string, string>; // canonicalName → content
  formInputs: Record<string, string>; // user form values for this step
}

export interface CompileResult {
  compiledPrompt: string;
  estimatedWords: number;
  missingRequired: string[];
  missingOptional: string[];
  epTagsDeployed: string[];
  warnings: string[];
}

// ─── EP Tag Pattern ─────────────────────────────────────────────────────────

const EP_TAG_RE = /EP-\d{2}/g;

// ─── PromptEngine ───────────────────────────────────────────────────────────

class PromptEngine {
  // ── Template Access ─────────────────────────────────────────────────────

  getTemplate(id: string): PromptTemplate {
    const tpl = templateMap[id];
    if (!tpl) throw new Error(`Template not found: ${id}`);
    return tpl;
  }

  listTemplates(phase?: number): PromptTemplate[] {
    if (phase === undefined) return templates;
    return templates.filter((t) => t.phase === phase);
  }

  getTemplateMetadata(
    id: string,
  ): Pick<
    PromptTemplate,
    | "id"
    | "phase"
    | "step"
    | "name"
    | "description"
    | "requiredInputs"
    | "optionalInputs"
    | "outputName"
    | "estimatedWords"
  > {
    const t = this.getTemplate(id);
    return {
      id: t.id,
      phase: t.phase,
      step: t.step,
      name: t.name,
      description: t.description,
      requiredInputs: t.requiredInputs,
      optionalInputs: t.optionalInputs,
      outputName: t.outputName,
      estimatedWords: t.estimatedWords,
    };
  }

  // ── Compilation ─────────────────────────────────────────────────────────

  compile(templateId: string, context: CompileContext): CompileResult {
    const tpl = this.getTemplate(templateId);
    const warnings: string[] = [];

    // Build lookup combining project fields, form inputs, and document names
    const values = this._buildValueMap(context);

    // Check required / optional inputs
    const missingRequired = tpl.requiredInputs.filter((k) => !values[k]);
    const missingOptional = tpl.optionalInputs.filter((k) => !values[k]);

    if (missingRequired.length > 0) {
      warnings.push(
        `Missing required inputs: ${missingRequired.join(", ")}`,
      );
    }

    let result = tpl.template;

    // 1. Process conditional blocks first (before variable substitution)
    result = this._processConditionals(result, values);

    // 2. Inject documents via {{> DocumentName.md}}
    result = this._injectDocuments(result, context.documents);

    // 3. Replace {{variableName}} placeholders
    result = this._substituteVariables(result, values);

    // 4. Count EP tags in the compiled output
    const epTagsDeployed = this._countEpTags(result);

    // 5. Estimate word count
    const estimatedWords = this._estimateWords(result);

    return {
      compiledPrompt: result,
      estimatedWords,
      missingRequired,
      missingOptional,
      epTagsDeployed,
      warnings,
    };
  }

  // ── Private Helpers ─────────────────────────────────────────────────────

  private _buildValueMap(
    context: CompileContext,
  ): Record<string, string | undefined> {
    const map: Record<string, string | undefined> = {};

    // Project fields
    for (const [k, v] of Object.entries(context.project)) {
      if (typeof v === "string") map[k] = v;
    }

    // Form inputs (override project fields if same key)
    for (const [k, v] of Object.entries(context.formInputs)) {
      map[k] = v;
    }

    // Document availability (key = canonicalName, value = content)
    for (const [k, v] of Object.entries(context.documents)) {
      map[k] = v;
    }

    return map;
  }

  private _processConditionals(
    text: string,
    values: Record<string, string | undefined>,
  ): string {
    // {{#if name}}...{{/if}}
    let result = text.replace(
      /\{\{#if\s+(\w[\w.]*)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_, key: string, body: string) => {
        return values[key] ? body : "";
      },
    );

    // {{#unless name}}...{{/unless}}
    result = result.replace(
      /\{\{#unless\s+(\w[\w.]*)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
      (_, key: string, body: string) => {
        return values[key] ? "" : body;
      },
    );

    return result;
  }

  private _injectDocuments(
    text: string,
    documents: Record<string, string>,
  ): string {
    return text.replace(
      /\{\{>\s*([\w._-]+(?:\.md)?)\s*\}\}/g,
      (match, name: string) => {
        return documents[name] ?? match;
      },
    );
  }

  private _substituteVariables(
    text: string,
    values: Record<string, string | undefined>,
  ): string {
    return text.replace(
      /\{\{(\w[\w.]*)\}\}/g,
      (match, key: string) => {
        return values[key] ?? match;
      },
    );
  }

  private _countEpTags(text: string): string[] {
    const matches = text.match(EP_TAG_RE);
    if (!matches) return [];
    return [...new Set(matches)].sort();
  }

  private _estimateWords(text: string): number {
    return text
      .replace(/[#*`>\-|=]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

export const promptEngine = new PromptEngine();
