#!/usr/bin/env node
/**
 * Creates and edits `installer-config.json`: the users an installation ships
 * with, and which of them may sign in without typing a password.
 *
 * Run it before cutting a release, then build the installer. The file is read
 * once, on the machine's first launch, and never written to afterwards.
 *
 *   node scripts/installer-config.mjs init                  # empty config
 *   node scripts/installer-config.mjs add <user> <email> <password> [role]
 *   node scripts/installer-config.mjs remove <username>
 *   node scripts/installer-config.mjs list
 *   node scripts/installer-config.mjs quick-login <role> on|off
 *   node scripts/installer-config.mjs validate
 *
 * The default role is `owner`, because the common case is an installation being
 * prepared for one person who owns it. Every configured user is created with
 * `passwordChangeRequired` unless told otherwise, so the password set here is
 * only ever a starting point.
 *
 * The same rules the backend enforces are checked here before the file is
 * written, so a bad configuration fails at the terminal rather than on a
 * customer's first launch. `validate` is what the release build should run.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CONFIG_PATH = join(ROOT, "installer-config.json")

/** Must match `installer_config::MIN_PASSWORD_LEN` in the Rust backend. */
const MIN_PASSWORD_LEN = 6

/** Must match `ROLES` in src-tauri/src/db/seed.rs. */
const VALID_ROLES = ["owner", "administrator", "cashier", "warehouse", "purchasing", "viewer"]

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
}

function fail(message) {
  console.error(`${C.red("error")} ${message}`)
  process.exit(1)
}

function readConfig() {
  if (!existsSync(CONFIG_PATH)) {
    return { users: [], quickLoginRoles: [] }
  }
  try {
    const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf8"))
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      quickLoginRoles: Array.isArray(parsed.quickLoginRoles) ? parsed.quickLoginRoles : [],
    }
  } catch (err) {
    fail(`installer-config.json is not valid JSON: ${err.message}`)
  }
}

function writeConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n")
}

/**
 * Mirrors `installer_config::validate` in Rust.
 *
 * Kept deliberately in step with the backend: the two run at different times —
 * this one before the release is built, that one on the customer's first launch —
 * so a rule that exists in only one of them produces a configuration that passes
 * review and then fails in the field.
 */
function validate(config) {
  const problems = []
  const usernames = new Set()
  const emails = new Set()

  // A present file with no users is the one shape that ships an installer
  // nobody can log into. The backend falls back to the six demo accounts only
  // when the file is *absent*; present-but-empty takes the "operator asked for
  // these users" branch and inserts nothing. Every other rule here checks a user
  // that was written, so without this an empty list passed every gate and
  // produced an unusable release.
  if (!Array.isArray(config.users) || config.users.length === 0) {
    problems.push(
      "no users are configured, so the installer would ship with nobody able to log in; " +
        "add at least one with `installer-config:add`, or delete the file to get the six demo accounts instead"
    )
  }

  config.users.forEach((user, index) => {
    const label = user.username?.trim() ? `"${user.username}"` : `user #${index + 1}`

    if (!user.username?.trim()) problems.push(`${label} has no username`)
    if (!user.email?.trim()) problems.push(`${label} has no email`)
    if (!user.fullName?.trim()) problems.push(`${label} has no full name`)

    if (typeof user.password !== "string" || user.password.length < MIN_PASSWORD_LEN) {
      problems.push(`${label} needs a password of at least ${MIN_PASSWORD_LEN} characters`)
    }

    if (user.role && !VALID_ROLES.includes(user.role)) {
      problems.push(`${label} has role "${user.role}"; valid roles are ${VALID_ROLES.join(", ")}`)
    }

    if (user.username) {
      if (usernames.has(user.username)) problems.push(`username "${user.username}" is repeated`)
      usernames.add(user.username)
    }
    if (user.email) {
      if (emails.has(user.email)) problems.push(`email "${user.email}" is repeated`)
      emails.add(user.email)
    }
  })

  const seenRoles = new Set()
  for (const role of config.quickLoginRoles) {
    if (!VALID_ROLES.includes(role)) {
      problems.push(`quickLoginRoles has "${role}"; valid roles are ${VALID_ROLES.join(", ")}`)
    }
    if (seenRoles.has(role)) problems.push(`quickLoginRoles repeats "${role}"`)
    seenRoles.add(role)
  }

  if (config.quickLoginRoles.includes("owner")) {
    problems.push(
      'quickLoginRoles contains "owner"; an owner password is the last control on the data, so the backend refuses to quick-login that role'
    )
  }

  return problems
}

function commandInit() {
  if (existsSync(CONFIG_PATH)) {
    fail("installer-config.json already exists. Use `remove` or edit it, or delete it first.")
  }
  writeConfig({ users: [], quickLoginRoles: [] })
  console.log(`${C.green("created")} installer-config.json`)
}

function commandAdd(argv) {
  const [username, email, password, role = "owner", fullName] = argv

  if (!username || !email || !password) {
    fail("usage: add <username> <email> <password> [role=owner] [full name]")
  }
  if (!VALID_ROLES.includes(role)) {
    fail(`role "${role}" does not exist. Valid roles: ${VALID_ROLES.join(", ")}`)
  }

  const config = readConfig()

  if (config.users.some((u) => u.username === username)) {
    fail(`"${username}" is already configured. Use \`remove\` first, or pick another name.`)
  }

  config.users.push({
    username,
    email,
    fullName: fullName || username,
    password,
    role,
    passwordChangeRequired: true,
    active: true,
  })

  const problems = validate(config)
  if (problems.length > 0) {
    fail(`refusing to write an invalid configuration:\n  - ${problems.join("\n  - ")}`)
  }

  writeConfig(config)
  console.log(`${C.green("added")} ${username} <${email}> role=${role}`)
  console.log(C.dim("passwordChangeRequired is on: they will be asked to set their own on first login."))
}

function commandRemove(argv) {
  const [username] = argv
  if (!username) fail("usage: remove <username>")

  const config = readConfig()
  const before = config.users.length
  config.users = config.users.filter((u) => u.username !== username)

  if (config.users.length === before) {
    fail(`"${username}" is not in installer-config.json`)
  }

  writeConfig(config)
  console.log(`${C.green("removed")} ${username}`)
}

function commandQuickLogin(argv) {
  const [role, state] = argv
  if (!role || !state || !["on", "off"].includes(state)) {
    fail("usage: quick-login <role> on|off")
  }
  if (!VALID_ROLES.includes(role)) {
    fail(`role "${role}" does not exist. Valid roles: ${VALID_ROLES.join(", ")}`)
  }
  if (role === "owner" && state === "on") {
    fail('quick login cannot be enabled for "owner": the backend refuses it too.')
  }

  const config = readConfig()
  const has = config.quickLoginRoles.includes(role)

  if (state === "on" && !has) config.quickLoginRoles.push(role)
  if (state === "off") config.quickLoginRoles = config.quickLoginRoles.filter((r) => r !== role)

  writeConfig(config)
  console.log(`${C.green("quick login")} ${role}: ${has === (state === "on") ? "unchanged" : state}`)
}

function commandList() {
  const config = readConfig()
  const problems = validate(config)

  if (config.users.length === 0) {
    console.log(C.dim("no users configured — this installer would ship with nobody able to log in"))
  } else {
    console.log(C.bold(`${config.users.length} user(s):`))
    for (const user of config.users) {
      const flags = [
        user.active === false ? C.dim("inactive") : null,
        user.passwordChangeRequired === false ? C.yellow("no forced change") : C.dim("must change password"),
      ].filter(Boolean)
      console.log(`  ${user.username.padEnd(16)} ${user.role.padEnd(14)} ${user.email.padEnd(30)} ${flags.join(", ")}`)
    }
  }

  console.log(
    config.quickLoginRoles.length > 0
      ? `${C.bold("quick login:")} ${config.quickLoginRoles.join(", ")}`
      : C.dim("quick login: no roles (every role signs in with a password)")
  )

  if (problems.length > 0) {
    console.error(`\n${C.red("invalid:")}`)
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
}

function commandValidate() {
  const config = readConfig()

  if (!existsSync(CONFIG_PATH)) {
    console.log(C.dim("installer-config.json not present — the default demo users will be seeded"))
    return
  }

  const problems = validate(config)
  if (problems.length > 0) {
    console.error(`${C.red("invalid")} installer-config.json:`)
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }

  console.log(
    `${C.green("valid")} ${config.users.length} user(s), quick login: ${config.quickLoginRoles.join(", ") || "none"}`
  )
}

const [command, ...argv] = process.argv.slice(2)

switch (command) {
  case "init": commandInit(); break
  case "add": commandAdd(argv); break
  case "remove": commandRemove(argv); break
  case "quick-login": commandQuickLogin(argv); break
  case "list": commandList(); break
  case "validate": commandValidate(); break
  case undefined:
  case "help":
  case "--help":
  case "-h":
    console.log(`installer-config — pre-seeded users and quick login for a release

  init                                  create an empty config
  add <user> <email> <pass> [role] [name]  add a user (role defaults to owner)
  remove <username>                     remove a user
  quick-login <role> on|off             allow or deny passwordless sign-in
  list                                  show the current configuration
  validate                              check it against the backend's rules

Config file: ${C.dim(CONFIG_PATH.replace(ROOT + "/", ""))}
Roles:      ${VALID_ROLES.join(", ")}`)
    break
  default:
    fail(`unknown command "${command}". Try \`help\`.`)
}
