import { describe, it, expect } from "vitest";
import getFixture from "./fixtures/form-schema-get.json";
import horizonFixture from "./fixtures/form-schema-horizon-msca.json";
import { computeOverallConfidence } from "@/lib/form-schema";
import type { FormSchema } from "@/lib/form-schema";

describe("computeOverallConfidence", () => {
  it("returns a confidence value for the GET fixture", () => {
    const result = computeOverallConfidence(getFixture as unknown as FormSchema);
    expect(result).toBeTruthy();
  });

  it("returns medium-or-lower for the web-reconstructed Horizon fixture", () => {
    const result = computeOverallConfidence(horizonFixture as unknown as FormSchema);
    expect(result === null || result === "medium" || result === "low").toBe(true);
  });

  it("returns low when any field is low", () => {
    const schema: FormSchema = {
      schema_version: "1.0",
      form_metadata: {
        form_id: "test",
        form_title: { en: "Test" },
        funder: { name: "F", country: "X" },
        primary_language: "en",
        supported_languages: ["en"],
        source: { type: "manual", extraction_date: "2026-05-13" },
      },
      sections: [
        {
          section_id: "A",
          label: { en: "A" },
          level: 1,
          fields: [
            {
              field_id: "f1",
              label: { en: "f1" },
              type: "text",
              extraction_confidence: "high",
            },
            {
              field_id: "f2",
              label: { en: "f2" },
              type: "text",
              extraction_confidence: "low",
            },
          ],
        },
      ],
    };
    expect(computeOverallConfidence(schema)).toBe("low");
  });

  it("returns high only when every field is high", () => {
    const schema: FormSchema = {
      schema_version: "1.0",
      form_metadata: {
        form_id: "test",
        form_title: { en: "Test" },
        funder: { name: "F", country: "X" },
        primary_language: "en",
        supported_languages: ["en"],
        source: { type: "manual", extraction_date: "2026-05-13" },
      },
      sections: [
        {
          section_id: "A",
          label: { en: "A" },
          level: 1,
          fields: [
            {
              field_id: "f1",
              label: { en: "f1" },
              type: "text",
              extraction_confidence: "high",
            },
            {
              field_id: "f2",
              label: { en: "f2" },
              type: "text",
              extraction_confidence: "high",
            },
          ],
        },
      ],
    };
    expect(computeOverallConfidence(schema)).toBe("high");
  });

  it("walks subsections recursively", () => {
    const schema: FormSchema = {
      schema_version: "1.0",
      form_metadata: {
        form_id: "test",
        form_title: { en: "Test" },
        funder: { name: "F", country: "X" },
        primary_language: "en",
        supported_languages: ["en"],
        source: { type: "manual", extraction_date: "2026-05-13" },
      },
      sections: [
        {
          section_id: "A",
          label: { en: "A" },
          level: 1,
          subsections: [
            {
              section_id: "A1",
              label: { en: "A1" },
              level: 2,
              fields: [
                {
                  field_id: "f1",
                  label: { en: "f1" },
                  type: "text",
                  extraction_confidence: "medium",
                },
              ],
            },
          ],
        },
      ],
    };
    expect(computeOverallConfidence(schema)).toBe("medium");
  });
});
