import { test, expect } from "@playwright/test";

const HYDRATION_KEYWORDS = [
  "hydration",
  "cannot be a descendant",
  "cannot contain a nested",
  "did not match",
  "text content does not match",
];

test.describe("Project detail hydration safety", () => {
  test("project detail page renders project title without hydration mismatch", async ({
    page,
  }) => {
    const projectId = "test-project-detail-hydration";
    const title = "Project Detail Hydration Test";
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

    await page.goto(`/projects/${projectId}`);

    await expect(
      page.getByRole("heading", { name: title }).first(),
    ).toBeVisible();

    const offenders = [...consoleErrors, ...pageErrors].filter((msg) =>
      HYDRATION_KEYWORDS.some((kw) => msg.toLowerCase().includes(kw)),
    );
    expect(
      offenders,
      `Project detail page produced hydration / DOM-nesting errors:\n${offenders.join("\n---\n")}`,
    ).toEqual([]);
  });
});
