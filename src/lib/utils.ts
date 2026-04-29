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
