import { defineConfig } from "vitest/config";

export default defineConfig({
  // Native tsconfig path resolution — no vite-tsconfig-paths plugin needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    // Only pure logic is unit-tested. Anything needing a database is covered by
    // the end-to-end scripts, which run against real Postgres — mocking Prisma
    // would test the mock, not the constraints that actually enforce the rules.
    include: ["tests/unit/**/*.test.ts"],
  },
});
