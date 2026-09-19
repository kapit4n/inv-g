#!/usr/bin/env node
import { spawnSync } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const profile = "multi-store"
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
console.log(`🌱 Seeding business data for the '${profile}' profile database...`)

const result = spawnSync(
  "npx",
  ["tsx", "database/seed/run.ts", "--profile", profile],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" }
)
process.exit(result.status ?? 1)