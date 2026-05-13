// Per-project output language preference for the external drafting workflow.
// Stored under project.metadata.outputLanguage so it survives across page
// reloads and project edits without requiring a schema migration.

import { storage } from "@/lib/storage";
import {
  DEFAULT_OUTPUT_LANGUAGE,
  isSupportedOutputLanguage,
  type SupportedOutputLanguage,
} from "./prompt";

const METADATA_KEY = "outputLanguage";

export function getProjectOutputLanguage(
  projectId: string,
): SupportedOutputLanguage {
  if (!projectId) return DEFAULT_OUTPUT_LANGUAGE;
  const project = storage.getProject(projectId);
  if (!project) return DEFAULT_OUTPUT_LANGUAGE;
  const stored = project.metadata?.[METADATA_KEY];
  return isSupportedOutputLanguage(stored) ? stored : DEFAULT_OUTPUT_LANGUAGE;
}

export function setProjectOutputLanguage(
  projectId: string,
  language: SupportedOutputLanguage,
): void {
  if (!projectId) return;
  const project = storage.getProject(projectId);
  if (!project) return;
  const nextMetadata = {
    ...(project.metadata ?? {}),
    [METADATA_KEY]: language,
  };
  storage.saveProject({ ...project, metadata: nextMetadata });
}
