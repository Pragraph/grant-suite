"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Lock,
  ChevronDown,
  ChevronRight,
  FileText,
  Play,
  CheckCircle2,
} from "lucide-react";

import { useProjectStore } from "@/stores/project-store";
import { useDocumentStore } from "@/stores/document-store";
import { useProgressStore } from "@/stores/progress-store";
import { useUiStore } from "@/stores/ui-store";
import { storage } from "@/lib/storage";
import { PHASES } from "@/lib/types";
import type { StepStatus } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const statusBadgeVariant = {
  active: "success" as const,
  completed: "default" as const,
  archived: "outline" as const,
};

const stepStatusLabels: Record<StepStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "prompt-copied": "Prompt Copied",
  "output-pasted": "Output Pasted",
  complete: "Complete",
};

const stepStatusColors: Record<StepStatus, string> = {
  "not-started": "text-muted-foreground",
  "in-progress": "text-warning",
  "prompt-copied": "text-info",
  "output-pasted": "text-accent-400",
  complete: "text-success",
};

export function ProjectDetailClient({ id }: { id: string }) {
  const { setActiveProject, activeProject, updateProject } = useProjectStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { progress, loadProgress, getPhaseCompletion, canAccessPhase } =
    useProgressStore();
  const { setBreadcrumbs } = useUiStore();

  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [expandedPhaseInitialized, setExpandedPhaseInitialized] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [docInventoryOpen, setDocInventoryOpen] = useState(true);
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{
    name: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    setActiveProject(id);
    loadProgress(id);
    loadDocuments(id);
  }, [id, setActiveProject, loadProgress, loadDocuments]);

  useEffect(() => {
    if (activeProject) {
      setBreadcrumbs([
        { label: "Projects", href: "/projects" },
        { label: activeProject.title },
      ]);
    }
  }, [activeProject, setBreadcrumbs]);

  // Sync title and expanded phase from project data on initial load
  if (activeProject && !editingTitle && titleValue !== activeProject.title) {
    setTitleValue(activeProject.title);
  }
  if (activeProject && !expandedPhaseInitialized) {
    setExpandedPhase(activeProject.currentPhase);
    setExpandedPhaseInitialized(true);
  }

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading project...
      </div>
    );
  }

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      updateProject(id, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const handleExport = async () => {
    const docs = await storage.getDocuments(id);
    const prog = storage.getProgress(id);
    const data = JSON.stringify(
      { project: activeProject, documents: docs, progress: prog },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProject.title.replace(/\s+/g, "-").toLowerCase()}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentDocs = documents.filter((d) => d.isCurrent);
  const docsByPhase = PHASES.reduce(
    (acc, phase) => {
      acc[phase.id] = currentDocs.filter((d) => d.phase === phase.id);
      return acc;
    },
    {} as Record<number, typeof currentDocs>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          {editingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setTitleValue(activeProject.title);
                  setEditingTitle(false);
                }
              }}
              className="text-2xl font-heading font-bold h-auto py-1"
              autoFocus
            />
          ) : (
            <h1
              className="text-2xl font-heading font-bold text-foreground truncate cursor-pointer hover:text-accent-400 transition-colors"
              onClick={() => setEditingTitle(true)}
              title="Click to edit"
            >
              {activeProject.title}
            </h1>
          )}
          <Badge variant={statusBadgeVariant[activeProject.status]}>
            {activeProject.status}
          </Badge>
          {activeProject.targetFunder && (
            <Badge>{activeProject.targetFunder}</Badge>
          )}
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export Project
        </Button>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Phase Pipeline */}
        <div className="flex-2 space-y-3">
          {PHASES.map((phase, i) => {
            const isExpanded = expandedPhase === phase.id;
            const accessible = canAccessPhase(phase.id);
            const completion = getPhaseCompletion(phase.id);
            const isCurrent = activeProject.currentPhase === phase.id;
            const phaseProgress = progress.phases[phase.id];

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card
                  className={`transition-all duration-normal ${
                    isCurrent
                      ? "border-accent-500/50 shadow-glow-sm"
                      : !accessible
                        ? "opacity-60"
                        : ""
                  }`}
                >
                  {/* Phase Row */}
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    onClick={() =>
                      setExpandedPhase(isExpanded ? null : phase.id)
                    }
                    disabled={!accessible}
                  >
                    <PhaseIcon
                      phase={phase.id as 1 | 2 | 3 | 4 | 5 | 6 | 7}
                      active={isCurrent}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-sm text-foreground">
                          {phase.name}
                        </span>
                        {!accessible && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {phase.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-2 w-24">
                        <Progress value={completion} className="flex-1" />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {completion}%
                        </span>
                      </div>
                      {accessible && (
                        isCurrent ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPhase(
                                isExpanded ? null : phase.id
                              );
                            }}
                          >
                            <Play className="h-3.5 w-3.5" />
                            {completion > 0 ? "Continue" : "Start"}
                          </Button>
                        ) : completion === 100 ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : null
                      )}
                      {accessible &&
                        (isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ))}
                    </div>
                  </button>

                  {/* Expanded Steps */}
                  {isExpanded && accessible && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border/50"
                    >
                      <div className="px-4 py-2 space-y-1">
                        {phase.stepNames.map((stepName, stepIdx) => {
                          const stepNum = stepIdx + 1;
                          const status: StepStatus =
                            phaseProgress?.steps[stepNum] ?? "not-started";

                          return (
                            <div
                              key={stepNum}
                              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                            >
                              <span className="text-xs text-muted-foreground font-mono w-5">
                                {stepNum}
                              </span>
                              <span className="text-sm text-foreground flex-1">
                                {stepName}
                              </span>
                              <span
                                className={`text-xs font-medium ${stepStatusColors[status]}`}
                              >
                                {stepStatusLabels[status]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Right: Document Inventory */}
        <div className="flex-1 min-w-0 lg:min-w-70 lg:max-w-90">
          <Card>
            <CardHeader className="py-3">
              <button
                type="button"
                className="flex items-center justify-between w-full"
                onClick={() => setDocInventoryOpen(!docInventoryOpen)}
              >
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Documents
                  <Badge variant="outline" className="ml-1">
                    {currentDocs.length}
                  </Badge>
                </CardTitle>
                {docInventoryOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CardHeader>

            {docInventoryOpen && (
              <CardContent className="pt-0">
                {currentDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No documents yet. Start working on Phase 1 to generate your
                    first documents.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {PHASES.map((phase) => {
                      const phaseDocs = docsByPhase[phase.id];
                      if (!phaseDocs || phaseDocs.length === 0) return null;

                      return (
                        <div key={phase.id}>
                          <div className="flex items-center gap-2 mb-2">
                            <PhaseIcon
                              phase={
                                phase.id as 1 | 2 | 3 | 4 | 5 | 6 | 7
                              }
                              size="sm"
                            />
                            <span className="text-xs font-medium text-muted-foreground">
                              {phase.name}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {phaseDocs.map((doc) => (
                              <button
                                type="button"
                                key={doc.id}
                                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                  setSelectedDoc({
                                    name: doc.name,
                                    content: doc.content,
                                  });
                                  setDocViewerOpen(true);
                                }}
                              >
                                <span className="text-sm text-foreground truncate">
                                  {doc.name}
                                </span>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className="text-xs text-muted-foreground">
                                    v{doc.version}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {doc.wordCount.toLocaleString()}w
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Document Viewer Dialog */}
      <Dialog open={docViewerOpen} onOpenChange={setDocViewerOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap px-1">
              {selectedDoc?.content}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
