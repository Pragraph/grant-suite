// Best-effort PDF → markdown conversion using pdfjs-dist. Quality varies with
// PDF structure: text-based PDFs with good layout render reliably; scanned
// PDFs (image-only) yield minimal output and surface an OCR-suggestion
// warning; complex multi-column layouts can produce out-of-order text.
//
// The heuristics live in pure functions (extractLinesFromItems,
// formatLinesToMarkdown) so they can be unit-tested without spinning up a
// real PDF.js worker. The thin async entrypoint convertPdfToMarkdown loads
// pdfjs-dist lazily — callers should dynamic-import this module so the ~600KB
// worker bundle only loads when the user clicks "Convert".

export interface PdfToMarkdownResult {
  markdown: string;
  pageCount: number;
  warnings: string[];
}

export interface RawTextItem {
  str: string;
  /** Transform matrix from pdfjs `TextItem.transform`. transform[5] is the y-coord (PDF coords, larger = higher). */
  transform: number[];
  /** Width in PDF points. */
  width: number;
  /** Optional font height; pdfjs exposes this as `height` on `TextItem`. */
  height?: number;
}

export interface PageLines {
  pageNumber: number;
  lines: string[];
  /** Median font height of items on the page; used as a baseline for heading detection. */
  medianHeight: number;
  /** Lines tagged with their detected font height so heading heuristics can compare. */
  linesWithHeights: { text: string; height: number }[];
}

const SECTION_LABEL = /^([A-Z](?:\(?[ivx]+\)?)?\.|\d+(?:\.\d+)+)\s/i;
const BULLET_PREFIX = /^[•\-*]\s+/;
const ALL_CAPS_HEADING = /^[A-Z0-9][A-Z0-9 .,:&'\-/()]{2,}$/;

/**
 * Group text items into lines based on their PDF y-coordinate (transform[5]).
 * Items within ~2 PDF points of one another are treated as the same line.
 */
export function extractLinesFromItems(items: RawTextItem[]): PageLines["linesWithHeights"] {
  if (items.length === 0) return [];

  // Sort top-to-bottom (larger y first) then left-to-right.
  const sorted = [...items].sort((a, b) => {
    const yDelta = b.transform[5] - a.transform[5];
    if (Math.abs(yDelta) > 2) return yDelta;
    return a.transform[4] - b.transform[4];
  });

  const lines: { text: string; height: number }[] = [];
  let currentY = sorted[0].transform[5];
  let currentParts: string[] = [];
  let currentMaxHeight = 0;

  const flush = () => {
    const text = currentParts.join(" ").replace(/\s+/g, " ").trim();
    if (text.length > 0) {
      lines.push({ text, height: currentMaxHeight });
    }
    currentParts = [];
    currentMaxHeight = 0;
  };

  for (const item of sorted) {
    const y = item.transform[5];
    if (Math.abs(y - currentY) > 2) {
      flush();
      currentY = y;
    }
    if (item.str.trim().length > 0) {
      currentParts.push(item.str);
      if (item.height && item.height > currentMaxHeight) {
        currentMaxHeight = item.height;
      }
    }
  }
  flush();
  return lines;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Render structured page lines to a single markdown string. Applies the
 * heuristics:
 *  - All-caps short lines OR lines with font height noticeably larger than
 *    the page median → H2
 *  - Lines matching a section-label regex (e.g., "A.", "1.2.3") → H3
 *  - Lines starting with •, -, or * → markdown bullets
 *  - Other lines → paragraph text
 *  - Page breaks render as horizontal rules between pages.
 */
export function formatLinesToMarkdown(pages: PageLines[]): string {
  const out: string[] = [];

  pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) {
      out.push("");
      out.push("---");
      out.push("");
    }

    for (const { text, height } of page.linesWithHeights) {
      if (text.length === 0) continue;
      const isShort = text.length <= 80;
      const looksLikeHeading =
        height > 0 && page.medianHeight > 0 && height >= page.medianHeight * 1.25;
      const isAllCaps = isShort && ALL_CAPS_HEADING.test(text) && !text.endsWith(".");

      if (looksLikeHeading && isShort) {
        out.push(`## ${text}`);
        out.push("");
        continue;
      }
      if (isAllCaps) {
        out.push(`## ${text}`);
        out.push("");
        continue;
      }
      if (SECTION_LABEL.test(text) && isShort) {
        out.push(`### ${text}`);
        out.push("");
        continue;
      }
      if (BULLET_PREFIX.test(text)) {
        out.push(`- ${text.replace(BULLET_PREFIX, "")}`);
        continue;
      }
      out.push(text);
    }
  });

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

interface PdfJsModule {
  getDocument: (options: { data: ArrayBuffer }) => { promise: Promise<PdfJsDocument> };
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
}

interface PdfJsDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
}

interface PdfJsPage {
  getTextContent: () => Promise<{ items: { str: string; transform: number[]; width: number; height?: number }[] }>;
}

let pdfjsModulePromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = (async () => {
      const pdfjs = (await import("pdfjs-dist")) as unknown as PdfJsModule;
      // pdfjs-dist v4+ requires explicit worker setup. Use CDN URL — works in
      // static export environments without bundler-specific worker plumbing.
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      return pdfjs;
    })();
  }
  return pdfjsModulePromise;
}

export async function convertPdfToMarkdown(file: File): Promise<PdfToMarkdownResult> {
  if (file.size === 0) {
    return {
      markdown: "",
      pageCount: 0,
      warnings: ["The uploaded PDF is empty."],
    };
  }

  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const warnings: string[] = [];
  const pages: PageLines[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const items: RawTextItem[] = textContent.items.map((item) => ({
      str: item.str,
      transform: item.transform,
      width: item.width,
      height: item.height,
    }));

    if (items.length === 0 || items.every((it) => it.str.trim().length === 0)) {
      warnings.push(
        `Page ${i} contained no extractable text — may be a scanned image.`,
      );
      pages.push({ pageNumber: i, lines: [], medianHeight: 0, linesWithHeights: [] });
      continue;
    }

    const linesWithHeights = extractLinesFromItems(items);
    const heights = linesWithHeights.map((l) => l.height).filter((h) => h > 0);
    pages.push({
      pageNumber: i,
      lines: linesWithHeights.map((l) => l.text),
      medianHeight: median(heights),
      linesWithHeights,
    });
  }

  const markdown = formatLinesToMarkdown(pages);

  if (markdown.trim().length === 0) {
    warnings.push(
      "This PDF appears to be image-based. Consider attaching the original PDF directly to your LLM — modern LLMs handle PDFs natively.",
    );
  }

  return {
    markdown,
    pageCount: doc.numPages,
    warnings,
  };
}
