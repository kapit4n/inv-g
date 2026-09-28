#!/bin/bash
# Boots the app the way a customer sees it on their first launch, with the demo
# parts catalog already in place: the database is thrown away, re-seeded from an
# installer config, and then the 19-item catalog from
# scripts/database/seed-demo-catalog.mjs is grafted on top of it.
#
#   ./scripts/first-launch.sh
#
# The schema is only ever created by the app booting, so this takes two launches
# and asks you to close the first one. There is no headless init path to borrow.
#
# Usage: scripts/first-launch.sh [config-path]
#
# A config file that exists but lists no users seeds no users: the backend only
# falls back to the six demo accounts when the file is absent, so an empty `users`
# array produces a database with roles and zero logins. That is a silent, easily
# missed difference from a missing file, and the only symptom is a login screen
# that rejects everything. Refuse to boot rather than waste the run.
set -euo pipefail

cd "$(dirname "$0")/.."

PROFILE="empty"
CONFIG="${1:-${IG_INSTALLER_CONFIG:-$PWD/installer-config.dev.json}}"

if [ ! -f "$CONFIG" ]; then
  echo "✗ No installer config at $CONFIG" >&2
  echo "  Pass a path, or set IG_INSTALLER_CONFIG." >&2
  echo "  Deleting the file instead seeds the six demo accounts (password 123456)." >&2
  exit 1
fi

CONFIG="$CONFIG" ALLOW_NO_USERS="${ALLOW_NO_USERS:-0}" node -e '
  const { readFileSync } = require("node:fs")
  const path = process.env.CONFIG
  let config
  try {
    config = JSON.parse(readFileSync(path, "utf8"))
  } catch (err) {
    console.error(`✗ ${path} is not valid JSON: ${err.message}`)
    process.exit(1)
  }
  const users = Array.isArray(config.users) ? config.users : []
  if (users.length === 0 && process.env.ALLOW_NO_USERS !== "1") {
    console.error(`✗ ${path} lists no users, so the app would start with nobody able to log in.`)
    console.error("  Add at least one user, or delete the file to seed the six demo accounts.")
    console.error("  To launch an intentionally userless database, set ALLOW_NO_USERS=1.")
    process.exit(1)
  }

  // The whole point of this script is that the run is reproducible: whatever is
  // in the config is what you will be asked to type at the login screen two
  // launches from now, and by then the window that showed the file is long gone.
  // Printing the credentials up front is what makes the run followable.
  const rows = users.map((u) => [
    u.username,
    u.role || "owner",
    u.password,
    u.passwordChangeRequired === false ? "keeps its password" : "must change password",
  ])
  const head = ["username", "role", "password", "first login"]
  // Widths include the header, not just the values: "username" is longer than
  // most accounts, and a row that outgrows its column silently breaks the one
  // alignment a reader is using to find the password.
  const width = (i) => Math.max(head[i].length, ...rows.map((r) => r[i].length))
  const pad = (s, n) => String(s).padEnd(n)

  console.log("\nSign in with:")
  console.log(`  ${pad(head[0], width(0))}  ${pad(head[1], width(1))}  ${pad(head[2], width(2))}  ${head[3]}`)
  for (const r of rows) {
    console.log(`  ${pad(r[0], width(0))}  ${pad(r[1], width(1))}  ${pad(r[2], width(2))}  ${r[3]}`)
  }
  if (users.some((u) => u.passwordChangeRequired !== false)) {
    console.log("\n  A forced change replaces the password above; note it down first.")
  }
  const roles = Array.isArray(config.quickLoginRoles) ? config.quickLoginRoles : []
  if (roles.length > 0) {
    console.log(`  Quick login (no password) for roles: ${roles.join(", ")}`)
  }
'

# Wipes the profile database and records it as active. Nothing seeds until the
# app boots, which is when the config is read and the users inserted.
node scripts/database/profile.mjs "$PROFILE" --reset

echo
echo "→ Launch 1 of 2: creating the schema and the users."
echo "  The window will open. Close it once you are past the login screen —"
echo "  it cannot be skipped, and the catalog step needs the schema it writes."
echo
IG_INSTALLER_CONFIG="$CONFIG" npm start

echo
echo "→ Building the demo catalog into the same database."
# Clones the database just initialized above, so the users configured here carry
# into the catalog build, then replaces every business row with the 19 parts.
node scripts/database/seed-demo-catalog.mjs --activate

echo
echo "→ Launch 2 of 2: ready with the catalog."
echo
npm start
