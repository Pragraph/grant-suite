"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { FolderArchive } from "lucide-react";
import { toast } from "sonner";

import { useProjectStore } from "@/stores/project-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { storage } from "@/lib/storage";
import { exportAllDocuments } from "@/lib/export-all";
import type { Project } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { DocumentInventory } from "@/components/document/DocumentInventory";

export function DocumentsPageClient({ id: idProp }: { id: string }) {
  const params = useParams<{ id: string }>();
  const id = params.id ?? idProp;
  const { setActiveProject, activeProject } = useProjectStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingAll, setExportingAll] = useState(false);

  // Primary load — direct localStorage read
  useEffect(() => {
    if (!id || id === "_") return;

    const found = storage.getProject(id);
    setProject(found);
    setLoading(false);

    if (found) {
      setActiveProject(id);
      loadDocuments(id);
    }
  }, [id, setActiveProject, loadDocuments]);

  // Keep in sync with store updates
  useEffect(() => {
    if (activeProject && activeProject.id === id) {
      setProject(activeProject);
    }
  }, [activeProject, id]);

  useEffect(() => {
    if (project) {
      setBreadcrumbs([
        { label: "Projects", href: "/projects" },
        { label: project.title, href: `/projects/${id}` },
        { label: "Documents" },
      ]);
    }
  }, [project, setBreadcrumbs, id]);

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
      await exportAllDocuments(id, project.title);
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
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Documents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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
          projectId={id}
          projectTitle={project.title}
          fullPage
        />
      </motion.div>
    </div>
  );
}
