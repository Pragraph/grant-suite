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
 * Parse a markdown string into an array of docx Paragraph objects.
 * Handles: H1-H3, paragraphs, bold, italic, bullet lists, numbered lists, horizontal rules.
 */
function parseMarkdownToDocx(markdown: string): Paragraph[] {
  const lines = markdown.split("\n");
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) continue;

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 200 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          },
        }),
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: parseInlineFormatting(trimmed.slice(4)),
          spacing: { before: 200, after: 100 },
        }),
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: parseInlineFormatting(trimmed.slice(3)),
          spacing: { before: 240, after: 120 },
        }),
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: parseInlineFormatting(trimmed.slice(2)),
          spacing: { before: 360, after: 200 },
        }),
      );
      continue;
    }

    // Bullet lists
    if (/^[-*]\s/.test(trimmed)) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseInlineFormatting(trimmed.replace(/^[-*]\s+/, "")),
          spacing: { before: 40, after: 40 },
        }),
      );
      continue;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      paragraphs.push(
        new Paragraph({
          numbering: { level: 0, reference: "default-numbering" },
          children: parseInlineFormatting(numMatch[2]),
          spacing: { before: 40, after: 40 },
        }),
      );
      continue;
    }

    // Regular paragraph
    paragraphs.push(
      new Paragraph({
        children: parseInlineFormatting(trimmed),
        spacing: { before: 60, after: 60 },
      }),
    );
  }

  return paragraphs;
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
