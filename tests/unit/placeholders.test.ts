import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  applyResolutions,
  parsePlaceholders,
  preprocessPlaceholdersForMarkdown,
} from "@/lib/placeholders";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(
  here,
  "..",
  "..",
  "src",
  "lib",
  "__fixtures__",
  "placeholder-contexts.md",
);
const fixture = readFileSync(fixturePath, "utf8");

describe("parsePlaceholders — markdown context detection", () => {
  it("detects every tag type across paragraphs, formatting, headings, lists, blockquotes, and tables", () => {
    const tags = parsePlaceholders(fixture);

    // Eight applicable contexts × five tag types = 40, plus two
    // hint variants. The three code-block tags are excluded by
    // design.
    expect(tags.length).toBe(42);

    const byType = (t: string) => tags.filter((tag) => tag.type === t).length;
    expect(byType("VERIFY")).toBeGreaterThanOrEqual(8);
    expect(byType("CITATION NEEDED")).toBeGreaterThanOrEqual(8);
    expect(byType("USER INPUT NEEDED")).toBeGreaterThanOrEqual(8);
    expect(byType("ESTIMATED")).toBeGreaterThanOrEqual(8);
    expect(byType("CHECK DATE")).toBeGreaterThanOrEqual(8);
  });

  it("excludes tags inside inline `code` and fenced ``` code ``` spans", () => {
    const tags = parsePlaceholders(fixture);
    const inlineCodeIdx = fixture.indexOf("`[VERIFY]`");
    const fenceStart = fixture.indexOf("```\nBlock");
    const fenceEnd = fixture.indexOf("```", fenceStart + 3);

    for (const tag of tags) {
      // None of the detected tags should fall inside the inline code
      // span or the fenced range.
      const insideInline =
        tag.startIndex >= inlineCodeIdx &&
        tag.startIndex < inlineCodeIdx + "`[VERIFY]`".length;
      const insideFence =
        tag.startIndex >= fenceStart && tag.startIndex < fenceEnd;
      expect(insideInline).toBe(false);
      expect(insideFence).toBe(false);
    }
  });

  it("preserves hint payloads", () => {
    const tags = parsePlaceholders(fixture);
    const citationWithHint = tags.find((t) =>
      t.hint?.startsWith("epidemiology meta-analysis"),
    );
    expect(citationWithHint).toBeDefined();
    expect(citationWithHint?.type).toBe("CITATION NEEDED");
  });
});

describe("preprocessPlaceholdersForMarkdown", () => {
  it("wraps every detected pending tag in a placeholder-pill span", () => {
    const html = preprocessPlaceholdersForMarkdown(fixture, {}, new Set());
    const tags = parsePlaceholders(fixture);
    const spanCount = (html.match(/<span [^>]*data-tag-id=/g) || []).length;
    expect(spanCount).toBe(tags.length);
  });

  it("leaves code-block content untouched", () => {
    const html = preprocessPlaceholdersForMarkdown(fixture, {}, new Set());
    expect(html).toContain("`[VERIFY]`");
    expect(html).toContain("Block [CITATION NEEDED]");
    expect(html).toContain("[USER INPUT NEEDED] same here.");
  });

  it("substitutes resolved tags with the resolution text", () => {
    const tags = parsePlaceholders(fixture);
    const verifyTag = tags.find((t) => t.type === "VERIFY");
    if (!verifyTag) throw new Error("expected at least one VERIFY tag");
    const resolutions = { [verifyTag.id]: "VERIFIED-VALUE" };
    const html = preprocessPlaceholdersForMarkdown(
      fixture,
      resolutions,
      new Set(),
    );
    expect(html).toContain("VERIFIED-VALUE");
  });

  it("strips brackets when a tag is confirmed", () => {
    const tags = parsePlaceholders(fixture);
    const verifyTag = tags.find((t) => t.type === "VERIFY");
    if (!verifyTag) throw new Error("expected at least one VERIFY tag");
    const html = preprocessPlaceholdersForMarkdown(
      fixture,
      {},
      new Set([verifyTag.id]),
    );
    // The exact original raw of this tag should no longer appear at
    // its original position — preprocessing removes the brackets.
    const before = fixture.slice(verifyTag.startIndex - 5, verifyTag.startIndex);
    const after = fixture.slice(verifyTag.endIndex, verifyTag.endIndex + 5);
    const originalSurroundings = before + verifyTag.raw + after;
    expect(html).not.toContain(originalSurroundings);
  });
});

describe("parsePlaceholders — asserted bold span scope (Round 4 Group 1)", () => {
  it("extends scope through `**assertion**` for VERIFY tags", () => {
    const content = "Eligibility cap [VERIFY] **No minimum stated in provided guideline** for this scheme.";
    const [tag] = parsePlaceholders(content);
    expect(tag).toBeDefined();
    expect(tag.type).toBe("VERIFY");
    expect(tag.raw).toBe("[VERIFY]");
    expect(tag.assertionText).toBe("No minimum stated in provided guideline");
    expect(tag.scopeRaw).toBe("[VERIFY] **No minimum stated in provided guideline**");
    expect(tag.scopeEndIndex).toBe(tag.endIndex + " **No minimum stated in provided guideline**".length);
  });

  it("extends scope for ESTIMATED and CHECK DATE tags", () => {
    const content = "Budget [ESTIMATED] **RM 250,000** and deadline [CHECK DATE] **2026-03-15**.";
    const tags = parsePlaceholders(content);
    expect(tags).toHaveLength(2);
    expect(tags[0].type).toBe("ESTIMATED");
    expect(tags[0].assertionText).toBe("RM 250,000");
    expect(tags[1].type).toBe("CHECK DATE");
    expect(tags[1].assertionText).toBe("2026-03-15");
  });

  it("does NOT extend scope for replace-required types", () => {
    const content = "Need [CITATION NEEDED] **this looks like an assertion** here.";
    const [tag] = parsePlaceholders(content);
    expect(tag.type).toBe("CITATION NEEDED");
    expect(tag.assertionText).toBeUndefined();
    expect(tag.scopeEndIndex).toBe(tag.endIndex);
    expect(tag.scopeRaw).toBe("[CITATION NEEDED]");
  });

  it("falls back to bracket-only scope when no bold span follows", () => {
    const content = "A plain [VERIFY] tag with no assertion here.";
    const [tag] = parsePlaceholders(content);
    expect(tag.assertionText).toBeUndefined();
    expect(tag.scopeEndIndex).toBe(tag.endIndex);
    expect(tag.scopeRaw).toBe("[VERIFY]");
  });

  it("does not match across newlines or with stray asterisks", () => {
    // Newline between tag and bold breaks the lookahead.
    const newlineCase = "[VERIFY]\n**should not extend**";
    expect(parsePlaceholders(newlineCase)[0].assertionText).toBeUndefined();

    // Stray asterisk inside the assertion blocks the conservative regex.
    const strayAsterisk = "[VERIFY] **with *stray* asterisks**";
    expect(parsePlaceholders(strayAsterisk)[0].assertionText).toBeUndefined();
  });

  it("does not double-count tags inside an asserted bold span", () => {
    // Pathological case: a CITATION NEEDED tag falls inside the bold span.
    // The lookahead should consume the inner span; the inner tag is not
    // emitted as a separate instance.
    const content = "[VERIFY] **outer with [CITATION NEEDED] inside**";
    const tags = parsePlaceholders(content);
    expect(tags).toHaveLength(1);
    expect(tags[0].type).toBe("VERIFY");
    expect(tags[0].assertionText).toBe("outer with [CITATION NEEDED] inside");
  });

  it("preserves the fixture tag count after Round 4 changes", () => {
    // Round 3 baseline: the fixture parses to 42 tags. Group 1 widens scope
    // for confirm-or-replace tags but never adds or removes instances. The
    // fixture's bold-wrapped tags (e.g. `**[VERIFY]** tag.`) do not match
    // the lookahead because the closing `**` belongs to the tag's own
    // bold wrapper.
    const tags = parsePlaceholders(fixture);
    expect(tags).toHaveLength(42);
    // None of the fixture tags should pick up an assertion since none
    // follow the `[TAG] **assertion**` convention.
    expect(tags.filter((t) => t.assertionText !== undefined)).toHaveLength(0);
  });
});

describe("applyResolutions — wider-scope semantics (Round 4 Group 1)", () => {
  it("replaces the entire scope when a resolution is applied", () => {
    const content = "Cap [VERIFY] **No minimum stated** confirmed.";
    const [tag] = parsePlaceholders(content);
    const result = applyResolutions(content, { [tag.id]: "Up to RM250,000" }, new Set());
    expect(result).toBe("Cap Up to RM250,000 confirmed.");
  });

  it("keeps the assertion text when a tag is confirmed as-is", () => {
    const content = "Cap [VERIFY] **No minimum stated** confirmed.";
    const [tag] = parsePlaceholders(content);
    const result = applyResolutions(content, {}, new Set([tag.id]));
    expect(result).toBe("Cap No minimum stated confirmed.");
  });

  it("strips the entire scope when confirmed and no assertion follows", () => {
    const content = "Bare [VERIFY] tag.";
    const [tag] = parsePlaceholders(content);
    const result = applyResolutions(content, {}, new Set([tag.id]));
    expect(result).toBe("Bare  tag.");
  });

  it("leaves the scope untouched when neither resolved nor confirmed", () => {
    const content = "Untouched [VERIFY] **assertion stays** here.";
    const result = applyResolutions(content, {}, new Set());
    expect(result).toBe(content);
  });
});

describe("preprocessPlaceholdersForMarkdown — wider scope rendering (Round 4 Group 1)", () => {
  it("emits placeholder-pill-wide class and wraps the assertion in <strong>", () => {
    const content = "Cap [VERIFY] **No minimum stated** confirmed.";
    const html = preprocessPlaceholdersForMarkdown(content, {}, new Set());
    expect(html).toContain("placeholder-pill-wide");
    expect(html).toContain("<strong>No minimum stated</strong>");
    // Outer span contains the literal bracket text plus the strong span.
    expect(html).toMatch(/<span [^>]*data-tag-id=[^>]*>\[VERIFY\] <strong>No minimum stated<\/strong><\/span>/);
  });

  it("keeps assertion text after a confirmed wider-scope tag", () => {
    const content = "Cap [VERIFY] **No minimum stated** confirmed.";
    const [tag] = parsePlaceholders(content);
    const html = preprocessPlaceholdersForMarkdown(content, {}, new Set([tag.id]));
    expect(html).toContain("Cap No minimum stated confirmed.");
    expect(html).not.toContain("[VERIFY]");
    expect(html).not.toContain("placeholder-pill-wide");
  });

  it("does not add the wide class for replace-required tags", () => {
    const content = "Need [CITATION NEEDED] here.";
    const html = preprocessPlaceholdersForMarkdown(content, {}, new Set());
    expect(html).toContain("placeholder-pill-required");
    expect(html).not.toContain("placeholder-pill-wide");
  });
});
