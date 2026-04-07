import JSZip from "jszip";
import { saveAs } from "file-saver";
import { storage } from "./storage";
import { PHASE_DEFINITIONS } from "./constants";
import type { Document } from "./types";

/**
 * Exports all current documents for a project as a zip file.
 * Structure:
 *   /Phase_1_Discovery_Analysis/Grant_Intelligence.md
 *   /Phase_2_Framework_Design/...
 *   /manifest.json
 */
export async function exportAllDocuments(
  projectId: string,
  projectTitle: string
): Promise<void> {
  const allDocs = await storage.getDocuments(projectId);
  const currentDocs = allDocs.filter((d) => d.isCurrent);

  if (currentDocs.length === 0) {
    throw new Error("No documents to export");
  }

  const zip = new JSZip();

  // Group documents by phase
  const docsByPhase: Record<number, Document[]> = {};
  for (const doc of currentDocs) {
    if (!docsByPhase[doc.phase]) {
      docsByPhase[doc.phase] = [];
    }
    docsByPhase[doc.phase].push(doc);
  }

  // Create phase folders with documents
  for (const phase of PHASE_DEFINITIONS) {
    const phaseDocs = docsByPhase[phase.phase];
    if (!phaseDocs || phaseDocs.length === 0) continue;

    const folderName = `Phase_${phase.phase}_${phase.name.replace(/[^a-zA-Z0-9]+/g, "_")}`;
    const folder = zip.folder(folderName)!;

    for (const doc of phaseDocs) {
      folder.file(doc.canonicalName, doc.content);
    }
  }

  // Create manifest.json
  const manifest = {
    projectTitle,
    exportedAt: new Date().toISOString(),
    generator: "Grant Suite",
    documentCount: currentDocs.length,
    documents: currentDocs.map((doc) => ({
      name: doc.name,
      canonicalName: doc.canonicalName,
      phase: doc.phase,
      step: doc.step,
      version: doc.version,
      wordCount: doc.wordCount,
      createdAt: doc.createdAt,
    })),
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Generate and download
  const blob = await zip.generateAsync({ type: "blob" });
  const filename = `${projectTitle.replace(/\s+/g, "-").toLowerCase()}-documents.zip`;
  saveAs(blob, filename);
}
