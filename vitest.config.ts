import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// One test run for the whole repo: the web app's logic, the shared package, the workers' pure code, and the hook.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)) },
  },
  test: {
    include: [
      "apps/web/src/**/*.test.ts",
      "packages/*/src/**/*.test.ts",
      "supabase/functions/**/*.test.ts",
      ".claude/hooks/**/*.test.ts",
    ],
    coverage: {
      include: ["apps/web/src/lib/**/*.ts", "packages/*/src/**/*.ts", "supabase/functions/*/lib/**/*.ts"],
      exclude: ["**/*.test.ts"],
    },
  },
});
