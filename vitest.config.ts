import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/helpers/setup.ts"],
    // 20s, not the 5s default. The integration suites drive the real thing:
    // `version-semver.test.ts` spawns a fresh `node` per case (27 of them, each
    // copying a tree into a temp sandbox) and `tauri-command-argument-contract`
    // walks `src-tauri/src`. That CPU-heavy work runs in parallel with every
    // other worker, so on a loaded machine an ordinary `render` + `waitFor` unit
    // test that takes 0.3s unloaded can take 13s and get killed by the default
    // while nothing is actually wrong. The failures land on innocent bystanders
    // -- `command-palette` and `product-compatibility-tab` were both red for
    // this and pass in isolation.
    //
    // A timeout this generous cannot hide a genuine hang: a hung test blocks
    // forever regardless, and the process-spawning cases still fail fast on
    // their own errors.
    testTimeout: 20000,
    hookTimeout: 20000,
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.{ts,tsx}",
      "tests/regression/**/*.test.{ts,tsx}",
      "tests/smoke/**/*.test.{ts,tsx}",
      "tests/tauri/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./quality/coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/types/**/*",
        "src/**/*.test.{ts,tsx}",
        "src/**/index.ts",
        "src/main.tsx",
        "src/App.tsx",
        "src/vite-env.d.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
