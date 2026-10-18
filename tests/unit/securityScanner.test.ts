import { describe, it, expect } from "vitest";
import {
  scanTextForSecrets,
  checkSensitiveFilename,
  scanBundleFiles,
  validateRepositoryCloning,
} from "../../src/lib/securityScannerCore";

describe("Security Scanner Engine", () => {
  describe("scanTextForSecrets", () => {
    it("detects and redacts raw private key assignments without printing the secret value", () => {
      const dummyKey = "0x" + "a".repeat(64);
      const content = `const ATTESTER_PRIVATE_KEY = "${dummyKey}";`;
      const violations = scanTextForSecrets(content, "test.ts");

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]).toContain("[VALUE REDACTED]");
      expect(violations[0]).toContain("ATTESTER_PRIVATE_KEY");
      expect(violations[0]).not.toContain(dummyKey);
    });

    it("detects GitHub Personal Access Tokens and redacts", () => {
      const token = ["ghp", "1234567890abcdef1234567890abcdef1234"].join("_");
      const content = `const token = '${token}';`;
      const violations = scanTextForSecrets(content, "ci.yml");

      expect(violations.length).toBe(1);
      expect(violations[0]).toContain("[VALUE REDACTED]");
      expect(violations[0]).not.toContain("1234567890abcdef");
    });

    it("detects AWS Access Keys and redacts", () => {
      const key = ["AKIA", "IOSFODNN7EXAMPLE"].join("");
      const content = `const aws = '${key}';`;
      const violations = scanTextForSecrets(content, "aws.ts");

      expect(violations.length).toBe(1);
      expect(violations[0]).toContain("[VALUE REDACTED]");
    });

    it("returns zero violations for clean codebase content", () => {
      const content = `
        import React from "react";
        export const Header = () => <h1>JalChhaya</h1>;
      `;
      const violations = scanTextForSecrets(content, "Header.tsx");
      expect(violations).toEqual([]);
    });
  });

  describe("checkSensitiveFilename", () => {
    it("exempts .env.example documentation template", () => {
      expect(checkSensitiveFilename(".env.example")).toBeNull();
      expect(checkSensitiveFilename("path/to/.env.example")).toBeNull();
    });

    it("flags sensitive env and credential filenames", () => {
      expect(checkSensitiveFilename(".env")).toContain("Sensitive credential file found");
      expect(checkSensitiveFilename(".env.local")).toContain("Sensitive credential file found");
      expect(checkSensitiveFilename(".env.production")).toContain("Sensitive credential file found");
      expect(checkSensitiveFilename("secrets/key.pem")).toContain("Sensitive credential file found");
      expect(checkSensitiveFilename("server.key")).toContain("Sensitive credential file found");
      expect(checkSensitiveFilename(".ssh/id_rsa")).toContain("Sensitive credential file found");
    });

    it("allows standard source and documentation files", () => {
      expect(checkSensitiveFilename("src/App.tsx")).toBeNull();
      expect(checkSensitiveFilename("README.md")).toBeNull();
      expect(checkSensitiveFilename("package.json")).toBeNull();
    });
  });

  describe("scanBundleFiles", () => {
    it("flags sourcemaps in bundle output", () => {
      const files = [
        { relPath: "dist/assets/index.js", content: "console.log('hi');" },
        { relPath: "dist/assets/index.js.map", content: '{"version":3}' },
      ];
      const violations = scanBundleFiles(files);
      expect(violations).toHaveLength(1);
      expect(violations[0]).toContain("Public sourcemap found in dist bundle: dist/assets/index.js.map");
    });

    it("flags private key environment variable names leaked into bundle", () => {
      const files = [
        {
          relPath: "dist/assets/index.js",
          content: 'var key = process.env.ATTESTER_PRIVATE_KEY;',
        },
      ];
      const violations = scanBundleFiles(files);
      expect(violations).toHaveLength(1);
      expect(violations[0]).toContain("Secret environment variable reference leaked");
    });

    it("passes clean production bundle files", () => {
      const files = [
        {
          relPath: "dist/assets/index.js",
          content: 'console.log("JalChhaya running on Arkiv Tiramisu");',
        },
        {
          relPath: "dist/assets/index.css",
          content: ".civic-card { padding: 1rem; }",
        },
      ];
      const violations = scanBundleFiles(files);
      expect(violations).toEqual([]);
    });
  });

  describe("validateRepositoryCloning", () => {
    it("returns an error if repository clone is shallow", () => {
      const error = validateRepositoryCloning(true);
      expect(error).not.toBeNull();
      expect(error).toContain("Repository clone is shallow");
      expect(error).toContain("fetch-depth: 0");
    });

    it("returns null if repository clone is full (non-shallow)", () => {
      const error = validateRepositoryCloning(false);
      expect(error).toBeNull();
    });
  });
});
