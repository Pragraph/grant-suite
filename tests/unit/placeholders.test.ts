import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
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
