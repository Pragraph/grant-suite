"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  History,
  PackageOpen,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useDocumentStore } from "@/stores/document-store";
import { PHASES } from "@/lib/types";
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
  const { documents } = useDocumentStore();

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
    for (const phase of PHASES) {
      const phaseDocs = filteredDocs.filter((d) => d.phase === phase.id);
      if (phaseDocs.length > 0) {
        grouped[phase.id] = phaseDocs;
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

  const phasesWithDocs = PHASES.filter((p) => docsByPhase[p.id]);
  const scrollHeight = fullPage ? "h-[calc(100vh-200px)]" : "max-h-[500px]";

  return (
    <>
      <Card className={className}>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Documents
            <Badge variant="outline" className="ml-1">
              {currentDocs.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Document List */}
          <ScrollArea className={scrollHeight}>
            {currentDocs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <PackageOpen className="h-10 w-10 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No documents generated yet
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
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
                  const phaseDocs = docsByPhase[phase.id]!;
                  const isCollapsed = collapsedPhases.has(phase.id);

                  return (
                    <div key={phase.id}>
                      {/* Phase header */}
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 mb-1.5 group"
                        onClick={() => togglePhase(phase.id)}
                      >
                        <PhaseIcon
                          phase={phase.id as 1 | 2 | 3 | 4 | 5 | 6 | 7}
                          size="sm"
                        />
                        <span className="text-xs font-medium text-muted-foreground flex-1 text-left truncate">
                          {phase.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5"
                          style={{
                            borderColor: `var(--phase-${phase.id})`,
                            color: `var(--phase-${phase.id})`,
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
                                  className="group/doc flex items-center rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
                                  onClick={() => handleDocClick(doc)}
                                  onMouseEnter={() =>
                                    setHoveredDocId(doc.id)
                                  }
                                  onMouseLeave={() =>
                                    setHoveredDocId(null)
                                  }
                                >
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mr-2" />
                                  <span className="text-sm text-foreground truncate flex-1">
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
    </>
  );
}
