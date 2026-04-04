"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { useDocumentStore } from "@/stores/document-store";

import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DocumentImporterProps {
  projectId: string;
  /** The canonical document name this import produces (e.g., "Complete_Proposal.md") */
  canonicalName: string;
  /** Which phase/step this document belongs to */
  phase: number;
  step: number;
  /** Human-readable label shown to the user */
  label: string;
  /** Help text explaining what to upload */
  helpText: string;
  /** Whether the user can also paste text instead of uploading */
  allowPaste?: boolean;
  /** Called after successful import */
  onImported?: (canonicalName: string) => void;
  /** Accepted file types */
  accept?: string;
}

type ImportMode = "upload" | "paste";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    return file.text();
  }

  if (ext === "pdf") {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item: { str?: string }) => item.str || "")
          .join(" ");
        pages.push(text);
      }

      return pages.join("\n\n");
    } catch (err) {
      console.error("PDF extraction failed:", err);
      throw new Error(
        "Could not extract text from this PDF. Try copying the text and using the paste option instead."
      );
    }
  }

  // Fallback: try reading as text
  return file.text();
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DocumentImporter({
  projectId,
  canonicalName,
  phase,
  step,
  label,
  helpText,
  allowPaste = true,
  onImported,
  accept = ".txt,.md,.pdf",
}: DocumentImporterProps) {
  const { saveDocument, loadDocuments } = useDocumentStore();

  const [mode, setMode] = useState<ImportMode>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imported, setImported] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ─────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setProcessing(true);

      try {
        const content = await extractTextFromFile(file);

        if (!content.trim()) {
          throw new Error(
            "The file appears to be empty or we could not extract any text."
          );
        }

        const wordCount = content.split(/\s+/).filter(Boolean).length;

        const doc = {
          id: storage.createId(),
          projectId,
          phase,
          step,
          name: `${label} (imported)`,
          canonicalName,
          content,
          format: "md" as const,
          version: 1,
          isCurrent: true,
          wordCount,
          createdAt: new Date().toISOString(),
        };

        await saveDocument(projectId, doc);
        await loadDocuments(projectId);

        setImported(true);
        toast.success(
          `${label} imported successfully (${wordCount.toLocaleString()} words)`
        );
        onImported?.(canonicalName);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to process file";
        setError(msg);
        toast.error(msg);
      } finally {
        setProcessing(false);
      }
    },
    [
      projectId,
      canonicalName,
      phase,
      step,
      label,
      saveDocument,
      loadDocuments,
      onImported,
    ]
  );

  // ── Paste handling ────────────────────────────────────────────────────

  const handlePasteSubmit = useCallback(async () => {
    if (!pasteContent.trim()) return;
    setError(null);
    setProcessing(true);

    try {
      const wordCount = pasteContent.split(/\s+/).filter(Boolean).length;

      const doc = {
        id: storage.createId(),
        projectId,
        phase,
        step,
        name: `${label} (pasted)`,
        canonicalName,
        content: pasteContent.trim(),
        format: "md" as const,
        version: 1,
        isCurrent: true,
        wordCount,
        createdAt: new Date().toISOString(),
      };

      await saveDocument(projectId, doc);
      await loadDocuments(projectId);

      setImported(true);
      toast.success(
        `${label} imported successfully (${wordCount.toLocaleString()} words)`
      );
      onImported?.(canonicalName);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save content";
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  }, [
    pasteContent,
    projectId,
    canonicalName,
    phase,
    step,
    label,
    saveDocument,
    loadDocuments,
    onImported,
  ]);

  // ── Drag and drop ─────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Already imported ──────────────────────────────────────────────────

  if (imported) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
          <Check className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {label}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">
            Imported successfully
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-emerald-600 hover:text-emerald-800"
          onClick={() => {
            setImported(false);
            setPasteContent("");
          }}
        >
          Replace
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Label and help */}
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{helpText}</p>
      </div>

      {/* Mode tabs (upload / paste) */}
      {allowPaste && (
        <div className="flex gap-1 rounded-lg bg-muted p-0.5 w-fit">
          <button
            onClick={() => setMode("upload")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              mode === "upload"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Upload file
          </button>
          <button
            onClick={() => setMode("paste")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              mode === "paste"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Paste text
          </button>
        </div>
      )}

      {mode === "upload" ? (
        /* Drop zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all",
            isDragging
              ? "border-[#4F7DF3] bg-[#F0F4FF] dark:bg-[#4F7DF3]/10"
              : "border-border hover:border-[#4F7DF3]/40 hover:bg-muted/30",
            processing && "opacity-50 pointer-events-none"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm text-foreground font-medium">
              {processing
                ? "Processing..."
                : "Drop file here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supports .txt, .md, and .pdf files
            </p>
          </div>
        </div>
      ) : (
        /* Paste area */
        <div className="space-y-2">
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Paste your document content here..."
            className="w-full min-h-[160px] rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]/30 focus:border-[#4F7DF3]/40"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {pasteContent
                .split(/\s+/)
                .filter(Boolean)
                .length.toLocaleString()}{" "}
              words
            </span>
            <Button
              size="sm"
              disabled={!pasteContent.trim() || processing}
              onClick={handlePasteSubmit}
            >
              {processing ? "Saving..." : "Import"}
            </Button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
