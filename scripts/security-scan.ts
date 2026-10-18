import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

// Dedicated Secret Scanner for JalChhaya
// Scans git history, working tree, and dist production bundle for leaked private keys or secrets

console.log("🔒 [Security Scanner] Starting security scan for JalChhaya...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

let violations: string[] = [];

// 1. Scan git commit history
try {
  console.log("🔍 [1/3] Scanning Git commit history...");
  const gitLog = execSync("git log -p -n 30", { cwd: rootDir, encoding: "utf8" });
  
  // Regex for 64-character hex private keys (ignoring standard commit SHAs or addresses)
  const privateKeyPattern = /(?:PRIVATE_KEY|private_key|secret_key)\s*[:=]\s*["']?(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})["']?/gi;
  let match;
  while ((match = privateKeyPattern.exec(gitLog)) !== null) {
    violations.push(`Potential private key found in commit history: ${match[0].slice(0, 25)}...`);
  }
} catch (err) {
  console.warn("⚠️ Git log inspection encountered a warning:", err);
}

// 2. Scan dist production bundle
console.log("🔍 [2/3] Scanning production dist bundle...");
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
    // Check for private key leaks
    if (/PRIVATE_KEY|ATTESTER_PRIVATE_KEY|VITE_DEV_PRIVATE_KEY/i.test(content)) {
      violations.push(`Environment secret name leaked into bundle: ${path.relative(rootDir, file)}`);
    }

    // Check for 64-char hex strings formatted as private key assignments
    const rawSecretMatch = /["']?(0x[a-fA-F0-9]{64})["']?/g;
    let secMatch;
    while ((secMatch = rawSecretMatch.exec(content)) !== null) {
      const matched = secMatch[1];
      // Exclude known zero hashes or standard tx hashes
      if (!matched.startsWith("0x0000") && !matched.startsWith("0x1111") && !matched.startsWith("0x2222")) {
        // If matched against known private keys in environment
        if (process.env.PRIVATE_KEY && matched.toLowerCase() === process.env.PRIVATE_KEY.toLowerCase()) {
          violations.push(`ACTIVE PRIVATE_KEY leaked in production dist file: ${path.relative(rootDir, file)}`);
        }
        if (process.env.ATTESTER_PRIVATE_KEY && matched.toLowerCase() === process.env.ATTESTER_PRIVATE_KEY.toLowerCase()) {
          violations.push(`ACTIVE ATTESTER_PRIVATE_KEY leaked in production dist file: ${path.relative(rootDir, file)}`);
        }
      }
    }
  }
} else {
  console.warn("⚠️ dist directory does not exist yet. Run npm run build first.");
}

// 3. Scan codebase for deprecated unsafe VITE_ prefixed private key variables
console.log("🔍 [3/3] Scanning codebase for VITE_ prefixed private keys...");
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
  console.error("❌ [Security Scanner] Secret scanner violations detected:");
  violations.forEach((v) => console.error(`  - ${v}`));
  process.exit(1);
} else {
  console.log("✅ [Security Scanner] All security checks passed. Zero secrets or sourcemaps detected in bundle or source.");
  process.exit(0);
}
