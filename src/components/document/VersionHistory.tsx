"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Eye,
  RotateCcw,
  ArrowLeftRight,
  X,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { storage } from "@/lib/storage";
import { useDocumentStore } from "@/stores/document-store";
import type { Document } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "./MarkdownRenderer";

// ─── Types ──────────────────────────────────────────────────────────────────

interface VersionHistoryProps {
  projectId: string;
  canonicalName: string;
  documentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Diff Component ─────────────────────────────────────────────────────────

function SimpleDiff({
  older,
  newer,
  olderVersion,
  newerVersion,
}: {
  older: string;
  newer: string;
  olderVersion: number;
  newerVersion: number;
}) {
  const olderLines = older.split("\n");
  const newerLines = newer.split("\n");

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          v{olderVersion} (older)
        </p>
        <ScrollArea className="h-[50vh] rounded-lg border border-border/50 bg-muted/30 p-3">
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {olderLines.map((line, i) => {
              const inNewer = newerLines.includes(line);
              return (
                <div
                  key={i}
                  className={
                    !inNewer && line.trim()
                      ? "bg-error/10 text-error -mx-3 px-3"
                      : "text-muted-foreground"
                  }
                >
                  {line || "\u00A0"}
                </div>
              );
            })}
          </pre>
        </ScrollArea>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          v{newerVersion} (newer)
        </p>
        <ScrollArea className="h-[50vh] rounded-lg border border-border/50 bg-muted/30 p-3">
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {newerLines.map((line, i) => {
              const inOlder = olderLines.includes(line);
              return (
                <div
                  key={i}
                  className={
                    !inOlder && line.trim()
                      ? "bg-success/10 text-success -mx-3 px-3"
                      : "text-muted-foreground"
                  }
                >
                  {line || "\u00A0"}
                </div>
              );
            })}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function VersionHistory({
  projectId,
  canonicalName,
  documentName,
  open,
  onOpenChange,
}: VersionHistoryProps) {
  const { saveDocument, loadDocuments } = useDocumentStore();

  const [versions, setVersions] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Viewer state
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  // Diff state
  const [diffMode, setDiffMode] = useState(false);
  const [diffSelection, setDiffSelection] = useState<[Document | null, Document | null]>([
    null,
    null,
  ]);

  // Restore state
  const [restoreConfirm, setRestoreConfirm] = useState<Document | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    const history = await storage.getDocumentHistory(projectId, canonicalName);
    setVersions(history);
    setLoading(false);
  }, [projectId, canonicalName]);

  // Reset UI state when dialog opens (derived from open prop change)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setViewingDoc(null);
    setDiffMode(false);
    setDiffSelection([null, null]);
    setRestoreConfirm(null);
    setLoading(true);
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    storage.getDocumentHistory(projectId, canonicalName).then((history) => {
      if (!controller.signal.aborted) {
        setVersions(history);
        setLoading(false);
      }
    });
    return () => controller.abort();
  }, [open, projectId, canonicalName]);

  const handleRestore = async (doc: Document) => {
    const currentVersion = versions[0];
    if (!currentVersion) return;

    const newDoc: Document = {
      ...doc,
      id: storage.createId(),
      version: currentVersion.version + 1,
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };

    // Mark old current as not current
    if (currentVersion.isCurrent) {
      await storage.saveDocument(projectId, {
        ...currentVersion,
        isCurrent: false,
      });
    }

    await saveDocument(projectId, newDoc);
    await loadDocuments(projectId);
    await loadVersions();
    setRestoreConfirm(null);
  };

  const handleDiffSelect = (doc: Document) => {
    if (!diffSelection[0]) {
      setDiffSelection([doc, null]);
    } else if (!diffSelection[1] && diffSelection[0].id !== doc.id) {
      // Ensure older is first
      const pair =
        diffSelection[0].version < doc.version
          ? [diffSelection[0], doc]
          : [doc, diffSelection[0]];
      setDiffSelection(pair as [Document, Document]);
    } else {
      // Reset and start new selection
      setDiffSelection([doc, null]);
    }
  };

  // If viewing a specific version
  if (viewingDoc) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewingDoc(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              {documentName}
              <Badge variant="outline">v{viewingDoc.version}</Badge>
            </DialogTitle>
            <DialogDescription>
              {viewingDoc.wordCount.toLocaleString()} words &middot;{" "}
              {formatDistanceToNow(new Date(viewingDoc.createdAt), {
                addSuffix: true,
              })}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div className="px-1">
              <MarkdownRenderer content={viewingDoc.content} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // If comparing two versions
  if (diffMode && diffSelection[0] && diffSelection[1]) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setDiffSelection([null, null]);
                  setDiffMode(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              Compare Versions
            </DialogTitle>
            <DialogDescription>
              Comparing v{diffSelection[0].version} with v
              {diffSelection[1].version}
            </DialogDescription>
          </DialogHeader>
          <SimpleDiff
            older={diffSelection[0].content}
            newer={diffSelection[1].content}
            olderVersion={diffSelection[0].version}
            newerVersion={diffSelection[1].version}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Main version list
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Version History
          </DialogTitle>
          <DialogDescription>
            {documentName} &middot; {versions.length} version
            {versions.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Diff mode toggle */}
        {versions.length >= 2 && (
          <div className="flex items-center gap-2">
            <Button
              variant={diffMode ? "default" : "secondary"}
              size="sm"
              onClick={() => {
                setDiffMode(!diffMode);
                setDiffSelection([null, null]);
              }}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              {diffMode ? "Cancel Compare" : "Compare Versions"}
            </Button>
            {diffMode && (
              <span className="text-xs text-muted-foreground">
                {!diffSelection[0]
                  ? "Select first version"
                  : "Select second version"}
              </span>
            )}
          </div>
        )}

        <ScrollArea className="max-h-[55vh]">
          <div className="space-y-1 pr-2">
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Loading versions...
              </p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No version history found.
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {versions.map((ver, idx) => {
                  const isSelected =
                    diffMode &&
                    (diffSelection[0]?.id === ver.id ||
                      diffSelection[1]?.id === ver.id);

                  return (
                    <motion.div
                      key={ver.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                        isSelected
                          ? "bg-accent-500/10 border border-accent-500/30"
                          : "hover:bg-muted/50"
                      } ${diffMode ? "cursor-pointer" : ""}`}
                      onClick={diffMode ? () => handleDiffSelect(ver) : undefined}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={ver.isCurrent ? "success" : "outline"}
                            className="text-[10px]"
                          >
                            v{ver.version}
                          </Badge>
                          {ver.isCurrent && (
                            <span className="text-[10px] text-success font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            {ver.wordCount.toLocaleString()} words
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(ver.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>

                      {!diffMode && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewingDoc(ver)}
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {!ver.isCurrent && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setRestoreConfirm(ver)}
                              title="Restore"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {/* Restore confirmation */}
        <AnimatePresence>
          {restoreConfirm && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3"
            >
              <p className="flex-1 text-sm text-foreground">
                This will create a new version with the content from v
                {restoreConfirm.version}.
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRestoreConfirm(null)}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRestore(restoreConfirm)}
                >
                  <Check className="h-3.5 w-3.5" />
                  Restore
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
