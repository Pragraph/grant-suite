import { describe, it, expect } from "vitest";

import { detectFileStrategy } from "@/lib/form-schema";

function fakeFile(name: string, type: string): File {
  return new File([new Blob([""], { type })], name, { type });
}

describe("detectFileStrategy", () => {
  it("returns docx-embed-markdown for .docx files", () => {
    const f = fakeFile(
      "form.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(detectFileStrategy(f).kind).toBe("docx-embed-markdown");
  });

  it("returns docx-embed-markdown when MIME is missing but extension is .docx", () => {
    const f = fakeFile("form.docx", "");
    expect(detectFileStrategy(f).kind).toBe("docx-embed-markdown");
  });

  it("returns pdf-attach-to-llm for .pdf files", () => {
    const f = fakeFile("form.pdf", "application/pdf");
    expect(detectFileStrategy(f).kind).toBe("pdf-attach-to-llm");
  });

  it("returns image-attach-to-llm for PNG, JPG, WEBP", () => {
    expect(detectFileStrategy(fakeFile("a.png", "image/png")).kind).toBe(
      "image-attach-to-llm",
    );
    expect(detectFileStrategy(fakeFile("a.jpg", "image/jpeg")).kind).toBe(
      "image-attach-to-llm",
    );
    expect(detectFileStrategy(fakeFile("a.webp", "image/webp")).kind).toBe(
      "image-attach-to-llm",
    );
  });

  it("returns unsupported for unknown types", () => {
    const f = fakeFile("data.bin", "application/octet-stream");
    expect(detectFileStrategy(f).kind).toBe("unsupported");
  });
});
