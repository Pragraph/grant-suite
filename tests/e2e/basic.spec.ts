import { test, expect } from "@playwright/test";

test.describe("Basic navigation", () => {
  test("landing page loads with expected content", async ({ page }) => {
    await page.goto("/");
    // The landing page should render the app title / heading
    await expect(page.locator("h1").first()).toBeVisible();
    // Should have a CTA to projects (button or link — landing uses <button> with window.location.assign)
    const cta = page
      .getByRole("button", { name: /get started|projects|dashboard|start now/i })
      .or(page.getByRole("link", { name: /get started|projects|dashboard|start now/i }))
      .first();
    await expect(cta).toBeVisible();
  });

  test("can navigate to /projects", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects/);
    // Should show projects page content
    await expect(page.getByText(/project/i).first()).toBeVisible();
  });

  test("can open create project flow", async ({ page }) => {
    await page.goto("/projects");
    // Click the "New Project" button
    const newProjectBtn = page.getByRole("button", { name: /new project/i });
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();
    // Should open a drawer/dialog with a form
    await expect(
      page.getByRole("textbox").first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
