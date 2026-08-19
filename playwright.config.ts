import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // One path, run seriously: no retries hiding a flake, no parallel workers
  // racing for slots in the same race category.
  retries: 0,
  workers: 1,
  timeout: 60_000,
  // Neon's free tier scales to zero, so the first query after an idle period
  // can take several seconds. That is a real production condition, not a test
  // artifact — the timeout accommodates it rather than hiding it.
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    // A phone viewport, because that is how this site is actually used.
    ...devices["Pixel 7"],
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
