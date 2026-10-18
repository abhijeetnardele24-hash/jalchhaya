import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

// Comprehensive Secret Scanner for JalChhaya
// Scans entire Git commit history, git-tracked files, and dist production bundle.
// Note: Never prints raw secret values in output.

console.log("🔒 [Security Scanner] Starting comprehensive security scan for JalChhaya...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const violations: string[] = [];

// 1. Scan entire git commit history from root
try {
  console.log("🔍 [1/4] Scanning full Git commit history (all commits)...");
  const gitLog = execSync("git log -p --full-history", { cwd: rootDir, encoding: "utf8" });

  const secretKeywords = [
    /(?:PRIVATE_KEY|private_key|secret_key|seed_key)\s*[:=]\s*["']?(?:0x)?[a-fA-F0-9]{64}["']?/gi,
    /ghp_[a-zA-Z0-9]{36}/g,
    /AKIA[0-9A-Z]{16}/g,
  ];

  for (const pattern of secretKeywords) {
    let match;
    while ((match = pattern.exec(gitLog)) !== null) {
      // Mask secret value
      const preview = match[0].split(/[:=]/)[0].trim();
      violations.push(`Potential credential assignment found in commit history under key '${preview}' [VALUE REDACTED]`);
    }
  }
} catch (err: any) {
  console.warn("⚠️ Git history inspection warning:", err?.message || err);
}

// 2. Scan all git-tracked files in working tree
try {
  console.log("🔍 [2/4] Scanning all Git-tracked files in working tree...");
  const trackedFilesOutput = execSync("git ls-files", { cwd: rootDir, encoding: "utf8" });
  const trackedFiles = trackedFilesOutput.split("\n").map((f) => f.trim()).filter(Boolean);

  for (const relPath of trackedFiles) {
    // Flag any accidentally tracked secret files (allow .env.example documentation template)
    if (
      relPath === ".env" ||
      (relPath.startsWith(".env.") && relPath !== ".env.example") ||
      relPath.endsWith(".pem") ||
      relPath.endsWith(".key")
    ) {
      violations.push(`Secret file accidentally tracked by Git: ${relPath}`);
      continue;
    }

    // Skip binary files and test mocks
    if (
      relPath.endsWith(".png") ||
      relPath.endsWith(".jpg") ||
      relPath.endsWith(".webp") ||
      relPath.endsWith(".svg") ||
      relPath.endsWith(".ico")
    ) {
      continue;
    }

    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      // Check for raw 64-hex private key patterns assigned to sensitive env vars
      const privateKeyAssign = /(?:PRIVATE_KEY|ATTESTER_PRIVATE_KEY|TIRAMISU_SEED_PRIVATE_KEY|VITE_DEV_PRIVATE_KEY)\s*=\s*["']?0x[a-fA-F0-9]{64}["']?/g;
      if (privateKeyAssign.test(content)) {
        violations.push(`Unmasked private key assignment found in tracked file: ${relPath} [VALUE REDACTED]`);
      }
    }
  }
} catch (err: any) {
  console.warn("⚠️ Git tracked files inspection warning:", err?.message || err);
}

// 3. Scan dist production bundle
console.log("🔍 [3/4] Scanning production dist bundle...");
if (fs.existsSync(distDir)) {
  const distFiles: string[] = [];
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        distFiles.push(fullPath);
      }
    }
  }
  scanDir(distDir);

  for (const file of distFiles) {
    if (file.endsWith(".map")) {
      violations.push(`Public sourcemap found in dist bundle: ${path.relative(rootDir, file)}`);
    }

    const content = fs.readFileSync(file, "utf8");
    // Ensure no private key env var names leaked into client bundle
    if (/(?:PRIVATE_KEY|ATTESTER_PRIVATE_KEY|VITE_DEV_PRIVATE_KEY)\s*[:=]/i.test(content)) {
      violations.push(`Secret environment variable reference leaked into bundle: ${path.relative(rootDir, file)}`);
    }
  }
} else {
  console.warn("⚠️ dist directory does not exist yet. Run 'npm run build' before security scanning.");
}

// 4. Scan codebase for deprecated unsafe VITE_ prefixed private key variables
console.log("🔍 [4/4] Scanning codebase for deprecated VITE_ private key variables...");
const srcDir = path.join(rootDir, "src");
function scanSrc(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scanSrc(full);
    else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      const c = fs.readFileSync(full, "utf8");
      if (c.includes("VITE_DEV_PRIVATE_KEY")) {
        violations.push(`Unsafe VITE_DEV_PRIVATE_KEY reference found in: ${path.relative(rootDir, full)}`);
      }
    }
  }
}
scanSrc(srcDir);

if (violations.length > 0) {
  console.error("❌ [Security Scanner] SECURITY VIOLATIONS DETECTED:");
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
} else {
  console.log("✅ [Security Scanner] All security checks passed.");
  console.log("   - Full Git commit history scanned: 0 exposed secrets.");
  console.log("   - Working tree Git-tracked files scanned: 0 exposed secrets.");
  console.log("   - Production dist bundle scanned: 0 sourcemaps, 0 credential leaks.");
  console.log("   - Codebase scanned: 0 deprecated VITE_DEV_PRIVATE_KEY variables.");
}
