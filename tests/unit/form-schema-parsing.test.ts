import { describe, it, expect } from "vitest";
import { parseSchemaPaste, stripMarkdownFences } from "@/lib/form-schema/parsing";

describe("Form Schema paste parser — stripMarkdownFences", () => {
  it("plain JSON passes through", () => {
    const input = '{"a":1}';
    expect(stripMarkdownFences(input)).toBe('{"a":1}');
  });

  it("strips ```json ... ``` fences", () => {
    const input = '```json\n{"a":1}\n```';
    expect(stripMarkdownFences(input)).toBe('{"a":1}');
  });

  it("strips ``` ... ``` fences without language tag", () => {
    const input = '```\n{"a":1}\n```';
    expect(stripMarkdownFences(input)).toBe('{"a":1}');
  });

  it("strips leading prose before first brace", () => {
    const input = 'Here is the schema:\n{"a":1}';
    expect(stripMarkdownFences(input)).toBe('{"a":1}');
  });

  it("strips trailing prose after last brace", () => {
    const input = '{"a":1}\nLet me know if you need adjustments.';
    expect(stripMarkdownFences(input)).toBe('{"a":1}');
  });

  it("strips combined fence + prose preamble + trailing prose", () => {
    const input = 'Sure, here is your schema:\n\n```json\n{"a":1}\n```\n\nHope that helps.';
    const stripped = stripMarkdownFences(input);
    expect(stripped).toBe('{"a":1}');
  });
});

describe("Form Schema paste parser — parseSchemaPaste", () => {
  it("plain JSON parses to object", () => {
    const result = parseSchemaPaste('{"a":1}');
    expect(result.error).toBeNull();
    expect(result.schema).toEqual({ a: 1 });
  });

  it("JSON in markdown fences parses correctly", () => {
    const result = parseSchemaPaste('```json\n{"a":1}\n```');
    expect(result.error).toBeNull();
    expect(result.schema).toEqual({ a: 1 });
  });

  it("JSON with prose around it parses correctly", () => {
    const result = parseSchemaPaste('Here it is:\n{"a":1}\nDone.');
    expect(result.error).toBeNull();
    expect(result.schema).toEqual({ a: 1 });
  });

  it("trailing comma reports parse error", () => {
    const result = parseSchemaPaste('{"a":1,}');
    expect(result.error).not.toBeNull();
    expect(result.schema).toBeNull();
  });

  it("empty input reports error", () => {
    const result = parseSchemaPaste("");
    expect(result.error).toBe("No input provided");
  });

  it("whitespace-only input reports error", () => {
    const result = parseSchemaPaste("   \n  ");
    expect(result.error).toBe("No input provided");
  });

  it("non-JSON reports parse error", () => {
    const result = parseSchemaPaste("this is just prose");
    expect(result.error).not.toBeNull();
  });
});
