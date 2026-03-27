"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { FolderArchive } from "lucide-react";
import { toast } from "sonner";

import { useProjectStore } from "@/stores/project-store";
import { useDocumentStore } from "@/stores/document-store";
import { useUiStore } from "@/stores/ui-store";
import { exportAllDocuments } from "@/lib/export-all";

import { Button } from "@/components/ui/button";
import { DocumentInventory } from "@/components/document/DocumentInventory";

export function DocumentsPageClient({ id: idProp }: { id: string }) {
  const params = useParams<{ id: string }>();
  const id = params.id ?? idProp;
  const { setActiveProject, activeProject } = useProjectStore();
  const { documents, loadDocuments } = useDocumentStore();
  const { setBreadcrumbs } = useUiStore();
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    setActiveProject(id);
    loadDocuments(id);
  }, [id, setActiveProject, loadDocuments]);

  useEffect(() => {
    if (activeProject) {
      setBreadcrumbs([
        { label: "Projects", href: "/projects" },
        { label: activeProject.title, href: `/projects/${id}` },
        { label: "Documents" },
      ]);
    }
  }, [activeProject, setBreadcrumbs, id]);

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading...
      </div>
    );
  }

  const currentDocs = documents.filter((d) => d.isCurrent);

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      await exportAllDocuments(id, activeProject.title);
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
            {activeProject.title} &middot; {currentDocs.length} document
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
          projectTitle={activeProject.title}
          fullPage
        />
      </motion.div>
    </div>
  );
}
