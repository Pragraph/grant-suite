"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import {
  Download,
  Lock,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  FolderArchive,
} from "lucide-react";

import { useProjectStore } from "@/stores/project-store";
import { useDocumentStore } from "@/stores/document-store";
import { useProgressStore } from "@/stores/progress-store";
import { useUiStore } from "@/stores/ui-store";
import { storage } from "@/lib/storage";
import { getProjectIdFromUrl } from "@/lib/utils";
import { exportAllDocuments } from "@/lib/export-all";
import { PHASES } from "@/lib/types";
import type { Project, StepStatus } from "@/lib/types";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PhaseIcon } from "@/components/ui/phase-icon";
import { Input } from "@/components/ui/input";
import { PipelineMap } from "@/components/shared/PipelineMap";
import { DocumentInventory } from "@/components/document/DocumentInventory";

/**
 * Force a full-page navigation, bypassing Next.js App Router's
 * client-side interception. This is required for dynamic routes
 * in static export because Next.js cannot resolve RSC payloads
 * for paths not in generateStaticParams.
 */
function navigateTo(url: string) {
  window.location.assign(url);
}

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

export function ProjectDetailClient({ id: _id }: { id: string }) {
  void _id; // extracted from URL instead
  const { setActiveProject, activeProject, updateProject } =
    useProjectStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { progress, loadProgress, getPhaseCompletion, canAccessPhase } =
    useProgressStore();
  const { setBreadcrumbs } = useUiStore();
  const [projectId] = useState(() => getProjectIdFromUrl());
  const [project, setProject] = useState<Project | null>(() =>
    projectId ? storage.getProject(projectId) ?? null : null,
  );
  const loading = false;

  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [expandedPhaseInitialized, setExpandedPhaseInitialized] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setActiveProject(projectId);
    loadProgress(projectId);
    loadDocuments(projectId);
  }, [projectId, setActiveProject, loadProgress, loadDocuments]);

  useEffect(() => {
    if (activeProject && projectId && activeProject.id === projectId) {
      setProject(activeProject);
    }
  }, [activeProject, projectId]);

  useEffect(() => {
    if (project) {
      setBreadcrumbs([
        { label: "Projects", href: "/projects" },
        { label: project.title },
      ]);
    }
  }, [project, setBreadcrumbs]);

  if (project && !editingTitle && titleValue !== project.title) {
    setTitleValue(project.title);
  }
  if (project && !expandedPhaseInitialized) {
    setExpandedPhase(project.currentPhase);
    setExpandedPhaseInitialized(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      updateProject(projectId!, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const handleExport = async () => {
    const docs = await storage.getDocuments(projectId!);
    const prog = storage.getProgress(projectId!);
    const data = JSON.stringify(
      { project, documents: docs, progress: prog },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "-").toLowerCase()}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentDocs = documents.filter((d) => d.isCurrent);

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      await exportAllDocuments(projectId!, project.title);
      toast.success("All documents exported as zip");
    } catch {
      toast.error("No documents to export");
    } finally {
      setExportingAll(false);
    }
  };

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
                  setTitleValue(project.title);
                  setEditingTitle(false);
                }
              }}
              className="text-2xl font-heading font-bold h-auto py-1"
              autoFocus
            />
          ) : (
            <h1
              className="text-2xl font-heading font-bold text-foreground truncate cursor-pointer hover:text-[#4F7DF3] transition-colors"
              onClick={() => setEditingTitle(true)}
              title="Click to edit"
            >
              {project.title}
            </h1>
          )}
          <Badge className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold">
            {project.status}
          </Badge>
          {project.targetFunder && (
            <Badge className="bg-[#F0F4FF] text-[#4F7DF3] rounded-full px-3 py-1 text-xs font-semibold">{project.targetFunder}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentDocs.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleExportAll}
              disabled={exportingAll}
            >
              <FolderArchive className="h-4 w-4" />
              {exportingAll ? "Exporting..." : "Export All Docs"}
            </Button>
          )}
          <Button variant="secondary" onClick={handleExport} className="border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
            <Download className="h-4 w-4" />
            Export Project
          </Button>
        </div>
      </motion.div>

      {/* Pipeline Map */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-card rounded-xl border border-border p-4 sm:p-6 overflow-x-auto">
          <PipelineMap />
        </Card>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Phase Pipeline */}
        <div className="flex-2 space-y-3">
          {PHASES.map((phase, i) => {
            const isExpanded = expandedPhase === phase.id;
            const accessible = canAccessPhase(phase.id);
            const completion = getPhaseCompletion(phase.id);
            const isCurrent = project.currentPhase === phase.id;
            const phaseProgress = progress.phases[phase.id];
            const phaseUrl = `/projects/${projectId}/phase/${phase.id}`;

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card
                  className={`transition-all duration-normal rounded-xl ${
                    isCurrent
                      ? "bg-card border border-[#4F7DF3]/30 shadow-sm"
                      : !accessible
                        ? "bg-muted/50 border border-border opacity-60"
                        : completion === 100
                          ? "bg-card border border-emerald-200"
                          : "bg-card border border-border"
                  }`}
                >
                  {/* Phase Row — toggles expand/collapse */}
                  <div
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left select-none ${accessible ? "cursor-pointer" : "cursor-default"}`}
                    onClick={() => accessible && setExpandedPhase(isExpanded ? null : phase.id)}
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
                          <Lock className="h-3.5 w-3.5 text-gray-300" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {phase.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-2 w-24">
                        <Progress value={completion} className="flex-1" />
                        <span className="text-xs text-gray-400 w-8 text-right">
                          {completion}%
                        </span>
                      </div>
                      {accessible && (
                        isCurrent ? (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo(phaseUrl);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                navigateTo(phaseUrl);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#4F7DF3] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3B63D4] transition-colors cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5" />
                            {completion > 0 ? "Continue" : "Start"}
                          </div>
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
                  </div>

                  {/* Expanded Steps */}
                  {isExpanded && accessible && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100"
                    >
                      <div className="px-4 py-2 space-y-1">
                        {phase.stepNames.map((stepName, stepIdx) => {
                          const stepNum = stepIdx + 1;
                          const status: StepStatus =
                            phaseProgress?.steps[stepNum] ?? "not-started";

                          return (
                            <div
                              key={stepNum}
                              role="button"
                              tabIndex={0}
                              onClick={() => navigateTo(phaseUrl)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") navigateTo(phaseUrl);
                              }}
                              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <span className="text-xs text-gray-400 font-mono w-5">
                                {stepNum}
                              </span>
                              <span className="text-sm text-foreground/80 flex-1">
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
          <DocumentInventory
            projectId={projectId!}
            projectTitle={project.title}
          />
        </div>
      </div>
    </div>
  );
}
