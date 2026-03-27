import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    environmentMatchGlobs: [
      // Pure logic tests can run in node for speed
      ["tests/unit/prompt-engine.test.ts", "node"],
      ["tests/unit/document-pipeline.test.ts", "node"],
    ],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/types.ts", "src/lib/constants.ts"],
    },
  },
});
