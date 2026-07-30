import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./suites",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "../../docs/screenshots/report" }],
  ],
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: "off",
    video: "off",
    trace: "off",
  },
  projects: [
    {
      name: "light",
      use: {
        colorScheme: "light",
      },
    },
    {
      name: "dark",
      use: {
        colorScheme: "dark",
      },
    },
  ],
})
