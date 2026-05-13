import type { FormSchema } from "@/lib/form-schema";

// Minimal Pass 1 skeleton output — three sections, empty fields.
// Used by merge logic tests to verify Pass 2/Pass 3 behavior.
export const SKELETON_THREE_SECTION: FormSchema = {
  schema_version: "1.0",
  form_metadata: {
    form_id: "test-form",
    form_title: { en: "Test Grant Application" },
    funder: { name: "Test Funder", country: "MY", scheme: "TEST", year: 2026 },
    primary_language: "en",
    supported_languages: ["en"],
    submission_portal: null,
    submission_portal_url: null,
    budget_ceiling: null,
    source: {
      type: "uploaded",
      extracted_from: "test-form.pdf",
      extraction_date: "2026-05-13",
      extraction_method: "llm-tier1-pass1",
      extraction_confidence: "medium",
      reviewed_by_user: false,
      reviewed_at: null,
      page_audit_trail: [
        { section_id: "A", source_page: 1 },
        { section_id: "B", source_page: 3 },
        { section_id: "C", source_page: 5 },
      ],
    },
  },
  sections: [
    {
      section_id: "A",
      label: { en: "Applicant Details" },
      level: 1,
      ordering: 1,
      required: true,
      visibility: { type: "always-visible" },
      fields: [],
    },
    {
      section_id: "B",
      label: { en: "Project Details" },
      level: 1,
      ordering: 2,
      required: true,
      visibility: { type: "always-visible" },
      fields: [],
    },
    {
      section_id: "C",
      label: { en: "Budget" },
      level: 1,
      ordering: 3,
      required: true,
      visibility: { type: "always-visible" },
      fields: [],
    },
  ],
  cross_field_rules: [],
  validation_artifacts: [],
};
