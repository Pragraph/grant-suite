"use client";

import { useMemo, useCallback } from "react";
import { promptEngine, type CompileContext, type CompileResult } from "@/lib/prompt-engine";
import type { PromptTemplate } from "@/prompts/types";

export function usePromptEngine() {
  const compile = useCallback(
    (templateId: string, context: CompileContext): CompileResult => {
      return promptEngine.compile(templateId, context);
    },
    [],
  );

  const getTemplate = useCallback(
    (id: string): PromptTemplate => {
      return promptEngine.getTemplate(id);
    },
    [],
  );

  const listTemplates = useCallback(
    (phase?: number): PromptTemplate[] => {
      return promptEngine.listTemplates(phase);
    },
    [],
  );

  return useMemo(
    () => ({ compile, getTemplate, listTemplates }),
    [compile, getTemplate, listTemplates],
  );
}
