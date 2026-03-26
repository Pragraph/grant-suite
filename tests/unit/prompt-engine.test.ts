import { describe, it, expect } from "vitest";
import { promptEngine, type CompileContext } from "@/lib/prompt-engine";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeContext(overrides?: Partial<CompileContext>): CompileContext {
  return {
    project: {
      title: "Test Project",
      discipline: "Computer Science",
      country: "Netherlands",
      careerStage: "Early Career",
      targetFunder: "NWO",
      budgetRange: "€250k–€500k",
    },
    documents: {},
    formInputs: {},
    ...overrides,
  };
}

// ─── Template Access ────────────────────────────────────────────────────────

describe("PromptEngine — template access", () => {
  it("getTemplate returns a template by id", () => {
    const tpl = promptEngine.getTemplate("phase1.grant-intelligence");
    expect(tpl.id).toBe("phase1.grant-intelligence");
    expect(tpl.phase).toBe(1);
    expect(tpl.name).toBe("Grant Intelligence Gathering");
  });

  it("getTemplate throws on unknown id", () => {
    expect(() => promptEngine.getTemplate("nonexistent")).toThrow(
      "Template not found: nonexistent",
    );
  });

  it("listTemplates returns all templates", () => {
    const all = promptEngine.listTemplates();
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  it("listTemplates filters by phase", () => {
    const phase1 = promptEngine.listTemplates(1);
    expect(phase1.every((t) => t.phase === 1)).toBe(true);

    const phase2 = promptEngine.listTemplates(2);
    expect(phase2.every((t) => t.phase === 2)).toBe(true);
  });

  it("getTemplateMetadata returns partial info without template body", () => {
    const meta = promptEngine.getTemplateMetadata("phase1.grant-intelligence");
    expect(meta.id).toBe("phase1.grant-intelligence");
    expect(meta.name).toBeDefined();
    expect(meta.requiredInputs).toBeDefined();
    expect((meta as Record<string, unknown>)["template"]).toBeUndefined();
  });
});

// ─── Variable Substitution ──────────────────────────────────────────────────

describe("PromptEngine — variable substitution", () => {
  it("replaces project fields in template", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Veni Grant" },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);

    expect(result.compiledPrompt).toContain("Computer Science");
    expect(result.compiledPrompt).toContain("Netherlands");
    expect(result.compiledPrompt).toContain("Veni Grant");
  });

  it("leaves unresolved placeholders intact", () => {
    const ctx = makeContext({
      project: {
        title: "Test",
        discipline: "Physics",
        country: "UK",
        careerStage: "Senior",
      },
      formInputs: {},
    });
    // grantName is required but missing — placeholder stays
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.compiledPrompt).toContain("{{grantName}}");
  });

  it("form inputs override project fields", () => {
    const ctx = makeContext({
      formInputs: {
        grantName: "ERC Starting Grant",
        discipline: "Overridden Discipline",
      },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.compiledPrompt).toContain("Overridden Discipline");
  });
});

// ─── Document Injection ─────────────────────────────────────────────────────

describe("PromptEngine — document injection", () => {
  it("injects documents via {{> DocName.md}}", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Test Grant" },
      documents: {
        "Conceptual_Framework.md": "# My Framework\nThis is the framework.",
        "Research_Questions.md": "# Questions\n1. What is X?",
      },
    });
    const result = promptEngine.compile("phase2.framework-synthesis", ctx);
    expect(result.compiledPrompt).toContain("# My Framework");
    expect(result.compiledPrompt).toContain("1. What is X?");
  });

  it("leaves unresolved document partials intact", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Test Grant" },
      documents: {},
    });
    const result = promptEngine.compile("phase2.framework-synthesis", ctx);
    // Without documents, the {{#if}} blocks should be stripped,
    // so the partial syntax should not appear in output
    expect(result.compiledPrompt).not.toContain("{{> Conceptual_Framework.md}}");
  });
});

// ─── Conditional Blocks ─────────────────────────────────────────────────────

describe("PromptEngine — conditional blocks", () => {
  it("{{#if}} includes block when value is present", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Veni" },
      documents: { grant_guidelines_text: "These are the guidelines." },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.compiledPrompt).toContain("UPLOADED GRANT GUIDELINES");
    expect(result.compiledPrompt).toContain("These are the guidelines.");
  });

  it("{{#if}} strips block when value is absent", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Veni" },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.compiledPrompt).not.toContain("UPLOADED GRANT GUIDELINES");
  });

  it("{{#unless}} includes block when value is absent", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Veni" },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.compiledPrompt).toContain(
      "No grant guidelines were uploaded",
    );
  });

  it("{{#unless}} strips block when value is present", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Veni" },
      documents: { grant_guidelines_text: "Guidelines here" },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.compiledPrompt).not.toContain(
      "No grant guidelines were uploaded",
    );
  });
});

// ─── Missing Input Detection ────────────────────────────────────────────────

describe("PromptEngine — missing input detection", () => {
  it("reports missing required inputs", () => {
    const ctx = makeContext({
      project: {
        title: "Test",
        discipline: "Biology",
        country: "",
        careerStage: "Mid",
      },
      formInputs: {},
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.missingRequired).toContain("grantName");
    expect(result.missingRequired).toContain("country");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("reports missing optional inputs", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Test" },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.missingOptional).toContain("grant_guidelines_text");
  });

  it("reports no missing required when all present", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Full Grant" },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.missingRequired).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});

// ─── EP Tag Counting ────────────────────────────────────────────────────────

describe("PromptEngine — EP tag counting", () => {
  it("counts unique EP tags in compiled output", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Grant X" },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.epTagsDeployed).toContain("EP-01");
    expect(result.epTagsDeployed).toContain("EP-02");
    expect(result.epTagsDeployed).toContain("EP-04");
    // Should be unique and sorted
    const unique = [...new Set(result.epTagsDeployed)];
    expect(result.epTagsDeployed).toEqual(unique);
  });

  it("returns EP tags sorted", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Grant X" },
    });
    const result = promptEngine.compile("phase5.data-compiler", ctx);
    const sorted = [...result.epTagsDeployed].sort();
    expect(result.epTagsDeployed).toEqual(sorted);
  });
});

// ─── Word Count Estimation ──────────────────────────────────────────────────

describe("PromptEngine — word count estimation", () => {
  it("estimates a positive word count", () => {
    const ctx = makeContext({
      formInputs: { grantName: "Test Grant" },
    });
    const result = promptEngine.compile("phase1.grant-intelligence", ctx);
    expect(result.estimatedWords).toBeGreaterThan(100);
  });

  it("word count increases when documents are injected", () => {
    const ctxWithout = makeContext({
      formInputs: { grantName: "Test" },
    });
    const ctxWith = makeContext({
      formInputs: { grantName: "Test" },
      documents: {
        "Conceptual_Framework.md": "A ".repeat(500),
        "Research_Questions.md": "B ".repeat(500),
      },
    });

    const without = promptEngine.compile("phase2.framework-synthesis", ctxWithout);
    const withDocs = promptEngine.compile("phase2.framework-synthesis", ctxWith);

    expect(withDocs.estimatedWords).toBeGreaterThan(without.estimatedWords);
  });
});
