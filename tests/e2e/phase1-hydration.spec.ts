import { test, expect } from "@playwright/test";

const HYDRATION_KEYWORDS = [
  "hydration",
  "cannot be a descendant",
  "cannot contain a nested",
];

test.describe("Phase 1 hydration safety", () => {
  test("step header renders without hydration errors and shows Multi-method badge", async ({
    page,
  }) => {
    const projectId = "test-phase1-hydration";
    const now = new Date().toISOString();
    const seededProject = {
      id: projectId,
      title: "Phase 1 Hydration Test",
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

    await page.goto(`/projects/${projectId}/phase/1`);

    await expect(
      page.getByText("Multi-method", { exact: true }).first(),
    ).toBeVisible();

    const offenders = [...consoleErrors, ...pageErrors].filter((msg) =>
      HYDRATION_KEYWORDS.some((kw) => msg.toLowerCase().includes(kw)),
    );
    expect(
      offenders,
      `Phase 1 page produced hydration / DOM-nesting errors:\n${offenders.join("\n---\n")}`,
    ).toEqual([]);
  });
});
