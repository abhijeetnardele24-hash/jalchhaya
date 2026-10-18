import { describe, it, expect } from "vitest";
import { PROJECT_ID } from "../../src/types/schema";
import fs from "node:fs";
import path from "node:path";

describe("Project Identifier Drift Regression Suite", () => {
  it("enforces canonical project identifier 'jalchhaya-pune-2026'", () => {
    expect(PROJECT_ID).toBe("jalchhaya-pune-2026");
  });

  it("ensures no stale 'jalchhaya_pune' occurs across source or scripts", () => {
    const rootDir = path.resolve(__dirname, "../../");
    const dirsToCheck = ["src", "scripts", "arkiv", "docs"];

    function checkDir(dirPath: string) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".md"))) {
          const content = fs.readFileSync(fullPath, "utf8");
          // Ensure no underscore-delimited stale identifier remains
          expect(
            content.includes("jalchhaya_pune"),
            `Stale identifier 'jalchhaya_pune' found in ${fullPath}`
          ).toBe(false);
        }
      }
    }

    dirsToCheck.forEach((d) => {
      const p = path.join(rootDir, d);
      if (fs.existsSync(p)) {
        checkDir(p);
      }
    });
  });
});
