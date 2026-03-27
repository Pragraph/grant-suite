"use client";

import { useCallback } from "react";
import { saveAs } from "file-saver";
import {
  Download,
  FileText,
  FileType,
  Clipboard,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DocumentExporterProps {
  content: string;
  filename: string;
  projectTitle?: string;
}

// ─── Markdown → docx helpers ────────────────────────────────────────────────

function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Handle bold+italic, bold, italic patterns
  const inlineRe =
    /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRe.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }

    if (match[2]) {
      // ***bold italic***
      runs.push(new TextRun({ text: match[2], bold: true, italics: true }));
    } else if (match[3]) {
      // **bold**
      runs.push(new TextRun({ text: match[3], bold: true }));
    } else if (match[4]) {
      // *italic*
      runs.push(new TextRun({ text: match[4], italics: true }));
    } else if (match[5]) {
      // __bold__
      runs.push(new TextRun({ text: match[5], bold: true }));
    } else if (match[6]) {
      // _italic_
      runs.push(new TextRun({ text: match[6], italics: true }));
    } else if (match[7]) {
      // `code`
      runs.push(
        new TextRun({ text: match[7], font: "Courier New", size: 20 })
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

function parseMarkdownTable(lines: string[]): Table | null {
  if (lines.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && !c.match(/^[-:]+$/));

  const headerCells = parseRow(lines[0]);
  if (headerCells.length === 0) return null;

  // Skip separator line (index 1)
  const dataRows = lines.slice(2).map(parseRow);

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "999999",
  };
  const borders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const rows = [
    new TableRow({
      children: headerCells.map(
        (cell) =>
          new TableCell({
            borders,
            width: { size: Math.floor(9000 / headerCells.length), type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: cell, bold: true, size: 20 })],
              }),
            ],
          })
      ),
    }),
    ...dataRows
      .filter((row) => row.length > 0)
      .map(
        (row) =>
          new TableRow({
            children: headerCells.map(
              (_, i) =>
                new TableCell({
                  borders,
                  width: { size: Math.floor(9000 / headerCells.length), type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: parseInlineFormatting(row[i] ?? ""),
                    }),
                  ],
                })
            ),
          })
      ),
  ];

  return new Table({ rows, width: { size: 9000, type: WidthType.DXA } });
}

type DocxElement = Paragraph | Table;

function markdownToDocxElements(markdown: string): DocxElement[] {
  const elements: DocxElement[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      elements.push(
        new Paragraph({
          heading: headingMap[level] ?? HeadingLevel.HEADING_6,
          children: [
            new TextRun({
              text: headingMatch[2],
              bold: true,
            }),
          ],
        })
      );
      i++;
      continue;
    }

    // Table detection
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].match(/^\|?[\s-:|]+\|/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = parseMarkdownTable(tableLines);
      if (table) {
        elements.push(table);
      }
      continue;
    }

    // Unordered list
    if (line.match(/^\s*[-*+]\s+/)) {
      const text = line.replace(/^\s*[-*+]\s+/, "");
      elements.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseInlineFormatting(text),
        })
      );
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*(\d+)[.)]\s+(.+)/);
    if (olMatch) {
      elements.push(
        new Paragraph({
          numbering: { reference: "default-numbering", level: 0 },
          children: parseInlineFormatting(olMatch[2]),
        })
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      elements.push(
        new Paragraph({
          thematicBreak: true,
        })
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const text = line.replace(/^>\s*/, "");
      elements.push(
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text, italics: true, color: "666666" }),
          ],
        })
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      new Paragraph({
        spacing: { after: 120 },
        children: parseInlineFormatting(line),
      })
    );
    i++;
  }

  return elements;
}

async function generateDocx(
  content: string,
  filename: string,
  projectTitle?: string
): Promise<Blob> {
  const bodyElements = markdownToDocxElements(content);

  // Cover page
  const coverPage: Paragraph[] = [
    new Paragraph({ spacing: { before: 3000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: projectTitle ?? "Grant Proposal",
          bold: true,
          size: 52,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: filename.replace(/\.md$/, "").replace(/_/g, " "),
          size: 32,
          color: "666666",
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          size: 24,
          color: "999999",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Generated by Grant Suite",
          size: 20,
          color: "999999",
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      pageBreakBefore: true,
    }),
  ];

  const doc = new DocxDocument({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: "decimal" as const,
              text: "%1.",
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        children: [...coverPage, ...bodyElements],
      },
    ],
  });

  return Packer.toBlob(doc);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DocumentExporter({
  content,
  filename,
  projectTitle,
}: DocumentExporterProps) {
  const baseName = filename.replace(/\.md$/, "");

  const handleDownloadMd = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, `${baseName}.md`);
    toast.success("Downloaded as Markdown");
  }, [content, baseName]);

  const handleDownloadDocx = useCallback(async () => {
    try {
      const blob = await generateDocx(content, filename, projectTitle);
      saveAs(blob, `${baseName}.docx`);
      toast.success("Downloaded as Word document");
    } catch {
      toast.error("Failed to generate Word document");
    }
  }, [content, filename, projectTitle, baseName]);

  const handleCopyClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [content]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          <Download className="h-3.5 w-3.5" />
          Export
          <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDownloadMd}>
          <FileText className="h-4 w-4" />
          Download as .md
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadDocx}>
          <FileType className="h-4 w-4" />
          Download as .docx
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyClipboard}>
          <Clipboard className="h-4 w-4" />
          Copy to clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
