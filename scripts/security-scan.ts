import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  scanTextForSecrets,
  checkSensitiveFilename,
  scanBundleFiles,
} from "../src/lib/securityScannerCore";

// Comprehensive Secret Scanner for JalChhaya
// Scans entire Git commit history, git-tracked & untracked working tree files, and dist bundle.
// Rule: Never prints raw secret values in output.
// Rule: Never reports success if any scan stage fails or is skipped.

console.log("🔒 [Security Scanner] Starting comprehensive security scan for JalChhaya...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const violations: string[] = [];
let historyScannedCount = 0;
let filesScannedCount = 0;

// 1. Scan entire git commit history (robust commit-by-commit streaming)
console.log("🔍 [1/4] Scanning full Git commit history (streaming all commits)...");
try {
  const revListOutput = execSync("git rev-list --all", {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const commits = revListOutput.split("\n").map((c) => c.trim()).filter(Boolean);

  for (const commitHash of commits) {
    historyScannedCount++;
    try {
      const diffOutput = execSync(`git show -p --format="" ${commitHash}`, {
        cwd: rootDir,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
      const diffViolations = scanTextForSecrets(diffOutput, `commit ${commitHash.slice(0, 8)}`);
      violations.push(...diffViolations);
    } catch (diffErr: any) {
      violations.push(`Failed to read git commit diff for ${commitHash.slice(0, 8)}: ${diffErr?.message || diffErr}`);
    }
  }
} catch (gitErr: any) {
  violations.push(`Critical failure during git history inspection: ${gitErr?.message || gitErr}`);
}

// 2. Scan working tree: Git-tracked files + unignored untracked files
console.log("🔍 [2/4] Scanning working tree (tracked files and untracked non-ignored files)...");
try {
  // Tracked files
  const trackedOutput = execSync("git ls-files", { cwd: rootDir, encoding: "utf8" });
  const trackedFiles = trackedOutput.split("\n").map((f) => f.trim()).filter(Boolean);

  // Untracked non-ignored files
  const untrackedOutput = execSync("git ls-files --others --exclude-standard", { cwd: rootDir, encoding: "utf8" });
  const untrackedFiles = untrackedOutput.split("\n").map((f) => f.trim()).filter(Boolean);

  const allFiles = Array.from(new Set([...trackedFiles, ...untrackedFiles]));

  for (const relPath of allFiles) {
    filesScannedCount++;

    // Check sensitive filename (e.g. .env, .pem, .key)
    const sensitiveFileNotice = checkSensitiveFilename(relPath);
    if (sensitiveFileNotice) {
      violations.push(sensitiveFileNotice);
      continue;
    }

    // Skip binary files and images
    if (
      relPath.endsWith(".png") ||
      relPath.endsWith(".jpg") ||
      relPath.endsWith(".jpeg") ||
      relPath.endsWith(".webp") ||
      relPath.endsWith(".ico") ||
      relPath.endsWith(".woff2") ||
      relPath.endsWith(".woff") ||
      relPath.endsWith(".ttf") ||
      relPath.endsWith(".eot")
    ) {
      continue;
    }

    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        const fileViolations = scanTextForSecrets(content, `file ${relPath}`);
        violations.push(...fileViolations);
      } catch (readErr: any) {
        violations.push(`Failed to read file ${relPath}: ${readErr?.message || readErr}`);
      }
    }
  }
} catch (fileErr: any) {
  violations.push(`Critical failure during working tree inspection: ${fileErr?.message || fileErr}`);
}

// 3. Scan production dist bundle
console.log("🔍 [3/4] Scanning production dist bundle...");
if (!fs.existsSync(distDir)) {
  violations.push("Production dist directory does not exist. Run 'npm run build' before security scanning.");
} else {
  const distFiles: { relPath: string; content: string }[] = [];
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          distFiles.push({
            relPath: path.relative(rootDir, fullPath),
            content,
          });
        } catch (e: any) {
          violations.push(`Failed to read bundle artifact ${path.relative(rootDir, fullPath)}: ${e?.message || e}`);
        }
      }
    }
  }
  scanDir(distDir);

  const bundleViolations = scanBundleFiles(distFiles);
  violations.push(...bundleViolations);
}

// 4. Scan codebase for deprecated unsafe VITE_ prefixed private key variables
console.log("🔍 [4/4] Scanning codebase for deprecated VITE_ private key variables...");
const srcDir = path.join(rootDir, "src");
function scanSrc(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanSrc(full);
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      if (entry.name === "securityScannerCore.ts") continue;
      try {
        const c = fs.readFileSync(full, "utf8");
        const deprecatedVarName = ["VITE", "DEV", "PRIVATE", "KEY"].join("_");
        if (c.includes(deprecatedVarName)) {
          violations.push(`Deprecated unsafe ${deprecatedVarName} variable reference in: ${path.relative(rootDir, full)}`);
        }
      } catch (err: any) {
        violations.push(`Failed to read source file ${path.relative(rootDir, full)}: ${err?.message || err}`);
      }
    }
  }
}
scanSrc(srcDir);

// Final verdict
if (violations.length > 0) {
  console.error("\n❌ [Security Scanner] SECURITY VIOLATIONS DETECTED (Exit 1):");
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
} else {
  console.log("\n✅ [Security Scanner] All security checks passed.");
  console.log(`   - Scanned ${historyScannedCount} commits in full Git history: 0 exposed secrets.`);
  console.log(`   - Scanned ${filesScannedCount} working tree files (tracked + unignored): 0 exposed secrets.`);
  console.log("   - Production dist bundle verified: 0 sourcemaps, 0 credential leaks.");
  console.log("   - Codebase verified: 0 deprecated VITE_ private key variables.");
}
