import { describe, it, expect } from "vitest";
import { parseCitationList } from "@/lib/citation-parser";

describe("parseCitationList", () => {
  it("returns an empty array for empty input", () => {
    expect(parseCitationList("")).toEqual([]);
    expect(parseCitationList("   \n  \n  ")).toEqual([]);
  });

  it("parses period-numbered lists", () => {
    const input = `1. Smith, J. (2020). Title. Journal, 10(1), 1-20.
2. Lee, K. (2021). Title. Journal, 11(2), 21-40.
3. Wong, T. (2022). Title. Journal, 12(3), 41-60.`;
    expect(parseCitationList(input)).toEqual([
      "Smith, J. (2020). Title. Journal, 10(1), 1-20.",
      "Lee, K. (2021). Title. Journal, 11(2), 21-40.",
      "Wong, T. (2022). Title. Journal, 12(3), 41-60.",
    ]);
  });

  it("parses paren-numbered lists", () => {
    const input = `1) First reference here.
2) Second reference here.`;
    expect(parseCitationList(input)).toEqual([
      "First reference here.",
      "Second reference here.",
    ]);
  });

  it("parses bracket-numbered lists", () => {
    const input = `[1] Bracketed reference one.
[2] Bracketed reference two.`;
    expect(parseCitationList(input)).toEqual([
      "Bracketed reference one.",
      "Bracketed reference two.",
    ]);
  });

  it("joins continuation lines onto the prior numbered citation", () => {
    const input = `1. Smith, J. (2020). A long title that
   wraps onto a second line. Journal, 10(1), 1-20.
2. Lee, K. (2021). Another title.`;
    expect(parseCitationList(input)).toEqual([
      "Smith, J. (2020). A long title that wraps onto a second line. Journal, 10(1), 1-20.",
      "Lee, K. (2021). Another title.",
    ]);
  });

  it("parses blank-line separated multi-line citations", () => {
    const input = `Smith, J. (2020). A title.
Journal of Research, 10(1), 1-20.

Lee, K. (2021). Another title.
Different Journal, 11(2), 21-40.`;
    expect(parseCitationList(input)).toEqual([
      "Smith, J. (2020). A title. Journal of Research, 10(1), 1-20.",
      "Lee, K. (2021). Another title. Different Journal, 11(2), 21-40.",
    ]);
  });

  it("parses unnumbered single-line lists", () => {
    const input = `First reference here.
Second reference here.
Third reference here.`;
    expect(parseCitationList(input)).toEqual([
      "First reference here.",
      "Second reference here.",
      "Third reference here.",
    ]);
  });

  it("treats a single citation as the unnumbered branch", () => {
    expect(parseCitationList("Smith, J. (2020). Title. Journal, 10(1), 1-20.")).toEqual([
      "Smith, J. (2020). Title. Journal, 10(1), 1-20.",
    ]);
    // A single numbered citation falls into the unnumbered branch (since the
    // numbered-detection threshold is 2). The numeric prefix is preserved as
    // typed because the user didn't supply enough signal to confirm intent.
    expect(parseCitationList("1. Smith, J. (2020). Title. Journal, 10(1), 1-20.")).toEqual([
      "1. Smith, J. (2020). Title. Journal, 10(1), 1-20.",
    ]);
  });

  it("collapses internal whitespace", () => {
    expect(parseCitationList("1. Smith,   J.    (2020). Title.\n2. Lee, K.")).toEqual([
      "Smith, J. (2020). Title.",
      "Lee, K.",
    ]);
  });
});
