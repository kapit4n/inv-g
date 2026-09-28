#!/bin/bash
# Boots the app against the database a previous `first-launch.sh` run already
# created, without re-seeding: the accounts, their (already changed) passwords
# and the demo catalog stay exactly as they are, so the forced first-login
# password change never comes back.
#
#   ./scripts/second-launch.sh
#
# Unlike scripts/first-launch.sh this never resets, wipes or re-seeds anything.
# It reads the active database profile, sanity-checks that its database exists
# and still has users, and boots the app. If there is no usable database yet,
# run scripts/first-launch.sh once.
#
# Usage: scripts/second-launch.sh [--check]
#
#   --check   verify the database and print what would happen, without booting.
set -euo pipefail

cd "$(dirname "$0")/.."

CHECK="${1:-}"
if [ "$CHECK" = "--check" ]; then
  CHECK="true"
else
  CHECK="false"
fi

DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
DATA_DIR="$DATA_HOME/inventory-gear"
PROFILE_FILE="$DATA_DIR/profile.json"

# Active profile -> database file name. Kept in step with
# `config::profile_db_file_name` in src-tauri/src/config.rs.
PROFILE="$(node -e '
  const { readFileSync } = require("node:fs")
  const p = process.argv[1]
  try {
    const config = JSON.parse(readFileSync(p, "utf8"))
    process.stdout.write(typeof config.profile === "string" ? config.profile : "default")
  } catch {
    process.stdout.write("default")
  }
' "$PROFILE_FILE")"

case "$PROFILE" in
  single-store) DB_NAME="inventory-gear-single.db" ;;
  multi-store)  DB_NAME="inventory-gear-multi.db" ;;
  empty)        DB_NAME="inventory-gear-empty.db" ;;
  *)            DB_NAME="inventory_gear.db" ;;
esac
DB_PATH="$DATA_DIR/$DB_NAME"

if [ ! -f "$DB_PATH" ]; then
  echo "✗ No database for the \"$PROFILE\" profile at $DB_PATH" >&2
  echo "  Run scripts/first-launch.sh once to create it." >&2
  exit 1
fi

# Read-only peek at the user count: a database without users is the one thing a
# second launch cannot serve, because nothing re-seeds it. Opening readonly is
# safe even while the app is running (WAL mode); if it ever fails, skip the
# check rather than block the boot.
USER_COUNT="$(node -e '
  const Database = require("better-sqlite3")
  const db = new Database(process.argv[1], { readonly: true })
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n
  db.close()
  process.stdout.write(String(count))
' "$DB_PATH" 2>/dev/null || echo "unknown")"

if [ "$USER_COUNT" = "0" ]; then
  echo "⚠ The \"$PROFILE\" database exists but has no users." >&2
  echo "  Run scripts/first-launch.sh to seed it." >&2
  exit 1
fi

echo "→ Booting against the existing \"$PROFILE\" database ($DB_NAME)."
if [ "$USER_COUNT" != "unknown" ]; then
  echo "  $USER_COUNT user(s) present; no reset, no re-seed, no forced password change."
else
  echo "  No reset, no re-seed."
fi

if [ "$CHECK" = "true" ]; then
  echo "  --check: would run \`npm start\` now."
  exit 0
fi

npm start