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

  it("uses Pattern C to scope back to the asserted text when no bold span follows", () => {
    const content = "A plain [VERIFY] tag with no assertion here.";
    const [tag] = parsePlaceholders(content);
    expect(tag.scopePattern).toBe("pattern-c");
    expect(tag.assertionText).toBe("A plain");
    expect(tag.scopeEndIndex).toBe(tag.endIndex);
    expect(tag.scopeRaw).toBe("A plain [VERIFY]");
  });

  it("falls back to bracket-only when the bracket is at the start of a line", () => {
    const content = "Some preamble.\n[VERIFY] tag at start of line.";
    const [tag] = parsePlaceholders(content);
    expect(tag.scopePattern).toBe("bracket-only");
    expect(tag.assertionText).toBeUndefined();
    expect(tag.scopeStartIndex).toBe(tag.startIndex);
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

  it("preserves the fixture tag count across pattern detection rounds", () => {
    // Round 3 baseline: the fixture parses to 42 tags. Subsequent rounds
    // (Pattern A/B/C scope detection) widen scope for confirm-or-replace
    // tags but never add or remove instances.
    const tags = parsePlaceholders(fixture);
    expect(tags).toHaveLength(42);
    // Bold/italic/bold-italic-wrapped tags must still bail out of Pattern C
    // (the prior char is a markdown wrapper). Their scope stays bracket-only.
    const wrappedSamples = tags.filter((t) =>
      ["VERIFY", "ESTIMATED", "CHECK DATE"].includes(t.type) &&
      // Bracket immediately preceded by `*` or `_` in the fixture text.
      ["*", "_"].includes(fixture[t.startIndex - 1] ?? ""),
    );
    expect(wrappedSamples.length).toBeGreaterThan(0);
    for (const tag of wrappedSamples) {
      expect(tag.scopePattern).toBe("bracket-only");
      expect(tag.assertionText).toBeUndefined();
    }
  });
});

describe("applyResolutions — wider-scope semantics (Round 4 Group 1 + hotfix)", () => {
  it("replaces the entire scope when a resolution is applied", () => {
    const content = "Cap [VERIFY] **No minimum stated** confirmed.";
    const [tag] = parsePlaceholders(content);
    const result = applyResolutions(content, { [tag.id]: "Up to RM250,000" }, new Set());
    expect(result).toBe("Cap Up to RM250,000 confirmed.");
  });

  // Hotfix change: confirm-as-is now preserves surrounding bold markers
  // for both Pattern A and Pattern B. Round 4 Group 1's behaviour of
  // stripping the markers is gone — the bold belongs to the document.
  it("preserves bold markers when a Pattern A tag is confirmed as-is", () => {
    const content = "Cap [VERIFY] **No minimum stated** confirmed.";
    const [tag] = parsePlaceholders(content);
    const result = applyResolutions(content, {}, new Set([tag.id]));
    expect(result).toBe("Cap **No minimum stated** confirmed.");
  });

  it("preserves Pattern C asserted text and strips the bracket on confirm", () => {
    // Round 7: with no following bold span, Pattern C scopes back to capture
    // "Bare" as the assertion. Confirm removes the bracket, keeps the
    // assertion, and trims trailing whitespace — yielding a single space
    // between the assertion and the rest of the sentence.
    const content = "Bare [VERIFY] tag.";
    const [tag] = parsePlaceholders(content);
    expect(tag.scopePattern).toBe("pattern-c");
    expect(tag.assertionText).toBe("Bare");
    const result = applyResolutions(content, {}, new Set([tag.id]));
    expect(result).toBe("Bare tag.");
  });

  it("strips the entire scope when confirmed and the tag is at start of line", () => {
    // Bracket-only fallback: the tag starts the line, so Pattern C does not
    // fire. Confirm removes the bracket and leaves the surrounding spacing
    // verbatim (the leading newline and trailing space remain).
    const content = "Preamble.\n[VERIFY] tag.";
    const [tag] = parsePlaceholders(content);
    expect(tag.scopePattern).toBe("bracket-only");
    const result = applyResolutions(content, {}, new Set([tag.id]));
    expect(result).toBe("Preamble.\n tag.");
  });

  it("leaves the scope untouched when neither resolved nor confirmed", () => {
    const content = "Untouched [VERIFY] **assertion stays** here.";
    const result = applyResolutions(content, {}, new Set());
    expect(result).toBe(content);
  });
});

describe("preprocessPlaceholdersForMarkdown — wider scope rendering (Round 4 Group 1 + hotfix)", () => {
  it("emits placeholder-pill-wide class and wraps the Pattern A assertion in <strong>", () => {
    const content = "Cap [VERIFY] **No minimum stated** confirmed.";
    const html = preprocessPlaceholdersForMarkdown(content, {}, new Set());
    expect(html).toContain("placeholder-pill-wide");
    expect(html).toContain("<strong>No minimum stated</strong>");
    // Outer span contains the literal bracket text plus the strong span.
    expect(html).toMatch(/<span [^>]*data-tag-id=[^>]*>\[VERIFY\] <strong>No minimum stated<\/strong><\/span>/);
  });

  it("preserves bold markers in the output when a Pattern A tag is confirmed", () => {
    const content = "Cap [VERIFY] **No minimum stated** confirmed.";
    const [tag] = parsePlaceholders(content);
    const html = preprocessPlaceholdersForMarkdown(content, {}, new Set([tag.id]));
    expect(html).toContain("Cap **No minimum stated** confirmed.");
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

describe("parsePlaceholders — Pattern B: tag inside bold span (Round 4 hotfix)", () => {
  it("extends scope backward through the opening `**` and forward through the closing `**`", () => {
    const content = "submission portal as **[VERIFY] MyGRANTS/ReDI/institutional RMC workflow** before writing.";
    const [tag] = parsePlaceholders(content);
    expect(tag).toBeDefined();
    expect(tag.type).toBe("VERIFY");
    expect(tag.scopeStartIndex).toBeLessThan(tag.startIndex);
    expect(tag.scopeRaw).toBe("**[VERIFY] MyGRANTS/ReDI/institutional RMC workflow**");
    expect(tag.assertionText).toBe("MyGRANTS/ReDI/institutional RMC workflow");
  });

  it("captures content on both sides of the tag inside the bold span", () => {
    const content = "**Workflow [VERIFY] step** is required.";
    const [tag] = parsePlaceholders(content);
    expect(tag.assertionText).toBe("Workflow step");
    expect(tag.scopeRaw).toBe("**Workflow [VERIFY] step**");
  });

  it("falls back to bracket-only when bold-wrapped tag has no inner assertion", () => {
    // `**[VERIFY]**` has empty assertion → not a meaningful Pattern B match.
    const content = "Bold **[VERIFY]** tag.";
    const [tag] = parsePlaceholders(content);
    expect(tag.assertionText).toBeUndefined();
    expect(tag.scopeStartIndex).toBe(tag.startIndex);
    expect(tag.scopeEndIndex).toBe(tag.endIndex);
    expect(tag.scopeRaw).toBe("[VERIFY]");
  });

  it("falls back when the assertion contains stray asterisks (bold-italic wrapping)", () => {
    const content = "Bold-italic ***[VERIFY]*** tag.";
    const [tag] = parsePlaceholders(content);
    expect(tag.assertionText).toBeUndefined();
    expect(tag.scopeStartIndex).toBe(tag.startIndex);
  });

  it("requires the closing `**` on the same line as the tag", () => {
    // `**[VERIFY] X` on one line, `**` on the next → no Pattern B match.
    const content = "**[VERIFY] X\n**";
    const [tag] = parsePlaceholders(content);
    expect(tag.assertionText).toBeUndefined();
    expect(tag.scopeStartIndex).toBe(tag.startIndex);
  });

  it("does not extend Pattern B for replace-required types", () => {
    const content = "**[CITATION NEEDED] looks like an assertion**";
    const [tag] = parsePlaceholders(content);
    expect(tag.type).toBe("CITATION NEEDED");
    expect(tag.assertionText).toBeUndefined();
    expect(tag.scopeStartIndex).toBe(tag.startIndex);
    expect(tag.scopeEndIndex).toBe(tag.endIndex);
  });

  it("skips an inner tag whose bracket falls inside a Pattern B claim", () => {
    const content = "**[VERIFY] outer with [VERIFY] inner**";
    const tags = parsePlaceholders(content);
    expect(tags).toHaveLength(1);
    expect(tags[0].assertionText).toBe("outer with [VERIFY] inner");
  });

  it("isolates two adjacent Pattern B spans into separate scopes", () => {
    const content = "**[VERIFY] one** and **[VERIFY] two**";
    const tags = parsePlaceholders(content);
    expect(tags).toHaveLength(2);
    expect(tags[0].assertionText).toBe("one");
    expect(tags[1].assertionText).toBe("two");
    // Scopes must not overlap.
    expect(tags[0].scopeEndIndex).toBeLessThanOrEqual(tags[1].scopeStartIndex);
  });
});

describe("applyResolutions — Pattern B (Round 4 hotfix)", () => {
  it("replaces the entire bold scope with the user's text", () => {
    const content = "exact submission portal as **[VERIFY] MyGRANTS/ReDI/institutional RMC workflow** before writing final compliance text.";
    const [tag] = parsePlaceholders(content);
    const result = applyResolutions(content, { [tag.id]: "ReDI" }, new Set());
    expect(result).toBe("exact submission portal as ReDI before writing final compliance text.");
  });

  it("preserves the surrounding bold markers when a Pattern B tag is confirmed", () => {
    const content = "Cap **[VERIFY] No minimum stated** confirmed.";
    const [tag] = parsePlaceholders(content);
    const result = applyResolutions(content, {}, new Set([tag.id]));
    expect(result).toBe("Cap **No minimum stated** confirmed.");
  });

  it("collapses extra whitespace when confirming a Pattern B tag with leading content", () => {
    const content = "Step: **Workflow [VERIFY] step** required.";
    const [tag] = parsePlaceholders(content);
    const result = applyResolutions(content, {}, new Set([tag.id]));
    expect(result).toBe("Step: **Workflow step** required.");
  });

  it("leaves a Pattern B scope untouched when skipped (neither resolved nor confirmed)", () => {
    const content = "Cap **[VERIFY] No minimum stated** confirmed.";
    const result = applyResolutions(content, {}, new Set());
    expect(result).toBe(content);
  });
});

describe("preprocessPlaceholdersForMarkdown — Pattern B (Round 4 hotfix)", () => {
  it("wraps the entire bold scope in a wider pill with content in <strong>", () => {
    const content = "Use **[VERIFY] MyGRANTS workflow** before submission.";
    const html = preprocessPlaceholdersForMarkdown(content, {}, new Set());
    expect(html).toContain("placeholder-pill-wide");
    expect(html).toContain("<strong>[VERIFY] MyGRANTS workflow</strong>");
    expect(html).toMatch(
      /<span [^>]*placeholder-pill-wide[^>]*><strong>\[VERIFY\] MyGRANTS workflow<\/strong><\/span>/,
    );
    // No leftover markdown bold markers around the span.
    expect(html).not.toMatch(/\*\*<span /);
    expect(html).not.toMatch(/<\/span>\*\*/);
  });

  it("preserves bold markers in the output when a Pattern B tag is confirmed", () => {
    const content = "Cap **[VERIFY] No minimum stated** confirmed.";
    const [tag] = parsePlaceholders(content);
    const html = preprocessPlaceholdersForMarkdown(content, {}, new Set([tag.id]));
    expect(html).toContain("Cap **No minimum stated** confirmed.");
    expect(html).not.toContain("[VERIFY]");
    expect(html).not.toContain("placeholder-pill-wide");
  });

  it("substitutes the entire scope (including `**` markers) on resolution", () => {
    const content = "Use **[VERIFY] workflow** before submission.";
    const [tag] = parsePlaceholders(content);
    const html = preprocessPlaceholdersForMarkdown(content, { [tag.id]: "ReDI" }, new Set());
    expect(html).toContain("Use ReDI before submission.");
    expect(html).not.toContain("**");
    expect(html).not.toContain("[VERIFY]");
  });
});
