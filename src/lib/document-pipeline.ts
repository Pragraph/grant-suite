import { DOCUMENT_DEPENDENCIES } from "./constants";
import { useDocumentStore } from "@/stores/document-store";
import type {
  Document,
  DocumentNode,
  ReadinessResult,
  RequiredDocument,
} from "./types";

// ─── Document Pipeline ──────────────────────────────────────────────────────
// Manages document flow between phases. Reads from the Zustand document store
// — no server calls. All dependency logic is driven by DOCUMENT_DEPENDENCIES.

class DocumentPipeline {
  /**
   * Returns the list of documents needed for a given phase/step,
   * with their required/present status.
   */
  getRequiredDocuments(
    _projectId: string,
    phase: number,
    step: number
  ): RequiredDocument[] {
    const entry = DOCUMENT_DEPENDENCIES.find(
      (d) => d.phase === phase && d.step === step
    );
    if (!entry) return [];

    const currentDocs = this.getCurrentDocumentNames();

    const results: RequiredDocument[] = [];

    for (const req of entry.requires) {
      results.push({
        canonicalName: req,
        required: true,
        present: currentDocs.has(req),
      });
    }

    for (const opt of entry.optional) {
      results.push({
        canonicalName: opt,
        required: false,
        present: currentDocs.has(opt),
      });
    }

    return results;
  }

  /**
   * Checks whether all required documents for a step are present.
   */
  validateReadiness(
    _projectId: string,
    phase: number,
    step: number
  ): ReadinessResult {
    const entry = DOCUMENT_DEPENDENCIES.find(
      (d) => d.phase === phase && d.step === step
    );
    if (!entry) return { ready: true, missing: [], optionalMissing: [] };

    const currentDocs = this.getCurrentDocumentNames();

    const missing = entry.requires.filter((r) => !currentDocs.has(r));
    const optionalMissing = entry.optional.filter((o) => !currentDocs.has(o));

    return {
      ready: missing.length === 0,
      missing,
      optionalMissing,
    };
  }

  /**
   * Returns all current documents for a project from the store.
   */
  getAvailableDocuments(_projectId: string): Document[] {
    const { documents } = useDocumentStore.getState();
    return documents.filter((d: Document) => d.isCurrent);
  }

  /**
   * When a document is re-saved, determines which downstream documents
   * depend on it (directly or transitively) and should be flagged stale.
   * Returns the list of downstream canonical names.
   */
  markDownstreamStale(
    _projectId: string,
    canonicalName: string
  ): string[] {
    const stale: string[] = [];
    const queue = [canonicalName];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const entry of DOCUMENT_DEPENDENCIES) {
        if (
          entry.requires.includes(current) ||
          entry.optional.includes(current)
        ) {
          if (!stale.includes(entry.produces)) {
            stale.push(entry.produces);
            queue.push(entry.produces);
          }
        }
      }
    }

    return stale;
  }

  /**
   * Returns the full dependency graph with presence/staleness status,
   * suitable for visualization.
   */
  getDocumentGraph(
    _projectId: string,
    staleDocs: Set<string> = new Set()
  ): DocumentNode[] {
    const currentDocs = this.getCurrentDocumentNames();

    return DOCUMENT_DEPENDENCIES.map((entry) => ({
      name: entry.produces,
      phase: entry.phase,
      present: currentDocs.has(entry.produces),
      stale: staleDocs.has(entry.produces),
      dependsOn: [...entry.requires, ...entry.optional],
    }));
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private getCurrentDocumentNames(): Set<string> {
    const { documents } = useDocumentStore.getState();
    return new Set(
      documents.filter((d: Document) => d.isCurrent).map((d: Document) => d.canonicalName)
    );
  }
}

export const documentPipeline = new DocumentPipeline();
