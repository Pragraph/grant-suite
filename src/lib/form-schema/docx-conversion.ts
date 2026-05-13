// DOCX → markdown conversion for Pass 1 prompt embedding (v21-R1.2).
// Design: phase5-rebuild-03-multipass-architecture.md "DOCX upload support".
// Parser inventory: convertDocxToMarkdown, detectFileStrategy.
//
// The browser bundle of mammoth accepts an arrayBuffer. Turndown adds GFM table
// preservation so budget/team tables survive the markdown round-trip.

import mammoth from "mammoth";
import TurndownService from "turndown";

export interface DocxConversionResult {
  markdown: string;
  warnings: string[];
}

export type FileStrategy =
  | { kind: "docx-embed-markdown" }
  | { kind: "pdf-attach-to-llm" }
  | { kind: "image-attach-to-llm" }
  | { kind: "unsupported" };

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOCX_LEGACY_MIME = "application/msword";
const PDF_MIME = "application/pdf";
const IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp"]);

export async function convertDocxToMarkdown(file: File | Blob): Promise<DocxConversionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });
  addTableSupport(td);
  const markdown = td.turndown(result.value);
  const warnings = result.messages.map((m) => m.message);
  return { markdown, warnings };
}

export function detectFileStrategy(file: File): FileStrategy {
  const mime = file.type;
  const ext = extensionOf(file.name);

  if (mime === DOCX_MIME || mime === DOCX_LEGACY_MIME || ext === "docx") {
    return { kind: "docx-embed-markdown" };
  }
  if (mime === PDF_MIME || ext === "pdf") {
    return { kind: "pdf-attach-to-llm" };
  }
  if (IMAGE_MIMES.has(mime) || IMAGE_EXTS.has(ext)) {
    return { kind: "image-attach-to-llm" };
  }
  return { kind: "unsupported" };
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot + 1).toLowerCase();
}

// Turndown handles tables via a plugin in turndown-plugin-gfm. We avoid the extra
// dependency by registering minimal table rules inline. They preserve
// `|col|col|` table syntax with header separator rows.
function addTableSupport(td: TurndownService): void {
  td.addRule("tableCell", {
    filter: ["th", "td"],
    replacement(content, node) {
      const cellText = content.replace(/\n+/g, " ").replace(/\|/g, "\\|").trim();
      const isFirstCell = !node.previousSibling;
      return `${isFirstCell ? "| " : ""}${cellText} | `;
    },
  });
  td.addRule("tableRow", {
    filter: "tr",
    replacement(content, node) {
      const trimmed = content.trimEnd();
      const element = node as HTMLTableRowElement;
      const cellCount = element.querySelectorAll("th, td").length;
      const isHeaderRow = !!element.querySelector("th");
      const separator = isHeaderRow
        ? "\n|" + " --- |".repeat(cellCount)
        : "";
      return `${trimmed}${separator}\n`;
    },
  });
  td.addRule("table", {
    filter: "table",
    replacement(content) {
      return `\n\n${content.trim()}\n\n`;
    },
  });
  td.addRule("thead", {
    filter: ["thead", "tbody", "tfoot"],
    replacement(content) {
      return content;
    },
  });
}
