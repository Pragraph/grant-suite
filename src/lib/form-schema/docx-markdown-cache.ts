// DOCX → markdown cache. Indexed under `docx_markdown:{projectId}:{filename}` so
// we don't re-run mammoth conversion on every prompt build.

import { get, set, del, keys } from "idb-keyval";

const CACHE_PREFIX = "grant-suite-docx-markdown-";

function cacheKey(projectId: string, filename: string): string {
  return `${CACHE_PREFIX}${projectId}:${filename}`;
}

function projectPrefix(projectId: string): string {
  return `${CACHE_PREFIX}${projectId}:`;
}

export async function getDocxMarkdown(
  projectId: string,
  filename: string,
): Promise<string | null> {
  const value = await get<string>(cacheKey(projectId, filename));
  return value ?? null;
}

export async function setDocxMarkdown(
  projectId: string,
  filename: string,
  markdown: string,
): Promise<void> {
  await set(cacheKey(projectId, filename), markdown);
}

export async function deleteDocxMarkdown(
  projectId: string,
  filename: string,
): Promise<void> {
  await del(cacheKey(projectId, filename));
}

export async function deleteDocxMarkdownCache(projectId: string): Promise<void> {
  const allKeys = await keys();
  const prefix = projectPrefix(projectId);
  for (const k of allKeys) {
    if (typeof k === "string" && k.startsWith(prefix)) {
      await del(k);
    }
  }
}

export async function listCachedDocxMarkdown(
  projectId: string,
): Promise<Array<{ filename: string; markdown: string }>> {
  const allKeys = await keys();
  const prefix = projectPrefix(projectId);
  const out: Array<{ filename: string; markdown: string }> = [];
  for (const k of allKeys) {
    if (typeof k !== "string" || !k.startsWith(prefix)) continue;
    const filename = k.slice(prefix.length);
    const markdown = await get<string>(k);
    if (markdown) out.push({ filename, markdown });
  }
  return out;
}
