// Form Schema validator — wraps Ajv 8.x configured against the meta-schema.
// Parser inventory: form-schema validator. See src/lib/form-schema/parsers.md.

import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import metaSchema from "./meta-schema.json";
import type { FormSchema } from "./types";

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
  params: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateFn: ValidateFunction = ajv.compile(metaSchema);

export function validateFormSchema(candidate: unknown): ValidationResult {
  const valid = validateFn(candidate);
  if (valid) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: (validateFn.errors ?? []).map((e: ErrorObject) => ({
      path: e.instancePath,
      message: e.message ?? "Unknown validation error",
      keyword: e.keyword,
      params: e.params as Record<string, unknown>,
    })),
  };
}

export function isFormSchema(candidate: unknown): candidate is FormSchema {
  return validateFormSchema(candidate).valid;
}
