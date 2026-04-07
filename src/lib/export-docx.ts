import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
  ShadingType,
  LevelFormat,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

interface ExportOptions {
  title: string;
  grantName: string;
  discipline: string;
  content: string;
}

/**
 * Parse inline markdown formatting into TextRun objects.
 * Handles: **bold**, *italic*, [CITATION NEEDED] (yellow), [USER INPUT NEEDED] (blue)
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex =
    /(\*\*[^*]+\*\*|\*[^*]+\*|\[CITATION NEEDED[^\]]*\]|\[USER INPUT NEEDED[^\]]*\])/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({
          text: text.slice(lastIndex, match.index),
          font: "Arial",
          size: 22,
        }),
      );
    }

    const segment = match[0];

    if (segment.startsWith("**") && segment.endsWith("**")) {
      runs.push(
        new TextRun({
          text: segment.slice(2, -2),
          bold: true,
          font: "Arial",
          size: 22,
        }),
      );
    } else if (segment.startsWith("*") && segment.endsWith("*")) {
      runs.push(
        new TextRun({
          text: segment.slice(1, -1),
          italics: true,
          font: "Arial",
          size: 22,
        }),
      );
    } else if (segment.startsWith("[CITATION NEEDED")) {
      runs.push(
        new TextRun({
          text: segment,
          font: "Arial",
          size: 22,
          shading: { type: ShadingType.CLEAR, fill: "FFFF00" },
          bold: true,
        }),
      );
    } else if (segment.startsWith("[USER INPUT NEEDED")) {
      runs.push(
        new TextRun({
          text: segment,
          font: "Arial",
          size: 22,
          shading: { type: ShadingType.CLEAR, fill: "B3D9FF" },
          bold: true,
        }),
      );
    }

    lastIndex = match.index + segment.length;
  }

  if (lastIndex < text.length) {
    runs.push(
      new TextRun({
        text: text.slice(lastIndex),
        font: "Arial",
        size: 22,
      }),
    );
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text, font: "Arial", size: 22 }));
  }

  return runs;
}

/**
 * Parse a markdown table into a docx Table object.
 * Expects lines in the format:
 *   | Header 1 | Header 2 | Header 3 |
 *   |----------|----------|----------|
 *   | Cell 1   | Cell 2   | Cell 3   |
 */
function parseMarkdownTable(lines: string[]): Table {
  const parseRow = (line: string): string[] =>
    line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

  const headerCells = parseRow(lines[0]);
  const dataRows = lines.slice(2).map(parseRow); // Skip separator line (index 1)

  const columnCount = headerCells.length;

  // Calculate even column widths (total page width minus margins ≈ 9026 twips for A4)
  const colWidth = Math.floor(9026 / columnCount);

  const createCell = (text: string, isHeader: boolean): TableCell =>
    new TableCell({
      width: { size: colWidth, type: WidthType.DXA },
      shading: isHeader
        ? { type: ShadingType.CLEAR, fill: "E8EDF5" }
        : undefined,
      children: [
        new Paragraph({
          children: parseInlineFormatting(text),
          spacing: { before: 40, after: 40 },
        }),
      ],
    });

  const headerRow = new TableRow({
    children: headerCells.map((cell) => createCell(cell, true)),
    tableHeader: true,
  });

  const bodyRows = dataRows
    .filter((row) => row.length > 0)
    .map(
      (row) =>
        new TableRow({
          children: Array.from({ length: columnCount }, (_, i) =>
            createCell(row[i] || "", false),
          ),
        }),
    );

  return new Table({
    rows: [headerRow, ...bodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Detect if a line is a markdown table row (starts and ends with |)
 */
function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

/**
 * Detect if a line is a table separator (| --- | --- |)
 */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  return /^\|[\s\-:|]+\|$/.test(trimmed);
}

/**
 * Parse a markdown string into an array of docx Paragraph and Table objects.
 * Handles: H1-H3, paragraphs, bold, italic, bullet lists, numbered lists,
 * horizontal rules, tables, blockquotes, and fenced code blocks.
 */
function parseMarkdownToDocx(markdown: string): (Paragraph | Table)[] {
  const lines = markdown.split("\n");
  const elements: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // ── Table detection ─────────────────────────────────────────────
    if (
      isTableRow(trimmed) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1].trim())
    ) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        elements.push(parseMarkdownTable(tableLines));
        elements.push(new Paragraph({ spacing: { before: 100, after: 100 } }));
      }
      continue;
    }

    // ── Blockquote ──────────────────────────────────────────────────
    if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.slice(2);
      elements.push(
        new Paragraph({
          children: parseInlineFormatting(quoteText),
          indent: { left: 720 },
          spacing: { before: 60, after: 60 },
          border: {
            left: {
              style: BorderStyle.SINGLE,
              size: 3,
              color: "4F7DF3",
              space: 10,
            },
          },
        }),
      );
      i++;
      continue;
    }

    // ── Code block (fenced) ─────────────────────────────────────────
    if (trimmed.startsWith("```")) {
      i++; // skip opening fence
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing fence

      elements.push(
        new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
          spacing: { before: 100, after: 100 },
          children: codeLines.map(
            (line, idx) =>
              new TextRun({
                text: line + (idx < codeLines.length - 1 ? "\n" : ""),
                font: "JetBrains Mono",
                size: 18,
              }),
          ),
        }),
      );
      continue;
    }

    // ── Horizontal rule ─────────────────────────────────────────────
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      elements.push(
        new Paragraph({
          spacing: { before: 200, after: 200 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          },
        }),
      );
      i++;
      continue;
    }

    // ── Headings ────────────────────────────────────────────────────
    if (trimmed.startsWith("### ")) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: parseInlineFormatting(trimmed.slice(4)),
          spacing: { before: 200, after: 100 },
        }),
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: parseInlineFormatting(trimmed.slice(3)),
          spacing: { before: 240, after: 120 },
        }),
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: parseInlineFormatting(trimmed.slice(2)),
          spacing: { before: 360, after: 200 },
        }),
      );
      i++;
      continue;
    }

    // ── Bullet lists ────────────────────────────────────────────────
    if (/^[-*]\s/.test(trimmed)) {
      elements.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseInlineFormatting(trimmed.replace(/^[-*]\s+/, "")),
          spacing: { before: 40, after: 40 },
        }),
      );
      i++;
      continue;
    }

    // ── Numbered lists ──────────────────────────────────────────────
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        new Paragraph({
          numbering: { level: 0, reference: "default-numbering" },
          children: parseInlineFormatting(numMatch[2]),
          spacing: { before: 40, after: 40 },
        }),
      );
      i++;
      continue;
    }

    // ── Regular paragraph ───────────────────────────────────────────
    elements.push(
      new Paragraph({
        children: parseInlineFormatting(trimmed),
        spacing: { before: 60, after: 60 },
      }),
    );
    i++;
  }

  return elements;
}

/**
 * Export the assembled proposal as a DOCX file.
 */
export async function exportProposalAsDocx(
  options: ExportOptions,
): Promise<void> {
  const { title, content } = options;
  const bodyParagraphs = parseMarkdownToDocx(content);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22 },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: "1F3864" },
          paragraph: {
            spacing: { before: 360, after: 200 },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: "2E5090" },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Arial" },
          paragraph: {
            spacing: { before: 200, after: 100 },
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: title,
                    font: "Arial",
                    size: 16,
                    color: "888888",
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Arial",
                    size: 16,
                    color: "888888",
                  }),
                ],
              }),
            ],
          }),
        },
        children: bodyParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${title.replace(/\s+/g, "-").toLowerCase()}-proposal.docx`;
  saveAs(blob, filename);
}
