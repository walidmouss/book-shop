import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run tests sequentially to avoid database conflicts
    fileParallelism: false,
    // Only include test files from src directory
    include: ["src/**/*.test.ts"],
    // Exclude dist directory
    exclude: ["node_modules", "dist"],
  },
});
