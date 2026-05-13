// IndexedDB persistence for FormSchema + uploaded form files.
// Reuses the idb-keyval store shared with src/lib/storage.ts.

import { get, set, del, keys } from "idb-keyval";
import type { FormSchema } from "./types";

const SCHEMA_PREFIX = "grant-suite-form-schema-";
const FILE_PREFIX = "grant-suite-form-file-";

function schemaKey(projectId: string): string {
  return `${SCHEMA_PREFIX}${projectId}`;
}

function fileKey(projectId: string, filename: string): string {
  return `${FILE_PREFIX}${projectId}:${filename}`;
}

function filePrefix(projectId: string): string {
  return `${FILE_PREFIX}${projectId}:`;
}

export interface StoredFormFile {
  projectId: string;
  filename: string;
  mimeType: string;
  size: number;
  blob: Blob;
  uploadedAt: string;
}

export async function saveFormSchema(projectId: string, schema: FormSchema): Promise<void> {
  await set(schemaKey(projectId), schema);
}

export async function loadFormSchema(projectId: string): Promise<FormSchema | null> {
  const value = await get<FormSchema>(schemaKey(projectId));
  return value ?? null;
}

export async function deleteFormSchema(projectId: string): Promise<void> {
  await del(schemaKey(projectId));
}

export async function hasFormSchema(projectId: string): Promise<boolean> {
  const value = await get<FormSchema>(schemaKey(projectId));
  return value !== undefined && value !== null;
}

export async function saveFormFile(projectId: string, file: File): Promise<void> {
  const stored: StoredFormFile = {
    projectId,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    blob: file,
    uploadedAt: new Date().toISOString(),
  };
  await set(fileKey(projectId, file.name), stored);
}

export async function loadFormFiles(projectId: string): Promise<StoredFormFile[]> {
  const allKeys = await keys();
  const prefix = filePrefix(projectId);
  const files: StoredFormFile[] = [];
  for (const k of allKeys) {
    if (typeof k !== "string" || !k.startsWith(prefix)) continue;
    const stored = await get<StoredFormFile>(k);
    if (stored) files.push(stored);
  }
  return files.sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
}

export async function deleteFormFile(projectId: string, filename: string): Promise<void> {
  await del(fileKey(projectId, filename));
}

export async function deleteAllFormFiles(projectId: string): Promise<void> {
  const allKeys = await keys();
  const prefix = filePrefix(projectId);
  for (const k of allKeys) {
    if (typeof k === "string" && k.startsWith(prefix)) {
      await del(k);
    }
  }
}
