import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("JalChhaya WCAG 2.2 AA Accessibility & Responsiveness", () => {
  test("loads landing view without horizontal overflow and passes Axe audit without disabling color contrast", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

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

    // Axe automated accessibility scan with full WCAG 2.2 AA rules including color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalOrSerious).toEqual([]);

    // Verify zero uncaught browser exceptions
    expect(pageErrors).toEqual([]);
  });

  test("switches languages cleanly between English, Marathi, and Hindi", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch to Marathi
    const mrButton = page.getByRole("button", { name: "मराठी" });
    await mrButton.click();
    await expect(page.locator("body")).toContainText("पुणे नागरी दिलासा नकाशा");

    // Switch to Hindi
    const hiButton = page.getByRole("button", { name: "हिंदी" });
    await hiButton.click();
    await expect(page.locator("body")).toContainText("पुणे नागरिक राहत एटलस");

    // Switch back to English using exact name to prevent substring collisions
    const enButton = page.getByRole("button", { name: "EN", exact: true });
    await enButton.click();
    await expect(page.locator("body")).toContainText("Pune Civic Heat-Relief Atlas");
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

    // Close drawer via Escape key (testing keyboard trap & escape handler)
    await page.keyboard.press("Escape");
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

  test("supports accessible keyboard traversal and skip link navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Tab into page
    await page.keyboard.press("Tab");
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeFocused();

    // Activate skip link
    await page.keyboard.press("Enter");
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });

  test("toggles data source mode between LIVE and DEMO transparently", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const modeBtn = page.getByRole("button", { name: /Mode:/i });
    await expect(modeBtn).toBeVisible();

    // Toggle
    await modeBtn.click();
    await expect(page.locator("body")).toContainText(/Demonstration Scenario|Live Verified Mode/);
  });
});
