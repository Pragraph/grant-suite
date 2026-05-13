import { describe, it, expect } from "vitest";
import {
  extractLinesFromItems,
  formatLinesToMarkdown,
  convertPdfToMarkdown,
  type PageLines,
  type RawTextItem,
} from "@/lib/external-drafting/pdf-to-markdown";

function makeItem(
  str: string,
  x: number,
  y: number,
  options: { width?: number; height?: number } = {},
): RawTextItem {
  return {
    str,
    transform: [12, 0, 0, 12, x, y],
    width: options.width ?? str.length * 6,
    height: options.height ?? 12,
  };
}

describe("extractLinesFromItems", () => {
  it("returns an empty list when no items provided", () => {
    expect(extractLinesFromItems([])).toEqual([]);
  });

  it("groups items at the same y-coordinate into a single line, ordered left-to-right", () => {
    const lines = extractLinesFromItems([
      makeItem("World", 100, 500),
      makeItem("Hello", 50, 500),
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe("Hello World");
  });

  it("separates items at different y-coordinates into different lines, top-down", () => {
    const lines = extractLinesFromItems([
      makeItem("Second", 50, 480),
      makeItem("First", 50, 500),
    ]);
    expect(lines.map((l) => l.text)).toEqual(["First", "Second"]);
  });

  it("collapses internal whitespace", () => {
    const lines = extractLinesFromItems([
      makeItem("Hello   World", 50, 500),
    ]);
    expect(lines[0].text).toBe("Hello World");
  });

  it("skips empty-string items but still tracks line heights", () => {
    const lines = extractLinesFromItems([
      makeItem("", 50, 500),
      makeItem("Actual content", 60, 500, { height: 16 }),
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe("Actual content");
    expect(lines[0].height).toBe(16);
  });
});

describe("formatLinesToMarkdown", () => {
  function makePage(
    lines: { text: string; height: number }[],
    medianHeight: number,
    pageNumber: number,
  ): PageLines {
    return {
      pageNumber,
      lines: lines.map((l) => l.text),
      medianHeight,
      linesWithHeights: lines,
    };
  }

  it("renders heading-sized lines as H2", () => {
    const page = makePage(
      [
        { text: "Big Heading", height: 20 },
        { text: "Some body text below the heading.", height: 12 },
      ],
      12,
      1,
    );
    const md = formatLinesToMarkdown([page]);
    expect(md).toContain("## Big Heading");
    expect(md).toContain("Some body text below the heading.");
  });

  it("treats short all-caps lines as H2", () => {
    const page = makePage(
      [
        { text: "INTRODUCTION", height: 12 },
        { text: "Lowercase paragraph text.", height: 12 },
      ],
      12,
      1,
    );
    const md = formatLinesToMarkdown([page]);
    expect(md).toContain("## INTRODUCTION");
    expect(md).toContain("Lowercase paragraph text.");
  });

  it("renders section-label lines (A., 1.2.3) as H3", () => {
    const page = makePage(
      [
        { text: "A. Background", height: 12 },
        { text: "Body of section.", height: 12 },
      ],
      12,
      1,
    );
    const md = formatLinesToMarkdown([page]);
    expect(md).toContain("### A. Background");
  });

  it("renders bullet-prefixed lines as markdown bullets", () => {
    const page = makePage(
      [
        { text: "• First bullet", height: 12 },
        { text: "- Second bullet", height: 12 },
        { text: "Body paragraph", height: 12 },
      ],
      12,
      1,
    );
    const md = formatLinesToMarkdown([page]);
    expect(md).toContain("- First bullet");
    expect(md).toContain("- Second bullet");
    expect(md).toContain("Body paragraph");
  });

  it("inserts horizontal rule between pages", () => {
    const md = formatLinesToMarkdown([
      {
        pageNumber: 1,
        lines: ["Page one"],
        medianHeight: 12,
        linesWithHeights: [{ text: "Page one", height: 12 }],
      },
      {
        pageNumber: 2,
        lines: ["Page two"],
        medianHeight: 12,
        linesWithHeights: [{ text: "Page two", height: 12 }],
      },
    ]);
    expect(md).toContain("Page one");
    expect(md).toContain("---");
    expect(md).toContain("Page two");
    expect(md.indexOf("Page one")).toBeLessThan(md.indexOf("---"));
    expect(md.indexOf("---")).toBeLessThan(md.indexOf("Page two"));
  });
});

describe("convertPdfToMarkdown (entrypoint)", () => {
  it("returns a warning for an empty file without invoking pdfjs", async () => {
    const emptyFile = new File([], "empty.pdf", { type: "application/pdf" });
    const result = await convertPdfToMarkdown(emptyFile);
    expect(result.markdown).toBe("");
    expect(result.pageCount).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/empty/i);
  });
});
