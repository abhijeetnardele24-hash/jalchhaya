import path from "node:path";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "docs", "assets");

async function capture() {
  console.log("📸 Starting automated screenshot capture for JalChhaya README...");

  // Start Vite preview server
  const previewServer = await preview({
    root: rootDir,
    preview: { port: 4173 },
  });

  const baseURL = "http://localhost:4173";
  const browser = await chromium.launch();

  try {
    // 1. Desktop View (1280x820)
    console.log("  -> Capturing Desktop Command Board View...");
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 820 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(baseURL);
    await desktopPage.waitForLoadState("networkidle");
    await desktopPage.waitForTimeout(500);

    const desktopPath = path.join(assetsDir, "screenshot-desktop-atlas.png");
    await desktopPage.screenshot({ path: desktopPath });
    console.log(`     Saved: ${desktopPath}`);

    // 2. Evidence Inspector Drawer View (1280x820)
    console.log("  -> Capturing On-Chain Evidence Inspector Drawer View...");
    const inspectorBtn = desktopPage.getByRole("button", { name: "On-Chain Evidence" }).first();
    await inspectorBtn.click();
    await desktopPage.waitForTimeout(500);

    const inspectorPath = path.join(assetsDir, "screenshot-evidence-inspector.png");
    await desktopPage.screenshot({ path: inspectorPath });
    console.log(`     Saved: ${inspectorPath}`);
    await desktopContext.close();

    // 3. Mobile View (390x844)
    console.log("  -> Capturing Mobile View...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(baseURL);
    await mobilePage.waitForLoadState("networkidle");
    await mobilePage.waitForTimeout(500);

    const mobilePath = path.join(assetsDir, "screenshot-mobile-feed.png");
    await mobilePage.screenshot({ path: mobilePath });
    console.log(`     Saved: ${mobilePath}`);
    await mobileContext.close();

    console.log("✅ All screenshots captured successfully.");
  } finally {
    await browser.close();
    previewServer.httpServer.close();
  }
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
