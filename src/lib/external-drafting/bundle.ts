// Generates a downloadable ZIP of all relevant project markdown for an external
// drafting session. Includes phase 1-5 documents plus a README summarizing the
// bundle so the LLM can orient quickly when the user uploads it.

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { storage } from "@/lib/storage";
import { PHASE_DEFINITIONS } from "@/lib/constants";
import type { Document, Project } from "@/lib/types";

const BUNDLED_PHASES = [1, 2, 3, 4, 5] as const;

interface BundleSummary {
  filename: string;
  documentCount: number;
  phases: number[];
}

function slugify(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "project";
}

function isoDateStamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function phaseFolderName(phase: number): string {
  const def = PHASE_DEFINITIONS.find((p) => p.phase === phase);
  const safeName = def ? def.name.replace(/[^a-zA-Z0-9]+/g, "_") : `Phase_${phase}`;
  return `Phase_${phase}_${safeName}`;
}

export function buildBundleReadme(
  project: Project | null,
  docsByPhase: Record<number, Document[]>,
  generatedAt: Date,
): string {
  const lines: string[] = [];
  lines.push(`# Grant Suite Project Bundle`);
  lines.push("");
  lines.push(`Generated: ${generatedAt.toISOString()}`);
  lines.push("");
  if (project) {
    lines.push(`## Project metadata`);
    lines.push("");
    lines.push(`- Title: ${project.title}`);
    if (project.discipline) lines.push(`- Discipline: ${project.discipline}`);
    if (project.country) lines.push(`- Country: ${project.country}`);
    if (project.careerStage) lines.push(`- Career stage: ${project.careerStage}`);
    if (project.grantScheme) lines.push(`- Grant scheme: ${project.grantScheme}`);
    if (project.targetFunder) lines.push(`- Target funder: ${project.targetFunder}`);
    if (project.currency) lines.push(`- Currency: ${project.currency}`);
    if (project.budgetRange) lines.push(`- Budget range: ${project.budgetRange}`);
    lines.push("");
  }
  lines.push(`## Contents`);
  lines.push("");
  const sortedPhases = BUNDLED_PHASES.filter((p) => (docsByPhase[p] ?? []).length > 0);
  if (sortedPhases.length === 0) {
    lines.push(`- No documents bundled. Complete some upstream phases first.`);
  } else {
    for (const phase of sortedPhases) {
      const def = PHASE_DEFINITIONS.find((p) => p.phase === phase);
      const heading = def ? `Phase ${phase} — ${def.name}` : `Phase ${phase}`;
      lines.push(`### ${heading}`);
      lines.push("");
      for (const doc of docsByPhase[phase]) {
        const wc = doc.wordCount ? ` (${doc.wordCount.toLocaleString()} words)` : "";
        lines.push(`- ${doc.canonicalName}${wc}`);
      }
      lines.push("");
    }
  }
  lines.push(`## How to use`);
  lines.push("");
  lines.push(
    `Upload this bundle to a frontier LLM (ChatGPT 5.5 Thinking or Claude Opus 4.7) ` +
      `together with the grant application form file. Paste the Grant Suite external ` +
      `drafting prompt and follow the section-by-section workflow.`,
  );
  lines.push("");
  return lines.join("\n");
}

export function groupDocumentsByPhase(
  documents: readonly Document[],
): Record<number, Document[]> {
  const out: Record<number, Document[]> = {};
  for (const doc of documents) {
    if (!doc.isCurrent) continue;
    if (!BUNDLED_PHASES.includes(doc.phase as (typeof BUNDLED_PHASES)[number])) continue;
    const list = out[doc.phase] ?? [];
    out[doc.phase] = [...list, doc];
  }
  for (const phase of Object.keys(out)) {
    out[Number(phase)] = [...out[Number(phase)]].sort((a, b) =>
      a.canonicalName.localeCompare(b.canonicalName),
    );
  }
  return out;
}

export async function buildBundleZip(
  project: Project | null,
  documents: readonly Document[],
  now: Date = new Date(),
): Promise<{ blob: Blob; summary: BundleSummary }> {
  const zip = new JSZip();
  const docsByPhase = groupDocumentsByPhase(documents);
  const includedPhases: number[] = [];
  let docCount = 0;

  for (const phase of BUNDLED_PHASES) {
    const docs = docsByPhase[phase] ?? [];
    if (docs.length === 0) continue;
    includedPhases.push(phase);
    const folder = zip.folder(phaseFolderName(phase));
    if (!folder) continue;
    for (const doc of docs) {
      folder.file(doc.canonicalName, doc.content);
      docCount += 1;
    }
  }

  const readme = buildBundleReadme(project, docsByPhase, now);
  zip.file("README.md", readme);

  const titleSlug = project ? slugify(project.title) : "project";
  const filename = `${titleSlug}_bundle_${isoDateStamp(now)}.zip`;
  const blob = await zip.generateAsync({ type: "blob" });

  return {
    blob,
    summary: {
      filename,
      documentCount: docCount,
      phases: includedPhases,
    },
  };
}

export async function downloadProjectBundle(
  projectId: string,
  options: { now?: Date } = {},
): Promise<BundleSummary> {
  const docs = await storage.getDocuments(projectId);
  const project = storage.getProject(projectId);
  const { blob, summary } = await buildBundleZip(project, docs, options.now ?? new Date());
  saveAs(blob, summary.filename);
  return summary;
}

export type { BundleSummary };
