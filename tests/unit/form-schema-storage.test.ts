import { describe, it, expect, beforeEach, vi } from "vitest";
import getFixture from "./fixtures/form-schema-get.json";
import type { FormSchema } from "@/lib/form-schema";

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

import {
  saveFormSchema,
  loadFormSchema,
  deleteFormSchema,
  hasFormSchema,
  saveFormFile,
  loadFormFiles,
  deleteFormFile,
  deleteAllFormFiles,
} from "@/lib/form-schema/storage";

beforeEach(() => {
  idbStore.clear();
});

describe("Form Schema storage — schema persistence", () => {
  const schema = getFixture as unknown as FormSchema;

  it("hasFormSchema returns false before save", async () => {
    expect(await hasFormSchema("proj-1")).toBe(false);
  });

  it("save then load round-trips the schema", async () => {
    await saveFormSchema("proj-1", schema);
    const loaded = await loadFormSchema("proj-1");
    expect(loaded).not.toBeNull();
    expect(loaded?.schema_version).toBe("1.0");
    expect(loaded?.form_metadata.form_id).toBe(schema.form_metadata.form_id);
  });

  it("hasFormSchema returns true after save", async () => {
    await saveFormSchema("proj-1", schema);
    expect(await hasFormSchema("proj-1")).toBe(true);
  });

  it("deleteFormSchema removes the schema", async () => {
    await saveFormSchema("proj-1", schema);
    await deleteFormSchema("proj-1");
    expect(await hasFormSchema("proj-1")).toBe(false);
    expect(await loadFormSchema("proj-1")).toBeNull();
  });

  it("schemas are isolated per project", async () => {
    await saveFormSchema("proj-1", schema);
    expect(await hasFormSchema("proj-2")).toBe(false);
    await deleteFormSchema("proj-1");
    expect(await hasFormSchema("proj-2")).toBe(false);
  });
});

describe("Form Schema storage — form files", () => {
  it("save and load a single form file", async () => {
    const blob = new Blob(["%PDF-1.4 hello"], { type: "application/pdf" });
    const file = new File([blob], "form.pdf", { type: "application/pdf" });
    await saveFormFile("proj-1", file);
    const files = await loadFormFiles("proj-1");
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe("form.pdf");
    expect(files[0].mimeType).toBe("application/pdf");
    expect(files[0].size).toBe(file.size);
  });

  it("multiple files per project load back in upload order", async () => {
    const f1 = new File(["a"], "page1.png", { type: "image/png" });
    const f2 = new File(["b"], "page2.png", { type: "image/png" });
    await saveFormFile("proj-1", f1);
    await new Promise((r) => setTimeout(r, 2));
    await saveFormFile("proj-1", f2);
    const files = await loadFormFiles("proj-1");
    expect(files.map((f) => f.filename)).toEqual(["page1.png", "page2.png"]);
  });

  it("files are isolated per project", async () => {
    const f1 = new File(["a"], "form.pdf", { type: "application/pdf" });
    await saveFormFile("proj-1", f1);
    expect((await loadFormFiles("proj-2")).length).toBe(0);
  });

  it("deleteFormFile removes the named file", async () => {
    const f = new File(["a"], "form.pdf", { type: "application/pdf" });
    await saveFormFile("proj-1", f);
    await deleteFormFile("proj-1", "form.pdf");
    expect((await loadFormFiles("proj-1")).length).toBe(0);
  });

  it("deleteAllFormFiles wipes only the named project", async () => {
    await saveFormFile("proj-1", new File(["a"], "a.pdf", { type: "application/pdf" }));
    await saveFormFile("proj-1", new File(["b"], "b.pdf", { type: "application/pdf" }));
    await saveFormFile("proj-2", new File(["c"], "c.pdf", { type: "application/pdf" }));
    await deleteAllFormFiles("proj-1");
    expect((await loadFormFiles("proj-1")).length).toBe(0);
    expect((await loadFormFiles("proj-2")).length).toBe(1);
  });
});
