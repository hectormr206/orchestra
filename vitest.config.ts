import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only include tests from src directory
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Explicitly exclude ai-core skills/examples
    exclude: [
      "node_modules/**",
      "dist/**",
      "ai-core/**",
      ".gemini/**",
      ".orchestra/**",
    ],
    // Test environment
    environment: "node",
    // Globals for describe, it, expect
    globals: true,
  },
});
