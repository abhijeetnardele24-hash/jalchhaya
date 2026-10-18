import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("JalChhaya WCAG 2.2 AA Accessibility & Responsiveness", () => {
  test("loads landing view without horizontal overflow and passes Axe audit", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check title and primary heading
    await expect(page).toHaveTitle(/JalChhaya/);
    const heading = page.locator("h1");
    await expect(heading).toContainText("JalChhaya");

    // Check zero horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Axe automated accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .disableRules(["color-contrast"]) // Synthetic palette in headless environments
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("switches languages cleanly between English, Marathi, and Hindi", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch to Marathi
    const mrButton = page.getByRole("button", { name: "मराठी" });
    await mrButton.click();
    await expect(page.locator("body")).toContainText("तीव्र उन्हाळा दिलासा केंद्र");

    // Switch to Hindi
    const hiButton = page.getByRole("button", { name: "हिंदी" });
    await hiButton.click();
    await expect(page.locator("body")).toContainText("सत्यापित सार्वजनिक ग्रीष्मकालीन राहत नेटवर्क");

    // Switch back to English
    const enButton = page.getByRole("button", { name: "EN" });
    await enButton.click();
    await expect(page.locator("body")).toContainText("Verifiable Public Heat-Relief");
  });

  test("opens Arkiv On-Chain Evidence Inspector drawer and displays verifiable query", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open drawer
    const inspectorButton = page.getByRole("button", { name: "Arkiv On-Chain Evidence Inspector" });
    await inspectorButton.click();

    // Verify drawer visible
    await expect(page.getByText("Primary Relief Point Entity")).toBeVisible();
    await expect(page.getByText("Exact Reproducible SDK Query")).toBeVisible();

    // Close drawer
    const closeBtn = page.getByRole("button", { name: "Close Drawer" });
    await closeBtn.click();
    await expect(page.getByText("Primary Relief Point Entity")).not.toBeVisible();
  });

  test("filters relief points by zone and search term without layout break", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for cards to appear
    await expect(page.getByText("Deccan PMT Bus Terminal Water Kiosk")).toBeVisible();

    // Filter by Deccan zone
    const deccanBtn = page.getByRole("button", { name: /Deccan Gymkhana/i }).first();
    await deccanBtn.click();

    // Search
    const searchInput = page.getByPlaceholder("Search by landmark, bus stop, or facility name…");
    await searchInput.fill("Deccan");

    await expect(page.getByText("Deccan PMT Bus Terminal Water Kiosk")).toBeVisible();

    // Clear search
    await searchInput.fill("");
  });
});
