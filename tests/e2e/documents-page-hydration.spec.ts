import { test, expect } from "@playwright/test";

const HYDRATION_KEYWORDS = [
  "hydration",
  "cannot be a descendant",
  "cannot contain a nested",
  "did not match",
  "text content does not match",
];

test.describe("Documents page hydration safety", () => {
  test("documents page renders project title without hydration mismatch", async ({
    page,
  }) => {
    const projectId = "test-documents-hydration";
    const title = "Documents Hydration Test";
    const now = new Date().toISOString();
    const seededProject = {
      id: projectId,
      title,
      discipline: "Computer Science",
      country: "Malaysia",
      careerStage: "PhD",
      currentPhase: 1,
      currentStep: 1,
      status: "active" as const,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    await page.addInitScript((project) => {
      window.localStorage.setItem(
        "grant-suite-projects",
        JSON.stringify([project]),
      );
    }, seededProject);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto(`/projects/${projectId}/documents`);

    await expect(
      page.getByRole("heading", { name: "Documents", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible();

    const offenders = [...consoleErrors, ...pageErrors].filter((msg) =>
      HYDRATION_KEYWORDS.some((kw) => msg.toLowerCase().includes(kw)),
    );
    expect(
      offenders,
      `Documents page produced hydration / DOM-nesting errors:\n${offenders.join("\n---\n")}`,
    ).toEqual([]);
  });
});
