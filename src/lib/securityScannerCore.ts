import path from "node:path";

export interface ScanResult {
  passed: boolean;
  violations: string[];
  stagesRun: {
    history: boolean;
    trackedFiles: boolean;
    untrackedFiles: boolean;
    distBundle: boolean;
    codebaseDeprecatedVars: boolean;
  };
}

export const SECRET_PATTERNS = [
  {
    name: "Private Key Assignment",
    regex: /(?:PRIVATE_KEY|private_key|secret_key|seed_key|ATTESTER_PRIVATE_KEY|TIRAMISU_SEED_PRIVATE_KEY)\s*[:=]\s*["']?(?:0x)?[a-fA-F0-9]{64}["']?/gi,
  },
  {
    name: "GitHub Personal Access Token",
    regex: /ghp_[a-zA-Z0-9]{36}/g,
  },
  {
    name: "AWS Access Key",
    regex: /AKIA[0-9A-Z]{16}/g,
  },
];

/**
 * Scan arbitrary text content for credential patterns without exposing secret values.
 */
export function scanTextForSecrets(content: string, sourceLabel: string): string[] {
  const violations: string[] = [];

  for (const { name, regex } of SECRET_PATTERNS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(regex.source, regex.flags);
    while ((match = re.exec(content)) !== null) {
      const matchedSnippet = match[0];
      let preview = "";
      if (matchedSnippet.includes(":") || matchedSnippet.includes("=")) {
        preview = matchedSnippet.split(/[:=]/)[0].trim();
      } else {
        preview = matchedSnippet.slice(0, 4) + "…";
      }
      violations.push(
        `Potential ${name} detected in ${sourceLabel} under key '${preview}' [VALUE REDACTED]`
      );
    }
  }

  return violations;
}

/**
 * Checks if any sensitive files are tracked or unignored in git.
 * Allows .env.example as standard documentation template.
 */
export function checkSensitiveFilename(relPath: string): string | null {
  const normalized = relPath.replace(/\\/g, "/");
  const basename = path.basename(normalized);

  if (basename === ".env.example") {
    return null;
  }

  if (
    basename === ".env" ||
    (basename.startsWith(".env.") && basename !== ".env.example") ||
    basename.endsWith(".pem") ||
    basename.endsWith(".key") ||
    basename === "id_rsa"
  ) {
    return `Sensitive credential file found: ${relPath}`;
  }

  return null;
}

/**
 * Scans a production bundle for leaked sourcemaps and credential references.
 */
export function scanBundleFiles(
  files: { relPath: string; content: string }[]
): string[] {
  const violations: string[] = [];

  for (const { relPath, content } of files) {
    if (relPath.endsWith(".map")) {
      violations.push(`Public sourcemap found in dist bundle: ${relPath}`);
    }

    const deprecatedKey = ["VITE", "DEV", "PRIVATE", "KEY"].join("_");
    if (
      new RegExp(`(?:PRIVATE_KEY|ATTESTER_PRIVATE_KEY|${deprecatedKey})\\b`, "i").test(
        content
      )
    ) {
      violations.push(
        `Secret environment variable reference leaked into client bundle: ${relPath}`
      );
    }
  }

  return violations;
}

/**
 * Ensures full-history scan cannot proceed erroneously on shallow git clones.
 */
export function validateRepositoryCloning(isShallow: boolean): string | null {
  if (isShallow) {
    return "Repository clone is shallow (git rev-parse --is-shallow-repository is true). Full-history scanning cannot be claimed or verified on shallow history. Ensure 'fetch-depth: 0' is configured in CI.";
  }
  return null;
}
