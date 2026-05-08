import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Read the project ID directly from window.location.pathname.
 * useParams() is unreliable in Next.js 15 static export because the RSC
 * payload hardcodes the placeholder "_" from generateStaticParams.
 */
export function getProjectIdFromUrl(): string {
  if (typeof window === "undefined") return "";
  const segments = window.location.pathname.split("/");
  const idx = segments.indexOf("projects");
  const raw = idx >= 0 ? segments[idx + 1] : null;
  return raw && raw !== "_" ? decodeURIComponent(raw) : "";
}

/** Parse both projectId and phaseId from a /projects/[id]/phase/[phaseId] URL. */
export function getIdsFromUrl(): { projectId: string | null; phaseId: string | null } {
  if (typeof window === "undefined") return { projectId: null, phaseId: null };
  const segments = window.location.pathname.split("/");
  const projIdx = segments.indexOf("projects");
  const phaseIdx = segments.indexOf("phase");
  return {
    projectId: projIdx >= 0 ? decodeURIComponent(segments[projIdx + 1] || "") || null : null,
    phaseId: phaseIdx >= 0 ? decodeURIComponent(segments[phaseIdx + 1] || "") || null : null,
  };
}

/**
 * Title-Cases a string for UI display. Handles single-word values
 * ("transformative" -> "Transformative") and snake_case / kebab-case
 * ("early_career" -> "Early Career"). Display layer only — do not use
 * to mutate canonical stored values; lowercase Project type unions
 * gate TS conditional logic across the app.
 */
export function titleCase(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Builds a Google search URL pre-loaded with operators tuned for finding
 * the official grant guidelines PDF. Returns null when grantProgramName
 * is missing so the caller can hide the link gracefully.
 */
export function buildGrantGuidelinesSearchUrl(
  grantProgramName: string | undefined | null,
): string | null {
  if (!grantProgramName) return null;
  const trimmed = grantProgramName.trim();
  if (!trimmed) return null;
  const yearCutoff = new Date().getFullYear() - 3;
  const query = `filetype:PDF ${trimmed} after:${yearCutoff}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
