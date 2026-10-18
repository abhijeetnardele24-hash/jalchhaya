import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/unit/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 85,
        functions: 75,
        branches: 75,
        statements: 85,
      },
      exclude: [
        "node_modules/",
        "dist/",
        "public/**",
        "tests/e2e/",
        "scripts/",
        "**/*.d.ts",
        "playwright.config.ts",
        "src/main.tsx",
        "vite.config.ts",
        "vitest.config.ts"
      ],
    },
  },
});
