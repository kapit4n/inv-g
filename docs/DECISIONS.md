# Architecture Decision Records

## ADR-001: Tauri v2 over Electron

**Decision:** Use Tauri v2 as the desktop runtime
**Reason:** Smaller binary size, better performance, Rust backend
**Alternatives:** Electron, Neutralinojs
**Consequences:** Smaller ecosystem, but better for production desktop apps

## ADR-002: SQLite over PostgreSQL

**Decision:** Use SQLite as the primary database
**Reason:** Zero-config, offline-first, single-user desktop app
**Alternatives:** PostgreSQL, MySQL, IndexedDB
**Consequences:** No concurrent access needed, simpler deployment

## ADR-003: Feature-First Architecture

**Decision:** Organize code by feature, not by type
**Reason:** Better scalability, co-located related code
**Alternatives:** Layer-first (components/, services/)
**Consequences:** Easier to add new features, harder to share across features

## ADR-004: Zustand over Redux

**Decision:** Use Zustand for state management
**Reason:** Simpler API, less boilerplate, better DX
**Alternatives:** Redux Toolkit, Jotai, Recoil
**Consequences:** Less middleware ecosystem, but sufficient for this use case

## ADR-005: TailwindCSS v4

**Decision:** Use TailwindCSS v4 with CSS-first configuration
**Reason:** No config file needed, better performance, CSS-native theming
**Alternatives:** TailwindCSS v3, CSS Modules, styled-components
**Consequences:** Requires newer tooling, but cleaner setup
