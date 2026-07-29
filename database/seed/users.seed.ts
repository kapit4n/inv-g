import type Database from "better-sqlite3"
import { exists, randomDate, pick, randomInt } from "./helpers"

// Users are already seeded via Rust seed.rs
// This file adds login history and updates for existing users

export function seed(db: Database.Database): void {
  const users = db.prepare("SELECT id, username FROM users").all() as { id: number; username: string }[]

  if (users.length === 0) {
    console.log("  ⚠ No users found - run main seed first")
    return
  }

  // Update last_login_at with realistic history
  const updateLogin = db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?")

  const insertAll = db.transaction(() => {
    for (const user of users) {
      const lastLogin = randomDate(7, 0)
      updateLogin.run(lastLogin, user.id)
    }
    console.log(`  ✓ Updated login history for ${users.length} users`)
  })

  insertAll()
}
