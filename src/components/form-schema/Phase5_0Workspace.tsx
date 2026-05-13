"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  Clipboard,
  Download,
  FileText,
  FilePlus,
  FileUp,
  Globe,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  applyPass2Result,
  applyPass3Result,
  buildPass1Prompt,
  buildPass2PromptForSection,
  buildPass3Prompt,
  buildTier1Prompt,
  buildTier2Prompt,
  computeExtractionStatus,
  convertDocxToMarkdown,
  deleteAllFormFiles,
  deleteDocxMarkdownCache,
  deleteFormFile,
  deleteFormSchema,
  deleteWorkspaceState,
  detectFileStrategy,
  findUnresolvedReferences,
  initialWorkspaceState,
  listCachedDocxMarkdown,
  loadFormFiles,
  loadFormSchema,
  loadWorkspaceState,
  parseSchemaPaste,
  saveFormFile,
  saveFormSchema,
  saveWorkspaceState,
  setDocxMarkdown as cacheDocxMarkdown,
  updateSectionStatus,
  validateFormSchema,
  validatePartialSchema,
  type FormSchema,
  type Pass2Result,
  type Pass3Result,
  type Phase50WorkspaceState,
  type SectionStatus,
  type StoredFormFile,
  type ValidationError,
} from "@/lib/form-schema";
import { cn } from "@/lib/utils";

import { SchemaEditor, type SectionAction } from "./SchemaEditor";

interface Phase5_0WorkspaceProps {
  projectId: string;
}

type WorkspaceMode = "multi-pass" | "single-pass-tier1" | "single-pass-tier2";
type ActivePass =
  | { kind: "pass1" }
  | { kind: "pass2"; sectionId: string }
  | { kind: "pass3" }
  | null;

const ACCEPT_FILES = ".pdf,.docx,.png,.jpg,.jpeg,.webp";

export function Phase5_0Workspace({ projectId }: Phase5_0WorkspaceProps) {
  // ─── Core state ─────────────────────────────────────────────────────────────
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [workspaceState, setWorkspaceState] = useState<Phase50WorkspaceState | null>(null);
  const [files, setFiles] = useState<StoredFormFile[]>([]);
  const [docxMarkdownByFile, setDocxMarkdownByFile] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // ─── UI mode ────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<WorkspaceMode>("multi-pass");
  const [activePass, setActivePass] = useState<ActivePass>(null);

  // ─── Paste-back state (shared across all passes) ────────────────────────────
  const [pasteRaw, setPasteRaw] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [mergeWarnings, setMergeWarnings] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);

  // ─── DOCX conversion state ──────────────────────────────────────────────────
  const [converting, setConverting] = useState<Record<string, boolean>>({});

  // ─── Single-pass Tier 2 form inputs (legacy fallback) ───────────────────────
  const [schemeName, setSchemeName] = useState("");
  const [funder, setFunder] = useState("");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [url, setUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [loadedSchema, loadedFiles, loadedWorkspace, cachedMd] = await Promise.all([
        loadFormSchema(projectId),
        loadFormFiles(projectId),
        loadWorkspaceState(projectId),
        listCachedDocxMarkdown(projectId),
      ]);
      if (cancelled) return;
      setSchema(loadedSchema);
      setFiles(loadedFiles);
      setWorkspaceState(
        loadedSchema && !loadedWorkspace
          ? initialWorkspaceState(projectId, loadedSchema)
          : loadedWorkspace,
      );
      setDocxMarkdownByFile(
        Object.fromEntries(cachedMd.map((m) => [m.filename, m.markdown])),
      );
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const combinedDocxMarkdown = useMemo(() => {
    const entries = Object.entries(docxMarkdownByFile);
    if (entries.length === 0) return undefined;
    if (entries.length === 1) return entries[0][1];
    return entries
      .map(([filename, md]) => `### ${filename}\n\n${md}`)
      .join("\n\n---\n\n");
  }, [docxMarkdownByFile]);

  const refreshFiles = useCallback(async () => {
    const next = await loadFormFiles(projectId);
    setFiles(next);
  }, [projectId]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const list = event.target.files;
      if (!list) return;
      const fileArray = Array.from(list);
      const convertingMap: Record<string, boolean> = {};

      for (const f of fileArray) {
        await saveFormFile(projectId, f);
        const strategy = detectFileStrategy(f);
        if (strategy.kind === "docx-embed-markdown") {
          convertingMap[f.name] = true;
        }
      }
      setConverting((prev) => ({ ...prev, ...convertingMap }));
      await refreshFiles();
      event.target.value = "";

      // Convert any DOCX files in the background. We don't await — UI shows progress.
      for (const f of fileArray) {
        const strategy = detectFileStrategy(f);
        if (strategy.kind !== "docx-embed-markdown") continue;
        try {
          const { markdown } = await convertDocxToMarkdown(f);
          await cacheDocxMarkdown(projectId, f.name, markdown);
          setDocxMarkdownByFile((prev) => ({ ...prev, [f.name]: markdown }));
          toast.success(`Converted ${f.name} to markdown.`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          toast.error(`DOCX conversion failed for ${f.name}: ${msg}`);
        } finally {
          setConverting((prev) => {
            const next = { ...prev };
            delete next[f.name];
            return next;
          });
        }
      }
      toast.success(`Uploaded ${fileArray.length} file${fileArray.length === 1 ? "" : "s"}.`);
    },
    [projectId, refreshFiles],
  );

  const handleDeleteFile = useCallback(
    async (filename: string) => {
      await deleteFormFile(projectId, filename);
      setDocxMarkdownByFile((prev) => {
        const next = { ...prev };
        delete next[filename];
        return next;
      });
      await refreshFiles();
    },
    [projectId, refreshFiles],
  );

  const handleDownloadFile = (file: StoredFormFile) => {
    const objectUrl = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  };

  const clearPasteState = useCallback(() => {
    setPasteRaw("");
    setPasteError(null);
    setValidationErrors([]);
    setMergeWarnings([]);
  }, []);

  const cancelActivePass = useCallback(async () => {
    if (activePass?.kind === "pass2" && workspaceState && schema) {
      const currentStatus = workspaceState.sectionStatuses[activePass.sectionId];
      if (currentStatus === "extracting") {
        const next = await updateSectionStatus(
          projectId,
          schema,
          workspaceState,
          activePass.sectionId,
          "not-extracted",
          (schema.cross_field_rules?.length ?? 0) > 0,
        );
        setWorkspaceState(next);
      }
    }
    setActivePass(null);
    clearPasteState();
  }, [activePass, clearPasteState, projectId, schema, workspaceState]);

  // ─── Pass 1 (skeleton) ──────────────────────────────────────────────────────
  const startPass1 = useCallback(async () => {
    const prompt = buildPass1Prompt({ docxMarkdown: combinedDocxMarkdown });
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Pass 1 prompt copied to clipboard.");
    } catch {
      toast.error("Clipboard access denied. Copy the prompt manually from below.");
    }
    setActivePass({ kind: "pass1" });
    clearPasteState();
  }, [combinedDocxMarkdown, clearPasteState]);

  const handleValidatePass1 = useCallback(async () => {
    setValidating(true);
    setPasteError(null);
    setValidationErrors([]);
    setMergeWarnings([]);
    try {
      const parsed = parseSchemaPaste(pasteRaw);
      if (parsed.error || !parsed.schema) {
        setPasteError(parsed.error ?? "Unknown parse error");
        return;
      }
      const validation = validatePartialSchema(parsed.schema);
      if (!validation.valid) {
        setPasteError(validation.errors.join("; "));
        return;
      }
      const fullValidation = validateFormSchema(parsed.schema);
      if (!fullValidation.valid) {
        setValidationErrors(fullValidation.errors);
        return;
      }
      const next = parsed.schema as FormSchema;
      const nextWorkspace = initialWorkspaceState(projectId, next);
      await Promise.all([
        saveFormSchema(projectId, next),
        saveWorkspaceState(projectId, nextWorkspace),
      ]);
      setSchema(next);
      setWorkspaceState(nextWorkspace);
      setActivePass(null);
      clearPasteState();
      toast.success("Pass 1 skeleton loaded.");
    } finally {
      setValidating(false);
    }
  }, [pasteRaw, projectId, clearPasteState]);

  // ─── Pass 2 (per-section field extraction) ──────────────────────────────────
  const startPass2 = useCallback(
    async (sectionId: string) => {
      if (!schema || !workspaceState) return;
      const prompt = buildPass2PromptForSection(schema, sectionId, combinedDocxMarkdown);
      try {
        await navigator.clipboard.writeText(prompt);
        toast.success(`Pass 2 prompt for section "${sectionId}" copied.`);
      } catch {
        toast.error("Clipboard access denied. Copy the prompt manually.");
      }
      const hasPass3 = (schema.cross_field_rules?.length ?? 0) > 0;
      const nextWorkspace = await updateSectionStatus(
        projectId,
        schema,
        workspaceState,
        sectionId,
        "extracting",
        hasPass3,
      );
      setWorkspaceState(nextWorkspace);
      setActivePass({ kind: "pass2", sectionId });
      clearPasteState();
    },
    [schema, workspaceState, combinedDocxMarkdown, projectId, clearPasteState],
  );

  const handleValidatePass2 = useCallback(async () => {
    if (!schema || !workspaceState || activePass?.kind !== "pass2") return;
    const targetSectionId = activePass.sectionId;
    setValidating(true);
    setPasteError(null);
    setValidationErrors([]);
    setMergeWarnings([]);
    try {
      const parsed = parseSchemaPaste(pasteRaw);
      if (parsed.error || !parsed.schema) {
        setPasteError(parsed.error ?? "Unknown parse error");
        return;
      }
      const candidate = parsed.schema as Partial<Pass2Result>;
      if (!candidate.section_id || !Array.isArray(candidate.fields)) {
        setPasteError(
          "Pass 2 output must include `section_id` and a `fields` array. See the Pass 2 prompt for the exact shape.",
        );
        return;
      }
      if (candidate.section_id !== targetSectionId) {
        setPasteError(
          `Pasted section_id "${candidate.section_id}" does not match the target "${targetSectionId}". Re-run Pass 2 for the correct section.`,
        );
        return;
      }
      const result = candidate as Pass2Result;
      const { schema: nextSchema, warnings } = applyPass2Result(schema, result);
      const fullValidation = validateFormSchema(nextSchema);
      if (!fullValidation.valid) {
        setValidationErrors(fullValidation.errors);
        return;
      }
      const hasPass3 = (nextSchema.cross_field_rules?.length ?? 0) > 0;
      const nextWorkspace = await updateSectionStatus(
        projectId,
        nextSchema,
        workspaceState,
        targetSectionId,
        "extracted",
        hasPass3,
      );
      await saveFormSchema(projectId, nextSchema);
      setSchema(nextSchema);
      setWorkspaceState(nextWorkspace);
      setMergeWarnings(warnings);
      setActivePass(null);
      clearPasteState();
      toast.success(
        `Section "${targetSectionId}" extracted (${result.fields.length} field${result.fields.length === 1 ? "" : "s"}).`,
      );
    } finally {
      setValidating(false);
    }
  }, [schema, workspaceState, activePass, pasteRaw, projectId, clearPasteState]);

  // ─── Pass 3 (relationships) ─────────────────────────────────────────────────
  const startPass3 = useCallback(async () => {
    if (!schema) return;
    const prompt = buildPass3Prompt({ schema, docxMarkdown: combinedDocxMarkdown });
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Pass 3 prompt copied to clipboard.");
    } catch {
      toast.error("Clipboard access denied. Copy the prompt manually.");
    }
    setActivePass({ kind: "pass3" });
    clearPasteState();
  }, [schema, combinedDocxMarkdown, clearPasteState]);

  const handleValidatePass3 = useCallback(async () => {
    if (!schema || !workspaceState) return;
    setValidating(true);
    setPasteError(null);
    setValidationErrors([]);
    setMergeWarnings([]);
    try {
      const parsed = parseSchemaPaste(pasteRaw);
      if (parsed.error || !parsed.schema) {
        setPasteError(parsed.error ?? "Unknown parse error");
        return;
      }
      const candidate = parsed.schema as Partial<Pass3Result>;
      if (
        !Array.isArray(candidate.cross_field_rules) ||
        !Array.isArray(candidate.validation_artifacts) ||
        !Array.isArray(candidate.section_visibility_updates)
      ) {
        setPasteError(
          "Pass 3 output must include `cross_field_rules`, `validation_artifacts`, and `section_visibility_updates` arrays.",
        );
        return;
      }
      const result = candidate as Pass3Result;
      const { schema: nextSchema, warnings } = applyPass3Result(schema, result);
      const fullValidation = validateFormSchema(nextSchema);
      if (!fullValidation.valid) {
        setValidationErrors(fullValidation.errors);
        return;
      }
      const unresolved = findUnresolvedReferences(nextSchema);
      const allWarnings = [
        ...warnings,
        ...unresolved.map((u) => `Unresolved reference at ${u.context}: "${u.referenced_id}".`),
      ];
      const extractionStatus = computeExtractionStatus(
        nextSchema,
        workspaceState.sectionStatuses,
        true,
      );
      const nextWorkspace: Phase50WorkspaceState = {
        ...workspaceState,
        extractionStatus,
        lastUpdatedAt: new Date().toISOString(),
      };
      await Promise.all([
        saveFormSchema(projectId, nextSchema),
        saveWorkspaceState(projectId, nextWorkspace),
      ]);
      setSchema(nextSchema);
      setWorkspaceState(nextWorkspace);
      setMergeWarnings(allWarnings);
      setActivePass(null);
      setPasteRaw("");
      toast.success(
        `Pass 3 merged — ${result.cross_field_rules.length} rule${result.cross_field_rules.length === 1 ? "" : "s"}, ${result.validation_artifacts.length} artifact${result.validation_artifacts.length === 1 ? "" : "s"}.`,
      );
    } finally {
      setValidating(false);
    }
  }, [schema, workspaceState, pasteRaw, projectId]);

  // ─── Section action dispatcher ──────────────────────────────────────────────
  const handleSectionAction = useCallback(
    async (sectionId: string, action: SectionAction) => {
      if (!schema || !workspaceState) return;
      const hasPass3 = (schema.cross_field_rules?.length ?? 0) > 0;
      switch (action) {
        case "extract":
        case "re-extract":
          await startPass2(sectionId);
          return;
        case "manual": {
          const next = await updateSectionStatus(
            projectId,
            schema,
            workspaceState,
            sectionId,
            "manual",
            hasPass3,
          );
          setWorkspaceState(next);
          toast.message(`Section "${sectionId}" marked manual.`);
          return;
        }
        case "skip": {
          const next = await updateSectionStatus(
            projectId,
            schema,
            workspaceState,
            sectionId,
            "skipped",
            hasPass3,
          );
          setWorkspaceState(next);
          toast.message(`Section "${sectionId}" skipped.`);
          return;
        }
        case "unskip": {
          const next = await updateSectionStatus(
            projectId,
            schema,
            workspaceState,
            sectionId,
            "not-extracted",
            hasPass3,
          );
          setWorkspaceState(next);
          toast.message(`Section "${sectionId}" un-skipped.`);
          return;
        }
      }
    },
    [schema, workspaceState, projectId, startPass2],
  );

  // ─── Single-pass fallback handlers (legacy v21-R1.1 path) ───────────────────
  const copyTier1Prompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildTier1Prompt());
      toast.success("Tier 1 prompt copied — paste into your LLM with the form file(s) attached.");
    } catch {
      toast.error("Clipboard access denied. Copy the prompt manually.");
    }
  }, []);

  const copyTier2Prompt = useCallback(async () => {
    if (!schemeName.trim() || !funder.trim()) {
      toast.error("Scheme name and funder are required.");
      return;
    }
    const parsedYear = parseInt(year, 10);
    if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
      toast.error("Enter a valid year between 1900 and 2100.");
      return;
    }
    try {
      await navigator.clipboard.writeText(
        buildTier2Prompt({
          schemeName: schemeName.trim(),
          funder: funder.trim(),
          year: parsedYear,
          url: url.trim() || undefined,
        }),
      );
      toast.success("Tier 2 prompt copied — paste into your LLM with web search enabled.");
    } catch {
      toast.error("Clipboard access denied. Copy the prompt manually.");
    }
  }, [schemeName, funder, year, url]);

  const handleValidateSinglePass = useCallback(async () => {
    setValidating(true);
    setPasteError(null);
    setValidationErrors([]);
    try {
      const parsed = parseSchemaPaste(pasteRaw);
      if (parsed.error || !parsed.schema) {
        setPasteError(parsed.error ?? "Unknown parse error");
        return;
      }
      const validation = validateFormSchema(parsed.schema);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }
      const next = parsed.schema as FormSchema;
      const nextWorkspace = initialWorkspaceState(projectId, next);
      // Mark all sections as extracted since single-pass produced the full schema.
      const sectionStatuses: Record<string, SectionStatus> = {};
      for (const id of Object.keys(nextWorkspace.sectionStatuses)) {
        sectionStatuses[id] = "extracted";
      }
      const populated: Phase50WorkspaceState = {
        ...nextWorkspace,
        sectionStatuses,
        extractionStatus: (next.cross_field_rules?.length ?? 0) > 0
          ? "relationships-extracted"
          : "fields-complete",
      };
      await Promise.all([
        saveFormSchema(projectId, next),
        saveWorkspaceState(projectId, populated),
      ]);
      setSchema(next);
      setWorkspaceState(populated);
      setMode("multi-pass");
      clearPasteState();
      toast.success("Schema loaded via single-pass.");
    } finally {
      setValidating(false);
    }
  }, [pasteRaw, projectId, clearPasteState]);

  // ─── Reset Phase 5-0 ────────────────────────────────────────────────────────
  const handleResetPhase50 = useCallback(async () => {
    const confirmed = window.confirm(
      "Reset Phase 5-0?\n\nThis will permanently delete the form schema, uploaded form files, and extraction progress for this project. Phase 1-4 data is not affected.\n\nContinue?",
    );
    if (!confirmed) return;
    await Promise.all([
      deleteFormSchema(projectId),
      deleteAllFormFiles(projectId),
      deleteWorkspaceState(projectId),
      deleteDocxMarkdownCache(projectId),
    ]);
    setSchema(null);
    setWorkspaceState(null);
    setFiles([]);
    setDocxMarkdownByFile({});
    setMode("multi-pass");
    setActivePass(null);
    clearPasteState();
    toast.success("Phase 5-0 reset. Upload a new form file to begin.");
  }, [projectId, clearPasteState]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Phase 5-0…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader workspaceState={workspaceState} onResetSchema={() => setSchema(null)} schema={schema} />

      {!schema && mode === "multi-pass" && activePass?.kind !== "pass1" && (
        <MultiPassUploadView
          files={files}
          docxMarkdownByFile={docxMarkdownByFile}
          converting={converting}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onDeleteFile={handleDeleteFile}
          onDownloadFile={handleDownloadFile}
          onStartPass1={startPass1}
          onUseSinglePass={() => setMode("single-pass-tier1")}
        />
      )}

      {!schema && activePass?.kind === "pass1" && (
        <Pass1PastePanel
          pasteRaw={pasteRaw}
          setPasteRaw={setPasteRaw}
          pasteError={pasteError}
          validationErrors={validationErrors}
          validating={validating}
          onValidate={handleValidatePass1}
          onCancel={cancelActivePass}
          hasDocxMarkdown={!!combinedDocxMarkdown}
        />
      )}

      {!schema && mode === "single-pass-tier1" && (
        <SinglePassTier1View
          files={files}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onDeleteFile={handleDeleteFile}
          onDownloadFile={handleDownloadFile}
          onCopyPrompt={copyTier1Prompt}
          onBack={() => setMode("multi-pass")}
          onSwitchTier2={() => setMode("single-pass-tier2")}
          pasteRaw={pasteRaw}
          setPasteRaw={setPasteRaw}
          pasteError={pasteError}
          validationErrors={validationErrors}
          validating={validating}
          onValidate={handleValidateSinglePass}
        />
      )}

      {!schema && mode === "single-pass-tier2" && (
        <SinglePassTier2View
          schemeName={schemeName}
          setSchemeName={setSchemeName}
          funder={funder}
          setFunder={setFunder}
          year={year}
          setYear={setYear}
          url={url}
          setUrl={setUrl}
          onCopyPrompt={copyTier2Prompt}
          onBack={() => setMode("multi-pass")}
          onSwitchTier1={() => setMode("single-pass-tier1")}
          pasteRaw={pasteRaw}
          setPasteRaw={setPasteRaw}
          pasteError={pasteError}
          validationErrors={validationErrors}
          validating={validating}
          onValidate={handleValidateSinglePass}
        />
      )}

      {schema && workspaceState && (
        <>
          <CollapsibleFileBar
            files={files}
            docxMarkdownByFile={docxMarkdownByFile}
            converting={converting}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onDeleteFile={handleDeleteFile}
            onDownloadFile={handleDownloadFile}
          />

          <Pass3Trigger
            workspaceState={workspaceState}
            onStartPass3={startPass3}
            mergeWarnings={mergeWarnings}
          />

          {activePass?.kind === "pass3" && (
            <Pass3PastePanel
              pasteRaw={pasteRaw}
              setPasteRaw={setPasteRaw}
              pasteError={pasteError}
              validationErrors={validationErrors}
              validating={validating}
              onValidate={handleValidatePass3}
              onCancel={cancelActivePass}
            />
          )}

          <SchemaEditor
            schema={schema}
            workspaceState={workspaceState}
            onSectionAction={handleSectionAction}
            enableSectionActions
            renderSectionExtras={(sectionId, status) => {
              if (activePass?.kind !== "pass2" || activePass.sectionId !== sectionId) return null;
              if (status !== "extracting") return null;
              return (
                <Pass2PastePanel
                  sectionId={sectionId}
                  pasteRaw={pasteRaw}
                  setPasteRaw={setPasteRaw}
                  pasteError={pasteError}
                  validationErrors={validationErrors}
                  validating={validating}
                  onValidate={handleValidatePass2}
                  onCancel={cancelActivePass}
                />
              );
            }}
          />
        </>
      )}

      <Phase50DangerZone schema={schema} workspaceState={workspaceState} onReset={handleResetPhase50} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkspaceHeader({
  workspaceState: _workspaceState,
  schema: _schema,
  onResetSchema: _onResetSchema,
}: {
  workspaceState: Phase50WorkspaceState | null;
  schema: FormSchema | null;
  onResetSchema: () => void;
}) {
  void _workspaceState;
  void _schema;
  void _onResetSchema;
  return (
    <header>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Phase 5-0</p>
      <h1 className="text-xl font-semibold text-foreground">Form Schema</h1>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Produce a structured <code className="text-[11px] bg-muted px-1 py-0.5 rounded">Form_Schema.json</code>{" "}
        describing the funder&apos;s actual application form via multi-pass extraction.
      </p>
    </header>
  );
}

interface FileListProps {
  files: StoredFormFile[];
  docxMarkdownByFile: Record<string, string>;
  converting: Record<string, boolean>;
  onDeleteFile: (filename: string) => void;
  onDownloadFile: (file: StoredFormFile) => void;
}

function FileList({ files, docxMarkdownByFile, converting, onDeleteFile, onDownloadFile }: FileListProps) {
  if (files.length === 0) return null;
  return (
    <ul className="space-y-1">
      {files.map((f) => {
        const ext = f.filename.toLowerCase().split(".").pop() ?? "";
        const isDocx = ext === "docx";
        const isConverting = converting[f.filename];
        const hasMarkdown = !!docxMarkdownByFile[f.filename];
        return (
          <li
            key={f.filename}
            className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-xs"
          >
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 truncate text-foreground">{f.filename}</span>
            <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
            {isDocx && isConverting && (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                Converting…
              </span>
            )}
            {isDocx && hasMarkdown && !isConverting && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Ready
              </span>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => onDownloadFile(f)}>
              <Download className="h-3 w-3" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onDeleteFile(f.filename)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

interface MultiPassUploadViewProps {
  files: StoredFormFile[];
  docxMarkdownByFile: Record<string, string>;
  converting: Record<string, boolean>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (filename: string) => void;
  onDownloadFile: (file: StoredFormFile) => void;
  onStartPass1: () => void;
  onUseSinglePass: () => void;
}

function MultiPassUploadView({
  files,
  docxMarkdownByFile,
  converting,
  fileInputRef,
  onFileSelect,
  onDeleteFile,
  onDownloadFile,
  onStartPass1,
  onUseSinglePass,
}: MultiPassUploadViewProps) {
  const anyConverting = Object.values(converting).some(Boolean);
  const readyToStart = files.length > 0 && !anyConverting;
  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Multi-pass extraction</p>
          <h2 className="text-base font-semibold text-foreground">
            Step 1 — Upload the form file(s)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, PNG, JPG, or WEBP. DOCX uploads are converted to markdown client-side and embedded in the
            Pass 1 prompt — no need to attach them separately.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Upload form file(s)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_FILES}
              className="hidden"
              onChange={onFileSelect}
              aria-label="Upload form files"
            />
            <span className="text-xs text-muted-foreground">
              {files.length} file{files.length === 1 ? "" : "s"} stored
            </span>
          </div>
          <FileList
            files={files}
            docxMarkdownByFile={docxMarkdownByFile}
            converting={converting}
            onDeleteFile={onDeleteFile}
            onDownloadFile={onDownloadFile}
          />
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-semibold text-foreground">Step 2 — Start the multi-pass extraction</p>
          <p className="text-xs text-muted-foreground">
            Multi-pass splits the extraction into three rounds: skeleton (Pass 1), per-section fields (Pass 2),
            and relationships (Pass 3). Each round is small enough for the LLM to handle reliably.
          </p>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="bg-[#4F7DF3] hover:bg-[#4F7DF3]/90"
            onClick={onStartPass1}
            disabled={!readyToStart}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Start extraction (multi-pass)
          </Button>
          {!readyToStart && (
            <p className="text-[11px] text-muted-foreground italic">
              {files.length === 0
                ? "Upload at least one form file to enable extraction."
                : "Waiting for DOCX conversion to finish…"}
            </p>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <button
            type="button"
            onClick={onUseSinglePass}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Use single-pass extraction (advanced)
          </button>
          <p className="text-[10px] text-muted-foreground italic mt-1">
            Single-pass works well for simple forms with fewer than 30 fields. Multi-pass is recommended for the GET
            form, Horizon MSCA template, or any 50+ field application.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CollapsibleFileBar({
  files,
  docxMarkdownByFile,
  converting,
  fileInputRef,
  onFileSelect,
  onDeleteFile,
  onDownloadFile,
}: FileListProps & {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          {files.length} form file{files.length === 1 ? "" : "s"} stored
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2 border-t border-border">
          <div className="flex items-center gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Upload more
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_FILES}
              className="hidden"
              onChange={onFileSelect}
              aria-label="Upload form files"
            />
          </div>
          <FileList
            files={files}
            docxMarkdownByFile={docxMarkdownByFile}
            converting={converting}
            onDeleteFile={onDeleteFile}
            onDownloadFile={onDownloadFile}
          />
        </div>
      )}
    </div>
  );
}

interface BasePastePanelProps {
  pasteRaw: string;
  setPasteRaw: (v: string) => void;
  pasteError: string | null;
  validationErrors: ValidationError[];
  validating: boolean;
  onValidate: () => void;
  onCancel?: () => void;
}

function Pass1PastePanel({
  pasteRaw,
  setPasteRaw,
  pasteError,
  validationErrors,
  validating,
  onValidate,
  onCancel,
  hasDocxMarkdown,
}: BasePastePanelProps & { hasDocxMarkdown: boolean }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pass 1 — Skeleton</p>
            <h2 className="text-base font-semibold text-foreground">Paste Pass 1 output</h2>
          </div>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Paste the prompt into ChatGPT 5.5 Thinking, Claude, or a similar LLM.{" "}
          {hasDocxMarkdown
            ? "The form content is already embedded in the prompt — no file attachment needed."
            : "Attach the form file(s) you uploaded to the LLM session."}{" "}
          The LLM returns a skeleton JSON. Paste it below.
        </p>
        <PasteBackInputs
          pasteRaw={pasteRaw}
          setPasteRaw={setPasteRaw}
          pasteError={pasteError}
          validationErrors={validationErrors}
          validating={validating}
          onValidate={onValidate}
          validateLabel="Validate and Load skeleton"
        />
      </CardContent>
    </Card>
  );
}

function Pass2PastePanel({
  sectionId,
  pasteRaw,
  setPasteRaw,
  pasteError,
  validationErrors,
  validating,
  onValidate,
  onCancel,
}: BasePastePanelProps & { sectionId: string }) {
  return (
    <div className="rounded-md border border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
          <Sparkles className="h-3 w-3 inline-block mr-1" />
          Pass 2 prompt for section &ldquo;{sectionId}&rdquo; copied. Run it in your LLM and paste the result below.
        </p>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <PasteBackInputs
        pasteRaw={pasteRaw}
        setPasteRaw={setPasteRaw}
        pasteError={pasteError}
        validationErrors={validationErrors}
        validating={validating}
        onValidate={onValidate}
        validateLabel="Validate and Load fields"
        compact
      />
    </div>
  );
}

function Pass3PastePanel({
  pasteRaw,
  setPasteRaw,
  pasteError,
  validationErrors,
  validating,
  onValidate,
  onCancel,
}: BasePastePanelProps) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pass 3 — Relationships</p>
            <h2 className="text-base font-semibold text-foreground">Paste Pass 3 output</h2>
          </div>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          The Pass 3 prompt embeds the current schema. Run it in your LLM and paste the JSON output below — it should
          contain <code className="text-[11px] bg-muted px-1 rounded">cross_field_rules</code>,{" "}
          <code className="text-[11px] bg-muted px-1 rounded">validation_artifacts</code>, and{" "}
          <code className="text-[11px] bg-muted px-1 rounded">section_visibility_updates</code> arrays.
        </p>
        <PasteBackInputs
          pasteRaw={pasteRaw}
          setPasteRaw={setPasteRaw}
          pasteError={pasteError}
          validationErrors={validationErrors}
          validating={validating}
          onValidate={onValidate}
          validateLabel="Validate and Load relationships"
        />
      </CardContent>
    </Card>
  );
}

function Pass3Trigger({
  workspaceState,
  onStartPass3,
  mergeWarnings,
}: {
  workspaceState: Phase50WorkspaceState;
  onStartPass3: () => void;
  mergeWarnings: string[];
}) {
  const hasExtracted = Object.values(workspaceState.sectionStatuses).some(
    (s) => s === "extracted",
  );
  if (!hasExtracted) return null;
  const isRelationshipsExtracted =
    workspaceState.extractionStatus === "relationships-extracted";
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#4F7DF3]" />
            Pass 3 — Cross-field rules &amp; validation artifacts
          </p>
          <p className="text-xs text-muted-foreground">
            Once at least one section is extracted, run Pass 3 to identify relationships between fields and any
            separately-attached forms (CVs, patent search forms, MOUs).
          </p>
        </div>
        <Button
          type="button"
          variant={isRelationshipsExtracted ? "outline" : "default"}
          size="sm"
          onClick={onStartPass3}
          className={!isRelationshipsExtracted ? "bg-[#4F7DF3] hover:bg-[#4F7DF3]/90" : ""}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isRelationshipsExtracted ? "Re-extract relationships" : "Extract relationships (Pass 3)"}
        </Button>
      </div>
      {mergeWarnings.length > 0 && (
        <div className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs space-y-1">
          <p className="font-medium text-amber-800 dark:text-amber-200 inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {mergeWarnings.length} warning{mergeWarnings.length === 1 ? "" : "s"} from merge
          </p>
          <ul className="space-y-0.5 list-disc pl-4">
            {mergeWarnings.slice(0, 6).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
            {mergeWarnings.length > 6 && (
              <li className="italic">…and {mergeWarnings.length - 6} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function PasteBackInputs({
  pasteRaw,
  setPasteRaw,
  pasteError,
  validationErrors,
  validating,
  onValidate,
  validateLabel,
  compact = false,
}: BasePastePanelProps & { validateLabel: string; compact?: boolean }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs" htmlFor="paste-target">
        Paste JSON output here
      </Label>
      <Textarea
        id="paste-target"
        value={pasteRaw}
        onChange={(e) => setPasteRaw(e.target.value)}
        placeholder='{"section_id": "...", "fields": [...]}'
        className={cn(
          "font-mono text-xs",
          compact ? "min-h-[120px]" : "min-h-[180px]",
        )}
      />
      {pasteError && (
        <div className="flex items-start gap-2 rounded-md border border-red-300/60 bg-red-50 dark:bg-red-950/30 p-3 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
          <span>
            <strong>Parse error:</strong> {pasteError}
          </span>
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <strong>
              Schema validation failed ({validationErrors.length} error{validationErrors.length === 1 ? "" : "s"}):
            </strong>
          </div>
          <ul className="space-y-1 max-h-48 overflow-auto pl-5 list-disc">
            {validationErrors.slice(0, 12).map((e, i) => (
              <li key={i}>
                <span className="font-mono">{e.path || "(root)"}</span> — {e.message}
              </li>
            ))}
            {validationErrors.length > 12 && (
              <li className="italic">…and {validationErrors.length - 12} more</li>
            )}
          </ul>
        </div>
      )}
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={onValidate}
        disabled={validating || !pasteRaw.trim()}
      >
        {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus className="h-3.5 w-3.5" />}
        {validateLabel}
      </Button>
    </div>
  );
}

interface SinglePassTier1ViewProps {
  files: StoredFormFile[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (filename: string) => void;
  onDownloadFile: (file: StoredFormFile) => void;
  onCopyPrompt: () => void;
  onBack: () => void;
  onSwitchTier2: () => void;
  pasteRaw: string;
  setPasteRaw: (v: string) => void;
  pasteError: string | null;
  validationErrors: ValidationError[];
  validating: boolean;
  onValidate: () => void;
}

function SinglePassTier1View({
  files,
  fileInputRef,
  onFileSelect,
  onDeleteFile,
  onDownloadFile,
  onCopyPrompt,
  onBack,
  onSwitchTier2,
  pasteRaw,
  setPasteRaw,
  pasteError,
  validationErrors,
  validating,
  onValidate,
}: SinglePassTier1ViewProps) {
  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Single-pass · Tier 1 (advanced)</p>
            <h2 className="text-base font-semibold text-foreground">Upload, copy prompt, paste schema</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSwitchTier2}>
              <Globe className="h-3.5 w-3.5" />
              Use Tier 2 (web reconstruct)
            </Button>
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back to multi-pass
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Form files</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Upload form file(s)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_FILES}
              className="hidden"
              onChange={onFileSelect}
              aria-label="Upload form files"
            />
            <span className="text-xs text-muted-foreground">
              {files.length} file{files.length === 1 ? "" : "s"} stored
            </span>
          </div>
          <FileList
            files={files}
            docxMarkdownByFile={{}}
            converting={{}}
            onDeleteFile={onDeleteFile}
            onDownloadFile={onDownloadFile}
          />
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <Label className="text-xs">Step 1 — copy the single-pass Tier 1 prompt</Label>
          <p className="text-xs text-muted-foreground">
            Paste the prompt into ChatGPT, Claude, or a similar LLM with the form file(s) attached. The LLM returns
            a complete JSON schema in one shot.
          </p>
          <Button type="button" variant="default" size="sm" onClick={onCopyPrompt}>
            <Clipboard className="h-3.5 w-3.5" />
            Copy single-pass prompt
          </Button>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <Label className="text-xs">Step 2 — paste the LLM&apos;s JSON output</Label>
          <PasteBackInputs
            pasteRaw={pasteRaw}
            setPasteRaw={setPasteRaw}
            pasteError={pasteError}
            validationErrors={validationErrors}
            validating={validating}
            onValidate={onValidate}
            validateLabel="Validate and Load schema"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface SinglePassTier2ViewProps {
  schemeName: string;
  setSchemeName: (v: string) => void;
  funder: string;
  setFunder: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  onCopyPrompt: () => void;
  onBack: () => void;
  onSwitchTier1: () => void;
  pasteRaw: string;
  setPasteRaw: (v: string) => void;
  pasteError: string | null;
  validationErrors: ValidationError[];
  validating: boolean;
  onValidate: () => void;
}

function SinglePassTier2View({
  schemeName,
  setSchemeName,
  funder,
  setFunder,
  year,
  setYear,
  url,
  setUrl,
  onCopyPrompt,
  onBack,
  onSwitchTier1,
  pasteRaw,
  setPasteRaw,
  pasteError,
  validationErrors,
  validating,
  onValidate,
}: SinglePassTier2ViewProps) {
  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Single-pass · Tier 2 (advanced)</p>
            <h2 className="text-base font-semibold text-foreground">Reconstruct from web documentation</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSwitchTier1}>
              <FileUp className="h-3.5 w-3.5" />
              Use Tier 1 (uploaded form)
            </Button>
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back to multi-pass
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="t2-scheme">Scheme name</Label>
            <Input
              id="t2-scheme"
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
              placeholder="e.g., Horizon Europe MSCA Staff Exchanges"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="t2-funder">Funder</Label>
            <Input
              id="t2-funder"
              value={funder}
              onChange={(e) => setFunder(e.target.value)}
              placeholder="e.g., European Research Executive Agency"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="t2-year">Year</Label>
            <Input
              id="t2-year"
              type="number"
              min={1900}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="t2-url">URL (optional)</Label>
            <Input
              id="t2-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://funder.example.org/call-text"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="default" size="sm" onClick={onCopyPrompt}>
            <Clipboard className="h-3.5 w-3.5" />
            Copy Tier 2 prompt
          </Button>
          <p className="text-xs text-muted-foreground">
            Paste into an LLM with web search enabled.
          </p>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <Label className="text-xs">Paste the LLM&apos;s JSON output</Label>
          <PasteBackInputs
            pasteRaw={pasteRaw}
            setPasteRaw={setPasteRaw}
            pasteError={pasteError}
            validationErrors={validationErrors}
            validating={validating}
            onValidate={onValidate}
            validateLabel="Validate and Load schema"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Phase50DangerZone({
  schema,
  workspaceState: _workspaceState,
  onReset,
}: {
  schema: FormSchema | null;
  workspaceState: Phase50WorkspaceState | null;
  onReset: () => void;
}) {
  void _workspaceState;
  const [expanded, setExpanded] = useState(false);
  if (!schema) return null;
  return (
    <div className="mt-12 pt-6 border-t border-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 text-xs font-medium text-muted-foreground/60",
          "hover:text-muted-foreground transition-colors",
        )}
      >
        <ShieldAlert className="h-3 w-3" />
        Phase 5-0 Danger Zone
        <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="mt-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Reset Phase 5-0</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently deletes the form schema, uploaded form files, DOCX markdown cache, and extraction
              progress for this project. Phase 1-4 data is not affected. This cannot be undone.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Phase 5-0
          </Button>
        </div>
      )}
    </div>
  );
}

// Avoid unused warning: Pencil is used in SchemaEditor, but ensure imports here are intentional.
void Pencil;
