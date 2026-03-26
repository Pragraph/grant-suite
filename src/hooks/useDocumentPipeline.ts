"use client";

import { useMemo, useCallback } from "react";
import { useDocumentStore } from "@/stores/document-store";
import { documentPipeline } from "@/lib/document-pipeline";
import type {
  Document,
  DocumentNode,
  ReadinessResult,
  RequiredDocument,
} from "@/lib/types";

/**
 * Hook wrapping DocumentPipeline that auto-refreshes when documents change.
 * Subscribes to the Zustand document store so consumers re-render on updates.
 */
export function useDocumentPipeline(projectId: string) {
  // Subscribe to the store so we re-render when documents change
  const documents = useDocumentStore((s: { documents: Document[] }) => s.documents);

  const getRequiredDocuments = useCallback(
    (phase: number, step: number): RequiredDocument[] => {
      return documentPipeline.getRequiredDocuments(projectId, phase, step);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, documents]
  );

  const validateReadiness = useCallback(
    (phase: number, step: number): ReadinessResult => {
      return documentPipeline.validateReadiness(projectId, phase, step);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, documents]
  );

  const getAvailableDocuments = useCallback((): Document[] => {
    return documentPipeline.getAvailableDocuments(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, documents]);

  const markDownstreamStale = useCallback(
    (canonicalName: string): string[] => {
      return documentPipeline.markDownstreamStale(projectId, canonicalName);
    },
    [projectId]
  );

  const getDocumentGraph = useCallback(
    (staleDocs?: Set<string>): DocumentNode[] => {
      return documentPipeline.getDocumentGraph(projectId, staleDocs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, documents]
  );

  const availableCount = useMemo(
    () => documents.filter((d: Document) => d.isCurrent).length,
    [documents]
  );

  return {
    getRequiredDocuments,
    validateReadiness,
    getAvailableDocuments,
    markDownstreamStale,
    getDocumentGraph,
    availableCount,
  };
}
