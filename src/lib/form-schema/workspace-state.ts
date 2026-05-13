// Phase 5-0 workspace state — separate IndexedDB document tracking multi-pass
// extraction progress. Lives alongside the Form_Schema but is not part of it
// (per phase5-rebuild-03-multipass-architecture.md "Schema partial-state semantics").

import { get, set, del } from "idb-keyval";
import type {
  ExtractionStatus,
  FormSchema,
  Phase50WorkspaceState,
  SectionStatus,
} from "./types";

const WORKSPACE_PREFIX = "grant-suite-phase5-workspace-";

function workspaceKey(projectId: string): string {
  return `${WORKSPACE_PREFIX}${projectId}`;
}

export async function loadWorkspaceState(
  projectId: string,
): Promise<Phase50WorkspaceState | null> {
  const value = await get<Phase50WorkspaceState>(workspaceKey(projectId));
  return value ?? null;
}

export async function saveWorkspaceState(
  projectId: string,
  state: Phase50WorkspaceState,
): Promise<void> {
  await set(workspaceKey(projectId), state);
}

export async function deleteWorkspaceState(projectId: string): Promise<void> {
  await del(workspaceKey(projectId));
}

// Initialize a workspace state from a freshly-validated Pass 1 skeleton.
// Every section starts as "not-extracted" so the user can decide per section.
export function initialWorkspaceState(
  projectId: string,
  schema: FormSchema,
): Phase50WorkspaceState {
  const sectionStatuses: Record<string, SectionStatus> = {};
  forEachSectionId(schema, (id) => {
    sectionStatuses[id] = "not-extracted";
  });
  return {
    projectId,
    extractionStatus: "skeleton-only",
    sectionStatuses,
    lastUpdatedAt: new Date().toISOString(),
  };
}

// Derive the overall extraction_status from per-section statuses and Pass 3 output.
export function computeExtractionStatus(
  schema: FormSchema | null,
  sectionStatuses: Record<string, SectionStatus>,
  hasPass3Output: boolean,
): ExtractionStatus {
  if (!schema) return "no-schema";

  const statuses = Object.values(sectionStatuses);
  if (statuses.length === 0) return "skeleton-only";

  const isComplete = (status: SectionStatus): boolean =>
    status === "extracted" || status === "manual" || status === "skipped";
  const isTouched = (status: SectionStatus): boolean => status !== "not-extracted";

  const allComplete = statuses.every(isComplete);
  const someTouched = statuses.some(isTouched);

  if (!someTouched) return "skeleton-only";
  if (!allComplete) return "partial";
  if (hasPass3Output) return "relationships-extracted";
  return "fields-complete";
}

// Update a single section's status, recompute the overall extraction status,
// and persist the change. Returns the next state.
export async function updateSectionStatus(
  projectId: string,
  schema: FormSchema | null,
  state: Phase50WorkspaceState,
  sectionId: string,
  status: SectionStatus,
  hasPass3Output: boolean,
): Promise<Phase50WorkspaceState> {
  const sectionStatuses = { ...state.sectionStatuses, [sectionId]: status };
  const extractionStatus = computeExtractionStatus(
    schema,
    sectionStatuses,
    hasPass3Output,
  );
  const next: Phase50WorkspaceState = {
    ...state,
    sectionStatuses,
    extractionStatus,
    lastUpdatedAt: new Date().toISOString(),
  };
  await saveWorkspaceState(projectId, next);
  return next;
}

// Reconcile workspace state with the current schema: drop section IDs not in
// the schema, add new ones with status "not-extracted". Useful after Pass 1
// re-runs or manual edits.
export function reconcileWithSchema(
  state: Phase50WorkspaceState,
  schema: FormSchema,
): Phase50WorkspaceState {
  const presentIds = new Set<string>();
  forEachSectionId(schema, (id) => presentIds.add(id));

  const sectionStatuses: Record<string, SectionStatus> = {};
  for (const id of presentIds) {
    sectionStatuses[id] = state.sectionStatuses[id] ?? "not-extracted";
  }

  return {
    ...state,
    sectionStatuses,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function forEachSectionId(
  schema: FormSchema,
  visit: (id: string) => void,
): void {
  function walk(sections: FormSchema["sections"]): void {
    for (const s of sections) {
      visit(s.section_id);
      if (s.subsections?.length) walk(s.subsections);
    }
  }
  walk(schema.sections);
}
