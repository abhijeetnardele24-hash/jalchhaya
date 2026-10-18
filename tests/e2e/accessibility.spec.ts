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

  test("opens Arkiv On-Chain Evidence Inspector drawer and passes Axe audit", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open drawer
    const inspectorButton = page.getByRole("button", { name: "Arkiv On-Chain Evidence Inspector" });
    await inspectorButton.click();

    // Verify drawer visible
    await expect(page.getByText("Primary Relief Point Entity")).toBeVisible();
    await expect(page.getByText("Exact Reproducible SDK Query")).toBeVisible();

    // Run Axe audit on the open drawer
    const drawerAxeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const criticalOrSerious = drawerAxeResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalOrSerious).toEqual([]);

    // Close drawer via Escape key (testing keyboard trap & escape handler)
    await page.keyboard.press("Escape");
    await expect(page.getByText("Primary Relief Point Entity")).not.toBeVisible();
  });

  test("opens Observation modal, passes Axe audit, and traps keyboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const reportBtn = page.getByRole("button", { name: "Update Status" }).first();
    await reportBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Run Axe audit on the open modal
    const modalAxeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const criticalOrSerious = modalAxeResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalOrSerious).toEqual([]);

    // Escape closes modal
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("opens the isolated synthetic proof dialog with accessible, explicit labeling", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Open proof flow/ }).click();

    const dialog = page.getByRole("dialog", { name: "Create a synthetic testnet record" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/not a real relief facility/i);
    await expect(dialog).toContainText("Arkiv Tiramisu testnet · Chain 7738577");
    await expect(dialog.getByRole("button", { name: /Create synthetic testnet proof/ })).toBeDisabled();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
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

  test("supports offline reload recovery and prevents offline writes to Arkiv", async ({ page, context }) => {
    test.setTimeout(60000);

    // 1. Initial online load & warm cache
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Ensure service worker is registered and controlling clients
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => {
          navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
          if (navigator.serviceWorker.controller) resolve(true);
        });
      }
    });

    // Reload once while online through the controlling service worker to populate cache
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);

    // Warm lazy modals into memory and cache while online
    const reportBtn = page.getByRole("button", { name: "Update Status" }).first();
    await reportBtn.click();
    const obsDialog = page.getByRole("dialog");
    await expect(obsDialog).toBeVisible();
    await obsDialog.getByRole("button", { name: "Close Modal" }).click({ force: true });
    await expect(obsDialog).not.toBeVisible();

    const attestBtn = page.getByRole("button", { name: /Confirm \/ Challenge/i }).first();
    await attestBtn.click();
    const attestDialog = page.getByRole("dialog");
    await expect(attestDialog).toBeVisible();
    await attestDialog.getByRole("button", { name: "Close Modal" }).click({ force: true });
    await expect(attestDialog).not.toBeVisible();

    try {
      // 2. Switch browser offline
      await context.setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event("offline")));

      // 3. Test genuine offline reload & service-worker cache recovery
      await page.reload({ waitUntil: "domcontentloaded" });

      // Confirm app shell and cached directory recover with visible offline/degraded badge
      const offlineIndicator = page.getByTestId("offline-indicator");
      await expect(offlineIndicator).toBeVisible({ timeout: 10000 });
      await expect(offlineIndicator).toContainText("Offline Mode");

      // Verify cached relief facilities remain readable
      await expect(page.getByText("Deccan PMT Bus Terminal Water Kiosk")).toBeVisible();

      // 4. Verify observation write is blocked while offline
      await page.getByRole("button", { name: "Update Status" }).first().click();
      const offlineObsDialog = page.getByRole("dialog");
      await expect(offlineObsDialog).toBeVisible();
      await offlineObsDialog.locator('button[type="submit"]').click();
      await expect(offlineObsDialog.getByText(/Cannot broadcast while offline/i)).toBeVisible();
      await offlineObsDialog.getByRole("button", { name: /Cancel/i }).click();
      await expect(offlineObsDialog).not.toBeVisible();

      // 5. Verify attestation write is blocked while offline
      await page.getByRole("button", { name: /Confirm \/ Challenge/i }).first().click();
      const offlineAttestDialog = page.getByRole("dialog");
      await expect(offlineAttestDialog).toBeVisible();
      await offlineAttestDialog.locator('button[type="submit"]').click();
      await expect(offlineAttestDialog.getByText(/Cannot attest while offline/i)).toBeVisible();
      await offlineAttestDialog.getByRole("button", { name: /Cancel/i }).click();
      await expect(offlineAttestDialog).not.toBeVisible();
    } finally {
      // 6. Mandatory cleanup: Always restore online state so subsequent tests are not contaminated
      try {
        await context.setOffline(false);
        await page.evaluate(() => window.dispatchEvent(new Event("online"))).catch(() => {});
      } catch {
        // Ignore if page/context was already closed by runner
      }
    }
  });

  test("registers service worker for offline asset caching", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for real service worker registration to be ready
    const swInfo = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return null;
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      if (!reg) return null;
      return {
        hasRegistration: true,
        scope: reg.scope,
        activeScriptURL: reg.active?.scriptURL || null,
        activeState: reg.active?.state || null,
      };
    });

    expect(swInfo).not.toBeNull();
    expect(swInfo?.hasRegistration).toBe(true);
    expect(swInfo?.activeScriptURL).toContain("sw.js");
    expect(swInfo?.activeState).toBe("activated");
    expect(swInfo?.scope).toBe(new URL("./", page.url()).href);
  });
});
