// Storage layer for externally-drafted artifacts uploaded back into the
// project (the .docx and optional .md exports produced by the user's LLM
// drafting session). Uses idb-keyval directly under a separate prefix so the
// regular Document store (which is markdown-only) stays clean.

import { get, set, del, keys } from "idb-keyval";
import { nanoid } from "nanoid";

const DRAFT_PREFIX = "grant-suite-completed-draft-";

export type CompletedDraftKind = "docx" | "md";

export interface CompletedDraftMetadata {
  id: string;
  projectId: string;
  filename: string;
  kind: CompletedDraftKind;
  version: number;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface CompletedDraftRecord extends CompletedDraftMetadata {
  blob: Blob;
}

function recordKey(projectId: string, id: string): string {
  return `${DRAFT_PREFIX}${projectId}:${id}`;
}

function projectPrefix(projectId: string): string {
  return `${DRAFT_PREFIX}${projectId}:`;
}

async function loadRecords(projectId: string): Promise<CompletedDraftRecord[]> {
  const allKeys = await keys();
  const prefix = projectPrefix(projectId);
  const records: CompletedDraftRecord[] = [];
  for (const k of allKeys) {
    if (typeof k !== "string" || !k.startsWith(prefix)) continue;
    const value = await get<CompletedDraftRecord>(k);
    if (value) records.push(value);
  }
  return records;
}

function nextVersion(existing: readonly CompletedDraftRecord[], kind: CompletedDraftKind): number {
  const versions = existing.filter((r) => r.kind === kind).map((r) => r.version);
  return versions.length === 0 ? 1 : Math.max(...versions) + 1;
}

function toMetadata(record: CompletedDraftRecord): CompletedDraftMetadata {
  const { blob: _blob, ...meta } = record;
  void _blob;
  return meta;
}

export function deriveKindFromFilename(filename: string): CompletedDraftKind | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "md";
  return null;
}

export async function saveCompletedDraft(
  projectId: string,
  file: File,
  kind: CompletedDraftKind,
  options: { now?: Date; id?: string } = {},
): Promise<CompletedDraftMetadata> {
  const existing = await loadRecords(projectId);
  const version = nextVersion(existing, kind);
  const id = options.id ?? nanoid();
  const uploadedAt = (options.now ?? new Date()).toISOString();
  const record: CompletedDraftRecord = {
    id,
    projectId,
    filename: file.name,
    kind,
    version,
    size: file.size,
    mimeType: file.type || (kind === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "text/markdown"),
    uploadedAt,
    blob: file,
  };
  await set(recordKey(projectId, id), record);
  return toMetadata(record);
}

export async function listCompletedDrafts(projectId: string): Promise<CompletedDraftMetadata[]> {
  const records = await loadRecords(projectId);
  return records
    .map(toMetadata)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
      return b.version - a.version;
    });
}

export async function getCompletedDraftBlob(
  projectId: string,
  id: string,
): Promise<CompletedDraftRecord | null> {
  const value = await get<CompletedDraftRecord>(recordKey(projectId, id));
  return value ?? null;
}

export async function deleteCompletedDraft(projectId: string, id: string): Promise<void> {
  await del(recordKey(projectId, id));
}

export async function clearCompletedDrafts(projectId: string): Promise<void> {
  const allKeys = await keys();
  const prefix = projectPrefix(projectId);
  for (const k of allKeys) {
    if (typeof k === "string" && k.startsWith(prefix)) {
      await del(k);
    }
  }
}
