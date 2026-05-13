"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  History,
  Loader2,
  PackageOpen,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useDocumentStore } from "@/stores/document-store";
import { PHASE_DEFINITIONS } from "@/lib/constants";
import type { Document } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PhaseIcon } from "@/components/ui/phase-icon";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { DocumentExporter } from "./DocumentExporter";
import { VersionHistory } from "./VersionHistory";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DocumentInventoryProps {
  projectId: string;
  projectTitle?: string;
  /** Full-page mode with more vertical space */
  fullPage?: boolean;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DocumentInventory({
  projectId,
  projectTitle,
  fullPage = false,
  className,
}: DocumentInventoryProps) {
  const { documents, deleteDocumentByCanonicalName } = useDocumentStore();

  const [search, setSearch] = useState("");
  const [collapsedPhases, setCollapsedPhases] = useState<Set<number>>(
    new Set()
  );

  // Document viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Version history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDoc, setHistoryDoc] = useState<Document | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Hover state for action buttons
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);

  const currentDocs = useMemo(
    () => documents.filter((d) => d.isCurrent),
    [documents]
  );

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return currentDocs;
    const q = search.toLowerCase();
    return currentDocs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.canonicalName.toLowerCase().includes(q)
    );
  }, [currentDocs, search]);

  const docsByPhase = useMemo(() => {
    const grouped: Record<number, Document[]> = {};
    for (const phase of PHASE_DEFINITIONS) {
      const phaseDocs = filteredDocs.filter((d) => d.phase === phase.phase);
      if (phaseDocs.length > 0) {
        grouped[phase.phase] = phaseDocs;
      }
    }
    return grouped;
  }, [filteredDocs]);

  const togglePhase = (phaseId: number) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const handleDocClick = (doc: Document) => {
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const handleHistoryClick = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryDoc(doc);
    setHistoryOpen(true);
  };

  const handleDownloadMd = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([doc.content], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.canonicalName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteClick = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(doc);
  };

  const deleteVersionCount = useMemo(() => {
    if (!deleteTarget) return 0;
    return documents.filter(
      (d) =>
        d.projectId === projectId &&
        d.canonicalName === deleteTarget.canonicalName,
    ).length;
  }, [deleteTarget, documents, projectId]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocumentByCanonicalName(projectId, deleteTarget.canonicalName);
      toast.success("Document deleted", {
        description: `${deleteTarget.name} and ${deleteVersionCount} version${
          deleteVersionCount === 1 ? "" : "s"
        } removed.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Could not delete document", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const phasesWithDocs = PHASE_DEFINITIONS.filter((p) => docsByPhase[p.phase]);
  const scrollHeight = fullPage ? "h-[calc(100vh-200px)]" : "max-h-[500px]";

  return (
    <>
      <Card className={cn("bg-white border border-gray-200 rounded-xl", className)}>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
            <FileText className="h-4 w-4 text-gray-400" />
            Documents
            <Badge variant="outline" className="ml-1 bg-gray-100 text-gray-600 rounded-full">
              {currentDocs.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Filter documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs border-gray-200 bg-gray-50 rounded-lg"
            />
          </div>

          {/* Document List */}
          <ScrollArea className={scrollHeight}>
            {currentDocs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <PackageOpen className="h-10 w-10 text-gray-300" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    No documents generated yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start with Phase 1 to generate your first documents.
                  </p>
                </div>
              </div>
            ) : phasesWithDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No documents match &ldquo;{search}&rdquo;
              </p>
            ) : (
              <div className="space-y-3 pr-2">
                {phasesWithDocs.map((phase) => {
                  const phaseDocs = docsByPhase[phase.phase]!;
                  const isCollapsed = collapsedPhases.has(phase.phase);

                  return (
                    <div key={phase.phase}>
                      {/* Phase header */}
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 mb-1.5 group"
                        onClick={() => togglePhase(phase.phase)}
                      >
                        <PhaseIcon
                          phase={phase.phase as 1 | 2 | 3 | 4 | 5 | 6 | 7}
                          size="sm"
                        />
                        <span className="text-xs font-medium text-muted-foreground flex-1 text-left truncate">
                          {phase.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5"
                          style={{
                            borderColor: `var(--phase-${phase.phase})`,
                            color: `var(--phase-${phase.phase})`,
                          }}
                        >
                          {phaseDocs.length}
                        </Badge>
                        {isCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
                        )}
                      </button>

                      {/* Documents */}
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-0.5 ml-1">
                              {phaseDocs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="group/doc flex items-center rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                                  onClick={() => handleDocClick(doc)}
                                  onMouseEnter={() =>
                                    setHoveredDocId(doc.id)
                                  }
                                  onMouseLeave={() =>
                                    setHoveredDocId(null)
                                  }
                                >
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mr-2" />
                                  <span className="text-sm text-gray-900 font-medium truncate flex-1">
                                    {doc.name}
                                  </span>

                                  {/* Hover actions */}
                                  {hoveredDocId === doc.id ? (
                                    <div className="flex items-center gap-0.5 shrink-0 ml-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) =>
                                          handleDownloadMd(doc, e)
                                        }
                                        title="Download"
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) =>
                                          handleHistoryClick(doc, e)
                                        }
                                        title="History"
                                      >
                                        <History className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={(e) =>
                                          handleDeleteClick(doc, e)
                                        }
                                        title="Delete"
                                        aria-label={`Delete ${doc.name}`}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4 px-1"
                                      >
                                        v{doc.version}
                                      </Badge>
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {doc.wordCount.toLocaleString()}w
                                      </span>
                                      <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap hidden sm:inline">
                                        {formatDistanceToNow(
                                          new Date(doc.createdAt),
                                          { addSuffix: true }
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {selectedDoc?.name}
                  {selectedDoc && (
                    <Badge variant="outline">v{selectedDoc.version}</Badge>
                  )}
                </DialogTitle>
                {selectedDoc && (
                  <DialogDescription>
                    {selectedDoc.wordCount.toLocaleString()} words &middot;{" "}
                    {formatDistanceToNow(new Date(selectedDoc.createdAt), {
                      addSuffix: true,
                    })}
                  </DialogDescription>
                )}
              </div>
              {selectedDoc && (
                <DocumentExporter
                  content={selectedDoc.content}
                  filename={selectedDoc.canonicalName}
                  projectTitle={projectTitle}
                />
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div className="px-1">
              {selectedDoc && (
                <MarkdownRenderer content={selectedDoc.content} />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      {historyDoc && (
        <VersionHistory
          projectId={projectId}
          canonicalName={historyDoc.canonicalName}
          documentName={historyDoc.name}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base">
                  Delete this document?
                </DialogTitle>
                <DialogDescription className="text-sm">
                  This permanently removes{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.name}
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-foreground">
                    all {deleteVersionCount} stored version
                    {deleteVersionCount === 1 ? "" : "s"}
                  </span>{" "}
                  from this project.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-1.5">
            <p className="font-medium">This action cannot be undone.</p>
            <p>
              Any phase steps that consumed this document will need to be
              re-run or have a new version uploaded. Other documents in this
              project are not affected.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Delete document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
