"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderArchive } from "lucide-react";
import { toast } from "sonner";

import { useProjectStore } from "@/stores/project-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { storage } from "@/lib/storage";
import { getProjectIdFromUrl } from "@/lib/utils";
import { exportAllDocuments } from "@/lib/export-all";
import type { Project } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { DocumentInventory } from "@/components/document/DocumentInventory";

export function DocumentsPageClient({ id: _idProp }: { id: string }) {
  const { setActiveProject, activeProject } = useProjectStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();
  const [projectId] = useState(() => getProjectIdFromUrl());
  const [project, setProject] = useState<Project | null>(() =>
    projectId ? storage.getProject(projectId) ?? null : null,
  );
  const loading = false;
  const [exportingAll, setExportingAll] = useState(false);

  // Sync Zustand stores on mount
  useEffect(() => {
    if (!projectId) return;
    setActiveProject(projectId);
    loadDocuments(projectId);
  }, [projectId, setActiveProject, loadDocuments]);

  // Keep in sync with store updates
  useEffect(() => {
    if (activeProject && projectId && activeProject.id === projectId) {
      setProject(activeProject);
    }
  }, [activeProject, projectId]);

  useEffect(() => {
    if (project && projectId) {
      setBreadcrumbs([
        { label: "Projects", href: "/projects" },
        { label: project.title, href: `/projects/${projectId}` },
        { label: "Documents" },
      ]);
    }
  }, [project, setBreadcrumbs, projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

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
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Documents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {project.title} &middot; {currentDocs.length} document
            {currentDocs.length !== 1 ? "s" : ""}
          </p>
        </div>
        {currentDocs.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleExportAll}
            disabled={exportingAll}
          >
            <FolderArchive className="h-4 w-4" />
            {exportingAll ? "Exporting..." : "Export All as Zip"}
          </Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <DocumentInventory
          projectId={projectId!}
          projectTitle={project.title}
          fullPage
        />
      </motion.div>
    </div>
  );
}
