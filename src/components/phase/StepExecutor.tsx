"use client";

import React, { useReducer, useEffect, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Pencil,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Sparkles,
  Trash2,
  Eye,
  Save,
  Upload,
  ExternalLink,
} from "lucide-react";

import { cn, titleCase } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { usePromptEngine } from "@/hooks/usePromptEngine";
import { useDocumentPipeline } from "@/hooks/useDocumentPipeline";
import { useDocumentStore } from "@/stores/document-store";
import { useProgressStore } from "@/stores/progress-store";
import { useProjectStore } from "@/stores/project-store";
import type { CompileContext } from "@/lib/prompt-engine";
import type { RequiredDocument } from "@/lib/types";
import { DOCUMENT_DEPENDENCIES, PHASE_DEFINITIONS } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/document/MarkdownRenderer";
import { MarkdownEditor } from "@/components/document/MarkdownEditor";
import { DecoratedMarkdownView } from "@/components/document/DecoratedMarkdownView";
import {
  PlaceholderResolver,
  type ResolverFilter,
} from "@/components/document/PlaceholderResolver";
import { applyResolutions, parsePlaceholders } from "@/lib/placeholders";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "file-upload-text";
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  helperLink?: { url: string; label: string };
}

interface StepExecutorProps {
  templateId: string;
  projectId: string;
  phase: number;
  step: number;
  title: string;
  description?: string;
  additionalFields?: FormFieldConfig[];
  onComplete?: (documentName: string) => void;
}

// ─── State Machine ──────────────────────────────────────────────────────────

type ExecutorState =
  | "CHECKING"
  | "MISSING_DOCS"
  | "READY"
  | "PROMPT_COMPILED"
  | "WAITING_FOR_OUTPUT"
  | "REVIEWING"
  | "SAVED";

interface ExecutorReducerState {
  state: ExecutorState;
  missingRequired: RequiredDocument[];
  missingOptional: RequiredDocument[];
  formValues: Record<string, string>;
  compiledPrompt: string;
  promptEdited: boolean;
  estimatedWords: number;
  epTags: string[];
  warnings: string[];
  pastedOutput: string;
  savedDocumentName: string;
  savedWordCount: number;
  resolutions: Record<string, string>;
  confirmed: string[];
  skipped: string[];
  tagFilter: ResolverFilter;
  activeTagId: string | null;
  resolverOpen: boolean;
}

type ExecutorAction =
  | { type: "SET_CHECKING" }
  | { type: "SET_MISSING_DOCS"; required: RequiredDocument[]; optional: RequiredDocument[] }
  | { type: "SET_READY" }
  | { type: "SET_FORM_VALUE"; name: string; value: string }
  | { type: "SET_PROMPT_COMPILED"; prompt: string; words: number; epTags: string[]; warnings: string[] }
  | { type: "SET_PROMPT_EDITED"; prompt: string }
  | { type: "SET_WAITING_FOR_OUTPUT" }
  | { type: "SET_PASTED_OUTPUT"; output: string }
  | { type: "SET_REVIEWING"; resolverOpen: boolean }
  | { type: "SET_SAVED"; documentName: string; wordCount: number }
  | { type: "BACK_TO_PROMPT" }
  | { type: "DISCARD_OUTPUT" }
  | { type: "APPLY_RESOLUTION"; tagId: string; replacement: string }
  | { type: "CONFIRM_TAG"; tagId: string }
  | { type: "SKIP_TAG"; tagId: string }
  | { type: "UNDO_TAG"; tagId: string }
  | { type: "BULK_CONFIRM_VERIFICATIONS"; tagIds: string[] }
  | { type: "BULK_APPLY_CITATIONS"; assignments: Record<string, string> }
  | { type: "SET_TAG_FILTER"; filter: ResolverFilter }
  | { type: "SET_ACTIVE_TAG"; tagId: string | null }
  | { type: "TOGGLE_RESOLVER" }
  | { type: "RESTORE"; state: ExecutorReducerState };

const initialState: ExecutorReducerState = {
  state: "CHECKING",
  missingRequired: [],
  missingOptional: [],
  formValues: {},
  compiledPrompt: "",
  promptEdited: false,
  estimatedWords: 0,
  epTags: [],
  warnings: [],
  pastedOutput: "",
  savedDocumentName: "",
  savedWordCount: 0,
  resolutions: {},
  confirmed: [],
  skipped: [],
  tagFilter: "all",
  activeTagId: null,
  resolverOpen: false,
};

function reducer(state: ExecutorReducerState, action: ExecutorAction): ExecutorReducerState {
  switch (action.type) {
    case "SET_CHECKING":
      return { ...state, state: "CHECKING" };
    case "SET_MISSING_DOCS":
      return { ...state, state: "MISSING_DOCS", missingRequired: action.required, missingOptional: action.optional };
    case "SET_READY":
      return { ...state, state: "READY" };
    case "SET_FORM_VALUE":
      return { ...state, formValues: { ...state.formValues, [action.name]: action.value } };
    case "SET_PROMPT_COMPILED":
      return {
        ...state,
        state: "PROMPT_COMPILED",
        compiledPrompt: action.prompt,
        promptEdited: false,
        estimatedWords: action.words,
        epTags: action.epTags,
        warnings: action.warnings,
      };
    case "SET_PROMPT_EDITED":
      return { ...state, compiledPrompt: action.prompt, promptEdited: true };
    case "SET_WAITING_FOR_OUTPUT":
      return { ...state, state: "WAITING_FOR_OUTPUT" };
    case "SET_PASTED_OUTPUT":
      return { ...state, pastedOutput: action.output };
    case "SET_REVIEWING":
      return { ...state, state: "REVIEWING", resolverOpen: action.resolverOpen };
    case "SET_SAVED":
      return { ...state, state: "SAVED", savedDocumentName: action.documentName, savedWordCount: action.wordCount };
    case "BACK_TO_PROMPT":
      return { ...state, state: "PROMPT_COMPILED" };
    case "DISCARD_OUTPUT":
      return {
        ...state,
        state: "WAITING_FOR_OUTPUT",
        pastedOutput: "",
        resolutions: {},
        confirmed: [],
        skipped: [],
        activeTagId: null,
        tagFilter: "all",
      };
    case "APPLY_RESOLUTION":
      return {
        ...state,
        resolutions: { ...state.resolutions, [action.tagId]: action.replacement },
        confirmed: state.confirmed.filter((id) => id !== action.tagId),
        skipped: state.skipped.filter((id) => id !== action.tagId),
      };
    case "CONFIRM_TAG": {
      const { [action.tagId]: _omit, ...remaining } = state.resolutions;
      void _omit;
      return {
        ...state,
        resolutions: remaining,
        confirmed: state.confirmed.includes(action.tagId)
          ? state.confirmed
          : [...state.confirmed, action.tagId],
        skipped: state.skipped.filter((id) => id !== action.tagId),
      };
    }
    case "SKIP_TAG": {
      const { [action.tagId]: _omit, ...remaining } = state.resolutions;
      void _omit;
      return {
        ...state,
        resolutions: remaining,
        confirmed: state.confirmed.filter((id) => id !== action.tagId),
        skipped: state.skipped.includes(action.tagId)
          ? state.skipped
          : [...state.skipped, action.tagId],
      };
    }
    case "UNDO_TAG": {
      const { [action.tagId]: _omit, ...remaining } = state.resolutions;
      void _omit;
      return {
        ...state,
        resolutions: remaining,
        confirmed: state.confirmed.filter((id) => id !== action.tagId),
        skipped: state.skipped.filter((id) => id !== action.tagId),
      };
    }
    case "BULK_CONFIRM_VERIFICATIONS": {
      const next = new Set(state.confirmed);
      for (const id of action.tagIds) {
        next.add(id);
      }
      return {
        ...state,
        confirmed: Array.from(next),
      };
    }
    case "BULK_APPLY_CITATIONS": {
      const ids = Object.keys(action.assignments);
      return {
        ...state,
        resolutions: { ...state.resolutions, ...action.assignments },
        confirmed: state.confirmed.filter((id) => !ids.includes(id)),
        skipped: state.skipped.filter((id) => !ids.includes(id)),
      };
    }
    case "SET_TAG_FILTER":
      return { ...state, tagFilter: action.filter };
    case "SET_ACTIVE_TAG":
      return { ...state, activeTagId: action.tagId };
    case "TOGGLE_RESOLVER":
      return { ...state, resolverOpen: !state.resolverOpen };
    case "RESTORE":
      return action.state;
    default:
      return state;
  }
}

// ─── Persistence Key ────────────────────────────────────────────────────────

function getPersistKey(projectId: string, phase: number, step: number) {
  return `grant-suite-executor-${projectId}-${phase}-${step}`;
}

// ─── Phase border color mapping ─────────────────────────────────────────────

const phaseBorderColors: Record<number, string> = {
  1: "border-l-phase-1",
  2: "border-l-phase-2",
  3: "border-l-phase-3",
  4: "border-l-phase-4",
  5: "border-l-phase-5",
  6: "border-l-phase-6",
  7: "border-l-phase-7",
};

// ─── Animation variants ─────────────────────────────────────────────────────

const stateVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const springTransition = { type: "spring" as const, stiffness: 300, damping: 30 };

// ─── Field label row (handles Optional pill + helper link) ─────────────────

function FieldLabel({
  field,
  htmlFor,
}: {
  field: FormFieldConfig;
  htmlFor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5"
      >
        <span>{field.label}</span>
        {field.required ? (
          <span className="text-red-500">*</span>
        ) : (
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[9px] font-normal uppercase tracking-wide text-muted-foreground/70 border-border/60"
          >
            Optional
          </Badge>
        )}
      </Label>
      {field.helperLink && (
        <a
          href={field.helperLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-normal text-[#4F7DF3] hover:text-[#4F7DF3]/80 hover:underline transition-colors"
        >
          {field.helperLink.label}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

// ─── File text extraction (for file-upload-text fields) ─────────────────────

async function extractTextFromUpload(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    return file.text();
  }

  if (ext === "pdf") {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push(text);
    }

    const result = pages.join("\n\n");
    if (!result.trim()) {
      throw new Error("Could not extract text from this PDF. The file may be scanned or image-based. Try copying the text manually and pasting it instead.");
    }
    return result;
  }

  // Fallback: try reading as text
  return file.text();
}

// ─── File Upload Text Field ─────────────────────────────────────────────────

function FileUploadTextField({
  field,
  value,
  onChange,
}: {
  field: FormFieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const text = await extractTextFromUpload(file);
      if (!text.trim()) {
        throw new Error("The file appears to be empty or no text could be extracted.");
      }
      onChange(text);
      setUploadedFileName(file.name);
      toast.success(`Extracted text from ${file.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to extract text from file";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-1.5">
      <FieldLabel field={field} htmlFor={`field-${field.name}`} />

      {/* Upload bar */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            // Reset so the same file can be re-uploaded
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs font-medium transition-colors",
            "border-border text-muted-foreground hover:border-[#4F7DF3]/40 hover:text-[#4F7DF3] hover:bg-[#F0F4FF]",
            uploading && "opacity-50 pointer-events-none",
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Extracting..." : "Upload file"}
        </button>
        <span className="text-[10px] text-muted-foreground">
          .pdf, .txt, .md
        </span>
        {uploadedFileName && !uploadError && (
          <span className="text-[10px] text-emerald-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            {uploadedFileName}
          </span>
        )}
      </div>

      {/* Error */}
      {uploadError && (
        <div className="flex items-start gap-1.5 text-[11px] text-red-600">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Textarea with drop support */}
      <div
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={handleDrop}
      >
        <textarea
          id={`field-${field.name}`}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // Clear uploaded filename if user manually edits
            if (uploadedFileName) setUploadedFileName(null);
          }}
          placeholder={field.placeholder || "Upload a file above or paste the text content here..."}
          className={cn(
            "w-full min-h-25 resize-y rounded-lg border border-border bg-muted p-3",
            "font-mono text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          )}
        />
      </div>

      {/* Word count when content exists */}
      {value.trim() && (
        <p className="text-[10px] text-muted-foreground text-right">
          {value.split(/\s+/).filter(Boolean).length.toLocaleString()} words
        </p>
      )}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function StepExecutor({
  templateId,
  projectId,
  phase,
  step,
  title,
  description,
  additionalFields = [],
  onComplete,
}: StepExecutorProps) {
  const [execState, dispatch] = useReducer(reducer, initialState);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showUnaddressedDialog, setShowUnaddressedDialog] = useState(false);

  const { compile, getTemplate } = usePromptEngine();
  const pipeline = useDocumentPipeline(projectId);
  const saveDocument = useDocumentStore((s) => s.saveDocument);
  const activeProject = useProjectStore((s) => s.activeProject);
  const updateStepStatus = useProgressStore((s) => s.updateStepStatus);

  // ── Check document readiness ────────────────────────────────────────────

  const checkReadiness = useCallback(() => {
    dispatch({ type: "SET_CHECKING" });

    const result = pipeline.validateReadiness(phase, step);
    if (!result.ready) {
      const requiredDocs = pipeline.getRequiredDocuments(phase, step);
      const missing = requiredDocs.filter((d) => !d.present && d.required);
      const optionalMissing = requiredDocs.filter((d) => !d.present && !d.required);
      dispatch({ type: "SET_MISSING_DOCS", required: missing, optional: optionalMissing });
    } else {
      dispatch({ type: "SET_READY" });
    }
  }, [pipeline, phase, step]);

  // ── Restore persisted state on mount ────────────────────────────────────

  useEffect(() => {
    try {
      const persisted = localStorage.getItem(getPersistKey(projectId, phase, step));
      if (persisted) {
        const parsed = JSON.parse(persisted) as Partial<ExecutorReducerState> & {
          state: ExecutorReducerState["state"];
        };
        // Don't restore CHECKING or transient states
        if (parsed.state !== "CHECKING") {
          // Merge any new default values that didn't exist in persisted state
          const mergedFormValues = { ...(parsed.formValues ?? {}) };
          for (const field of additionalFields) {
            if (field.defaultValue && !mergedFormValues[field.name]) {
              mergedFormValues[field.name] = field.defaultValue;
            }
          }
          // Back-compat: fill in resolver fields if persisted state pre-dates them
          const restored: ExecutorReducerState = {
            ...initialState,
            ...parsed,
            formValues: mergedFormValues,
            resolutions: parsed.resolutions ?? {},
            confirmed: parsed.confirmed ?? [],
            skipped: parsed.skipped ?? [],
            tagFilter: parsed.tagFilter ?? "all",
            activeTagId: parsed.activeTagId ?? null,
            resolverOpen: parsed.resolverOpen ?? false,
          };
          dispatch({ type: "RESTORE", state: restored });
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Seed form values from defaultValue when no persisted state
    for (const field of additionalFields) {
      if (field.defaultValue) {
        dispatch({ type: "SET_FORM_VALUE", name: field.name, value: field.defaultValue });
      }
    }

    checkReadiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, phase, step]);

  // ── Persist state changes ───────────────────────────────────────────────

  useEffect(() => {
    if (execState.state !== "CHECKING") {
      try {
        localStorage.setItem(
          getPersistKey(projectId, phase, step),
          JSON.stringify(execState)
        );
      } catch {
        // Storage full — silently fail
      }
    }
  }, [execState, projectId, phase, step]);

  // ── Compile prompt ──────────────────────────────────────────────────────

  const handleCompile = useCallback(() => {
    if (!activeProject) return;

    // Build document map from available documents
    const availableDocs = pipeline.getAvailableDocuments();
    const documentMap: Record<string, string> = {};
    for (const doc of availableDocs) {
      documentMap[doc.canonicalName] = doc.content;
    }

    const context: CompileContext = {
      project: {
        title: activeProject.title,
        discipline: activeProject.discipline,
        country: activeProject.country,
        careerStage: activeProject.careerStage,
        targetFunder: activeProject.targetFunder,
        budgetRange: activeProject.budgetRange,
        grantSubCategory: titleCase(activeProject.grantSubCategory),
      },
      documents: documentMap,
      formInputs: execState.formValues,
    };

    try {
      const result = compile(templateId, context);
      dispatch({
        type: "SET_PROMPT_COMPILED",
        prompt: result.compiledPrompt,
        words: result.estimatedWords,
        epTags: result.epTagsDeployed,
        warnings: result.warnings,
      });
      updateStepStatus(projectId, phase, step, "in-progress");
    } catch (err) {
      toast.error("Failed to compile prompt", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [activeProject, pipeline, execState.formValues, compile, templateId, updateStepStatus, projectId, phase, step]);

  // ── Copy to clipboard ───────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(execState.compiledPrompt);
      setCopyFeedback(true);
      toast.success("Prompt copied!");
      updateStepStatus(projectId, phase, step, "prompt-copied");
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [execState.compiledPrompt, updateStepStatus, projectId, phase, step]);

  // ── Submit output ───────────────────────────────────────────────────────

  const handleSubmitOutput = useCallback(() => {
    if (!execState.pastedOutput.trim()) return;
    const hasTags = parsePlaceholders(execState.pastedOutput).length > 0;
    dispatch({ type: "SET_REVIEWING", resolverOpen: hasTags });
    updateStepStatus(projectId, phase, step, "output-pasted");
  }, [execState.pastedOutput, updateStepStatus, projectId, phase, step]);

  // ── Save document ───────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    try {
      const template = getTemplate(templateId);
      const content = applyResolutions(
        execState.pastedOutput,
        execState.resolutions,
        new Set(execState.confirmed),
      );
      const wordCount = content
        .replace(/[#*`>\-|=]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

      const doc = {
        id: storage.createId(),
        projectId,
        phase,
        step,
        name: template.name,
        canonicalName: template.outputName,
        content,
        format: "md" as const,
        version: 1,
        isCurrent: true,
        wordCount,
        createdAt: new Date().toISOString(),
      };

      await saveDocument(projectId, doc);
      updateStepStatus(projectId, phase, step, "complete");

      dispatch({
        type: "SET_SAVED",
        documentName: template.outputName,
        wordCount,
      });

      // Clean up persisted executor state
      localStorage.removeItem(getPersistKey(projectId, phase, step));

      toast.success(`${template.outputName} saved`);
    } catch (err) {
      toast.error("Failed to save document", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [
    execState.pastedOutput,
    execState.resolutions,
    execState.confirmed,
    getTemplate,
    templateId,
    projectId,
    phase,
    step,
    saveDocument,
    updateStepStatus,
  ]);

  // ── Output metadata ─────────────────────────────────────────────────────

  const tagInstances = useMemo(
    () => parsePlaceholders(execState.pastedOutput),
    [execState.pastedOutput],
  );

  const outputMeta = useMemo(() => {
    const text = execState.pastedOutput;
    if (!text) return { wordCount: 0, epTags: [] as string[] };

    const wordCount = text.replace(/[#*`>\-|=]/g, " ").split(/\s+/).filter((w) => w.length > 0).length;
    const epMatches = text.match(/EP-\d{2}/g);
    const epTags = epMatches ? [...new Set(epMatches)].sort() : [];

    return { wordCount, epTags };
  }, [execState.pastedOutput]);

  const resolverCounts = useMemo(() => {
    const total = tagInstances.length;
    const resolvedCount = Object.keys(execState.resolutions).length + execState.confirmed.length;
    const skippedCount = execState.skipped.length;
    const unaddressed = total - resolvedCount - skippedCount;
    return { total, resolvedCount, skippedCount, unaddressed };
  }, [tagInstances.length, execState.resolutions, execState.confirmed, execState.skipped]);

  const handleSaveClick = useCallback(() => {
    if (resolverCounts.unaddressed > 0) {
      setShowUnaddressedDialog(true);
      return;
    }
    handleSave();
  }, [resolverCounts.unaddressed, handleSave]);

  // ── Keyboard navigation in REVIEWING split view ─────────────────────────

  useEffect(() => {
    if (execState.state !== "REVIEWING" || !execState.resolverOpen) return;

    const handler = (e: KeyboardEvent) => {
      const isTextarea =
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "INPUT";

      // Cmd/Ctrl+S always fires
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveClick();
        return;
      }

      // Block other keys when typing
      if (isTextarea) return;

      const pendingTags = tagInstances.filter(
        (t) =>
          execState.resolutions[t.id] === undefined &&
          !execState.confirmed.includes(t.id) &&
          !execState.skipped.includes(t.id),
      );

      if (e.key === "j" && pendingTags.length > 0) {
        e.preventDefault();
        const currentIdx = pendingTags.findIndex((t) => t.id === execState.activeTagId);
        const next = pendingTags[(currentIdx + 1) % pendingTags.length];
        dispatch({ type: "SET_ACTIVE_TAG", tagId: next.id });
        document.getElementById(`resolver-entry-${next.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        document.getElementById(`tag-pill-${next.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else if (e.key === "k" && pendingTags.length > 0) {
        e.preventDefault();
        const currentIdx = pendingTags.findIndex((t) => t.id === execState.activeTagId);
        const prevIdx = currentIdx <= 0 ? pendingTags.length - 1 : currentIdx - 1;
        const prev = pendingTags[prevIdx];
        dispatch({ type: "SET_ACTIVE_TAG", tagId: prev.id });
        document.getElementById(`resolver-entry-${prev.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        document.getElementById(`tag-pill-${prev.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else if (e.key === "Escape" && execState.activeTagId) {
        e.preventDefault();
        dispatch({ type: "SKIP_TAG", tagId: execState.activeTagId });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    execState.state,
    execState.resolverOpen,
    execState.activeTagId,
    execState.resolutions,
    execState.confirmed,
    execState.skipped,
    tagInstances,
    handleSaveClick,
  ]);

  // ── Find which step produces a given document ───────────────────────────

  const findProducer = useCallback((canonicalName: string) => {
    const dep = DOCUMENT_DEPENDENCIES.find((d) => d.produces === canonicalName);
    if (!dep) return null;
    const phaseDef = PHASE_DEFINITIONS.find((p) => p.phase === dep.phase);
    const stepDef = phaseDef?.steps.find((s) => s.step === dep.step);
    return { phase: dep.phase, step: dep.step, name: stepDef?.name ?? canonicalName };
  }, []);

  // ── Render form field ───────────────────────────────────────────────────

  const renderField = useCallback(
    (field: FormFieldConfig) => {
      const value = execState.formValues[field.name] ?? "";

      switch (field.type) {
        case "text":
          return (
            <div key={field.name} className="space-y-1.5">
              <FieldLabel field={field} htmlFor={field.name} />
              <Input
                id={field.name}
                value={value}
                onChange={(e) => dispatch({ type: "SET_FORM_VALUE", name: field.name, value: e.target.value })}
                placeholder={field.placeholder}
              />
            </div>
          );

        case "textarea":
          return (
            <div key={field.name} className="space-y-1.5">
              <FieldLabel field={field} htmlFor={`field-${field.name}`} />
              <textarea
                id={`field-${field.name}`}
                value={value}
                onChange={(e) => dispatch({ type: "SET_FORM_VALUE", name: field.name, value: e.target.value })}
                placeholder={field.placeholder}
                className={cn(
                  "w-full min-h-25 resize-y rounded-lg border border-border bg-muted p-3",
                  "font-mono text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                )}
              />
            </div>
          );

        case "file-upload-text":
          return (
            <FileUploadTextField
              key={field.name}
              field={field}
              value={value}
              onChange={(v) => dispatch({ type: "SET_FORM_VALUE", name: field.name, value: v })}
            />
          );

        case "select":
          return (
            <div key={field.name} className="space-y-1.5">
              <FieldLabel field={field} htmlFor={`field-${field.name}`} />
              <select
                id={`field-${field.name}`}
                value={value}
                onChange={(e) => dispatch({ type: "SET_FORM_VALUE", name: field.name, value: e.target.value })}
                aria-label={field.label}
                className={cn(
                  "w-full h-9 rounded-md border border-border bg-muted px-3",
                  "text-sm text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                )}
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );

        default:
          return null;
      }
    },
    [execState.formValues]
  );

  // ── Render states ───────────────────────────────────────────────────────

  const renderState = () => {
    switch (execState.state) {
      // ── CHECKING ────────────────────────────────────────────────────────
      case "CHECKING":
        return (
          <motion.div key="checking" {...stateVariants} transition={springTransition}>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-40 mt-4" />
              <p className="text-xs text-muted-foreground mt-2">Checking prerequisites...</p>
            </CardContent>
          </motion.div>
        );

      // ── MISSING_DOCS ───────────────────────────────────────────────────
      case "MISSING_DOCS":
        return (
          <motion.div key="missing" {...stateVariants} transition={springTransition}>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Required documents are missing
                  </p>
                  <ul className="space-y-1.5">
                    {execState.missingRequired.map((doc) => {
                      const producer = findProducer(doc.canonicalName);
                      return (
                        <li key={doc.canonicalName} className="text-sm text-muted-foreground flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-mono text-xs text-amber-600 dark:text-amber-400">{doc.canonicalName}</span>
                          {producer && (
                            <span className="text-xs text-muted-foreground">
                              — Phase {producer.phase}, Step {producer.step}: {producer.name}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {execState.missingOptional.length > 0 && (
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recommended (optional)</p>
                  <ul className="space-y-1">
                    {execState.missingOptional.map((doc) => {
                      const producer = findProducer(doc.canonicalName);
                      return (
                        <li key={doc.canonicalName} className="text-xs text-muted-foreground flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          <span className="font-mono">{doc.canonicalName}</span>
                          {producer && (
                            <span className="text-muted-foreground">
                              — Phase {producer.phase}, Step {producer.step}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <Button variant="secondary" size="sm" onClick={checkReadiness}>
                Re-check
              </Button>
            </CardContent>
          </motion.div>
        );

      // ── READY ──────────────────────────────────────────────────────────
      case "READY":
        return (
          <motion.div key="ready" {...stateVariants} transition={springTransition}>
            <CardContent className="space-y-4">
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}

              {additionalFields.length > 0 && (
                <div className="space-y-3">
                  {additionalFields.map(renderField)}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleCompile}>
                <Sparkles className="h-4 w-4" />
                Compile Prompt
              </Button>
            </CardFooter>
          </motion.div>
        );

      // ── PROMPT_COMPILED ────────────────────────────────────────────────
      case "PROMPT_COMPILED":
        return (
          <motion.div key="compiled" {...stateVariants} transition={springTransition}>
            <CardContent className="space-y-4">
              {/* Prompt display */}
              <div className="relative">
                {editMode ? (
                  <textarea
                    value={execState.compiledPrompt}
                    onChange={(e) => dispatch({ type: "SET_PROMPT_EDITED", prompt: e.target.value })}
                    aria-label="Edit compiled prompt"
                    className={cn(
                      "w-full max-h-100 min-h-50 resize-y rounded-lg bg-muted p-5",
                      "font-mono text-sm text-foreground",
                      "border border-[#4F7DF3]/30",
                      "focus:outline-none focus:ring-2 focus:ring-[#4F7DF3]"
                    )}
                  />
                ) : (
                  <div className="max-h-100 overflow-auto rounded-xl bg-muted border border-border p-5">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                      {execState.compiledPrompt}
                    </pre>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>~{execState.estimatedWords.toLocaleString()} words</span>
                {execState.epTags.length > 0 && (
                  <>
                    <span className="text-muted-foreground/50">|</span>
                    <span>EP tags:</span>
                    {execState.epTags.map((tag) => (
                      <Badge key={tag} className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </>
                )}
                {execState.promptEdited && (
                  <>
                    <span className="text-muted-foreground/50">|</span>
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0">Edited</Badge>
                  </>
                )}
              </div>

              {execState.warnings.length > 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
                  {execState.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{w}</p>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="lg" onClick={handleCopy} className="min-w-45">
                  {copyFeedback ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Pencil className="h-4 w-4" />
                  {editMode ? "Done Editing" : "Edit Prompt"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Paste this prompt into your preferred AI tool (ChatGPT, Claude, Gemini, etc.) and copy the output.
              </p>

              <Button onClick={() => dispatch({ type: "SET_WAITING_FOR_OUTPUT" })}>
                I&apos;ve Got the Output
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </motion.div>
        );

      // ── WAITING_FOR_OUTPUT ─────────────────────────────────────────────
      case "WAITING_FOR_OUTPUT":
        return (
          <motion.div key="waiting" {...stateVariants} transition={springTransition}>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste the complete output from your AI tool below.
              </p>

              {previewMode && execState.pastedOutput ? (
                <div className="min-h-75 overflow-auto rounded-lg border border-border bg-muted p-6">
                  <MarkdownRenderer content={execState.pastedOutput} />
                </div>
              ) : (
                <textarea
                  value={execState.pastedOutput}
                  onChange={(e) => dispatch({ type: "SET_PASTED_OUTPUT", output: e.target.value })}
                  placeholder="Paste the AI output here..."
                  className={cn(
                    "w-full min-h-75 resize-y rounded-xl border border-border bg-card p-4",
                    "font-mono text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  )}
                />
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSubmitOutput}
                  disabled={!execState.pastedOutput.trim()}
                >
                  <Save className="h-4 w-4" />
                  Submit Output
                </Button>

                {execState.pastedOutput.trim() && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="h-4 w-4" />
                    {previewMode ? "Raw Text" : "Preview"}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch({ type: "BACK_TO_PROMPT" })}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Prompt
                </Button>
              </div>
            </CardContent>
          </motion.div>
        );

      // ── REVIEWING ──────────────────────────────────────────────────────
      case "REVIEWING": {
        const hasTags = tagInstances.length > 0;
        const showSplitView = hasTags && execState.resolverOpen && !editMode;

        return (
          <motion.div key="reviewing" {...stateVariants} transition={springTransition}>
            <CardContent className="space-y-4">
              {/* Metadata bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted border border-border px-3 py-2">
                <span>{outputMeta.wordCount.toLocaleString()} words</span>
                {outputMeta.epTags.length > 0 && (
                  <>
                    <span className="text-muted-foreground/50">|</span>
                    {outputMeta.epTags.map((tag) => (
                      <Badge key={tag} className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </>
                )}
                <span className="text-muted-foreground/50">|</span>
                {hasTags ? (
                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                    {resolverCounts.resolvedCount} of {resolverCounts.total} placeholders resolved
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-[10px] px-1.5 py-0">
                    <Check className="h-3 w-3 mr-1" />
                    No placeholders detected
                  </Badge>
                )}
                {hasTags && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: "TOGGLE_RESOLVER" })}
                    className="ml-auto h-6 text-[11px]"
                  >
                    {execState.resolverOpen ? "Hide resolver" : "Open resolver"}
                  </Button>
                )}
              </div>

              {/* Content */}
              {showSplitView ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
                  <div className="max-h-125 overflow-auto rounded-lg border border-border bg-muted p-6">
                    <DecoratedMarkdownView
                      content={execState.pastedOutput}
                      tagInstances={tagInstances}
                      resolutions={execState.resolutions}
                      confirmed={new Set(execState.confirmed)}
                      skipped={new Set(execState.skipped)}
                      activeTagId={execState.activeTagId}
                      onTagClick={(tagId) => {
                        dispatch({ type: "SET_ACTIVE_TAG", tagId });
                        document
                          .getElementById(`resolver-entry-${tagId}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    />
                  </div>
                  <div className="max-h-125 overflow-hidden rounded-lg border border-border bg-card">
                    <PlaceholderResolver
                      tagInstances={tagInstances}
                      resolutions={execState.resolutions}
                      confirmed={new Set(execState.confirmed)}
                      skipped={new Set(execState.skipped)}
                      filter={execState.tagFilter}
                      activeTagId={execState.activeTagId}
                      onApply={(tagId, replacement) =>
                        dispatch({ type: "APPLY_RESOLUTION", tagId, replacement })
                      }
                      onConfirm={(tagId) => dispatch({ type: "CONFIRM_TAG", tagId })}
                      onSkip={(tagId) => dispatch({ type: "SKIP_TAG", tagId })}
                      onUndo={(tagId) => dispatch({ type: "UNDO_TAG", tagId })}
                      onBulkConfirm={(tagIds) =>
                        dispatch({ type: "BULK_CONFIRM_VERIFICATIONS", tagIds })
                      }
                      onBulkApplyCitations={(assignments) =>
                        dispatch({ type: "BULK_APPLY_CITATIONS", assignments })
                      }
                      onFilterChange={(filter) =>
                        dispatch({ type: "SET_TAG_FILTER", filter })
                      }
                      onEntryFocus={(tagId) => {
                        dispatch({ type: "SET_ACTIVE_TAG", tagId });
                        document
                          .getElementById(`tag-pill-${tagId}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    />
                  </div>
                </div>
              ) : editMode ? (
                <MarkdownEditor
                  content={execState.pastedOutput}
                  onChange={(val) => dispatch({ type: "SET_PASTED_OUTPUT", output: val })}
                  showToolbar={false}
                  minHeight="300px"
                />
              ) : (
                <div className="max-h-125 overflow-auto rounded-lg border border-border bg-muted p-6">
                  <MarkdownRenderer content={execState.pastedOutput} />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleSaveClick}>
                  <Check className="h-4 w-4" />
                  Save &amp; Continue
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Pencil className="h-4 w-4" />
                  {editMode ? "Preview" : "Edit"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditMode(false);
                    dispatch({ type: "DISCARD_OUTPUT" });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Discard &amp; Re-paste
                </Button>
              </div>
            </CardContent>
          </motion.div>
        );
      }

      // ── SAVED ──────────────────────────────────────────────────────────
      case "SAVED":
        return (
          <motion.div key="saved" {...stateVariants} transition={springTransition}>
            <CardContent className="flex flex-col items-center py-8 space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30"
              >
                <Check className="h-7 w-7 text-emerald-500" />
              </motion.div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Document saved</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                  {execState.savedDocumentName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {execState.savedWordCount.toLocaleString()} words
                </p>
              </div>

              <Button
                onClick={() => {
                  onComplete?.(execState.savedDocumentName);
                }}
              >
                Continue to Next Step
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </motion.div>
        );
    }
  };

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <Card
      className={cn(
        "border-l-[3px] bg-card border border-border rounded-xl shadow-sm overflow-visible",
        phaseBorderColors[phase] ?? "border-l-accent-500"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-foreground">{title}</CardTitle>
            {execState.state !== "READY" && description && (
              <CardDescription className="mt-1 text-muted-foreground">{description}</CardDescription>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground border-border">
            Phase {phase} &middot; Step {step}
          </Badge>
        </div>
      </CardHeader>

      <AnimatePresence mode="wait">
        {renderState()}
      </AnimatePresence>

      <Dialog open={showUnaddressedDialog} onOpenChange={setShowUnaddressedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unaddressed placeholders</DialogTitle>
            <DialogDescription>
              {resolverCounts.unaddressed} placeholder
              {resolverCounts.unaddressed === 1 ? "" : "s"}{" "}
              {resolverCounts.unaddressed === 1 ? "is" : "are"} still in the document.
              These will appear in the saved document and will need to be addressed
              before the proposal is submitted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowUnaddressedDialog(false);
                if (!execState.resolverOpen) {
                  dispatch({ type: "TOGGLE_RESOLVER" });
                }
              }}
            >
              Resolve now
            </Button>
            <Button
              onClick={() => {
                setShowUnaddressedDialog(false);
                handleSave();
              }}
            >
              Save with placeholders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
