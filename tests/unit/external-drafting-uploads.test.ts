import { describe, it, expect, beforeEach, vi } from "vitest";

const idbStore = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
  get: vi.fn((key: string) => Promise.resolve(idbStore.get(key))),
  set: vi.fn((key: string, value: unknown) => {
    idbStore.set(key, value);
    return Promise.resolve();
  }),
  del: vi.fn((key: string) => {
    idbStore.delete(key);
    return Promise.resolve();
  }),
  keys: vi.fn(() => Promise.resolve([...idbStore.keys()])),
  clear: vi.fn(() => {
    idbStore.clear();
    return Promise.resolve();
  }),
}));

let idCounter = 0;
vi.mock("nanoid", () => ({
  nanoid: () => `mocked-id-${++idCounter}`,
}));

import {
  saveCompletedDraft,
  listCompletedDrafts,
  getCompletedDraftBlob,
  deleteCompletedDraft,
  clearCompletedDrafts,
  deriveKindFromFilename,
} from "@/lib/external-drafting/uploads";

function makeFile(name: string, body = "content"): File {
  return new File([body], name, { type: "application/octet-stream" });
}

describe("deriveKindFromFilename", () => {
  it("identifies .docx as docx", () => {
    expect(deriveKindFromFilename("Draft.docx")).toBe("docx");
    expect(deriveKindFromFilename("DRAFT.DOCX")).toBe("docx");
  });

  it("identifies .md and .markdown as md", () => {
    expect(deriveKindFromFilename("draft.md")).toBe("md");
    expect(deriveKindFromFilename("Draft.markdown")).toBe("md");
  });

  it("returns null for unknown extensions", () => {
    expect(deriveKindFromFilename("draft.pdf")).toBeNull();
    expect(deriveKindFromFilename("draft")).toBeNull();
  });
});

describe("completed draft storage", () => {
  beforeEach(() => {
    idbStore.clear();
    idCounter = 0;
  });

  it("saves a draft and lists it with version 1", async () => {
    const meta = await saveCompletedDraft("proj-1", makeFile("draft.docx"), "docx", {
      now: new Date("2026-05-13T10:00:00Z"),
    });
    expect(meta.version).toBe(1);
    expect(meta.filename).toBe("draft.docx");
    expect(meta.uploadedAt).toBe("2026-05-13T10:00:00.000Z");

    const list = await listCompletedDrafts("proj-1");
    expect(list).toHaveLength(1);
    expect(list[0].filename).toBe("draft.docx");
  });

  it("auto-increments version per kind so DOCX and MD are versioned independently", async () => {
    await saveCompletedDraft("proj-1", makeFile("a.docx"), "docx");
    const second = await saveCompletedDraft("proj-1", makeFile("b.docx"), "docx");
    const firstMd = await saveCompletedDraft("proj-1", makeFile("notes.md"), "md");

    expect(second.version).toBe(2);
    expect(firstMd.version).toBe(1);

    const list = await listCompletedDrafts("proj-1");
    const docxList = list.filter((d) => d.kind === "docx");
    expect(docxList.map((d) => d.version)).toEqual([2, 1]);
  });

  it("scopes uploads to a project — other projects don't see them", async () => {
    await saveCompletedDraft("proj-1", makeFile("a.docx"), "docx");
    await saveCompletedDraft("proj-2", makeFile("b.docx"), "docx");

    const first = await listCompletedDrafts("proj-1");
    const second = await listCompletedDrafts("proj-2");
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(first[0].projectId).toBe("proj-1");
    expect(second[0].projectId).toBe("proj-2");
  });

  it("returns the underlying blob when fetched by id", async () => {
    const meta = await saveCompletedDraft("proj-1", makeFile("draft.docx", "hello"), "docx");
    const record = await getCompletedDraftBlob("proj-1", meta.id);
    expect(record).not.toBeNull();
    const text = await record!.blob.text();
    expect(text).toBe("hello");
  });

  it("deletes a single draft by id without removing siblings", async () => {
    const first = await saveCompletedDraft("proj-1", makeFile("a.docx"), "docx");
    await saveCompletedDraft("proj-1", makeFile("b.docx"), "docx");

    await deleteCompletedDraft("proj-1", first.id);
    const list = await listCompletedDrafts("proj-1");
    expect(list).toHaveLength(1);
    expect(list[0].filename).toBe("b.docx");
  });

  it("clears all drafts for a project on reset", async () => {
    await saveCompletedDraft("proj-1", makeFile("a.docx"), "docx");
    await saveCompletedDraft("proj-1", makeFile("notes.md"), "md");
    await saveCompletedDraft("proj-2", makeFile("other.docx"), "docx");

    await clearCompletedDrafts("proj-1");

    expect(await listCompletedDrafts("proj-1")).toEqual([]);
    expect(await listCompletedDrafts("proj-2")).toHaveLength(1);
  });
});
