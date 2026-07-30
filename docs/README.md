# Inventory Gear Documentation

> Modern desktop inventory management, point-of-sale, and CRM system for automotive parts stores.

Inventory Gear is a production-quality desktop application built with **Tauri v2**, **React 19**, **TypeScript**, and **SQLite**. It provides a complete business management solution for auto parts stores, mechanics, car workshops, and automotive distributors.

## Quick Start

- **[Setup Guide](./SETUP.md)** — Prerequisites, installation, and first-run configuration
- **[Deployment](./DEPLOYMENT.md)** — Production deployment instructions
- **[Seed Data](./SEED_DATA.md)** — Default users, roles, and sample data

### Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Owner | `owner` | `123456` |
| Administrator | `admin` | `123456` |
| Cashier | `cashier` | `123456` |
| Warehouse | `warehouse` | `123456` |
| Purchasing | `purchasing` | `123456` |
| Viewer | `viewer` | `123456` |

## User Manual

- **[Navigation Guide](./manual/NAVIGATION.md)** — Complete sidebar menu hierarchy, routes, and icons
- **[User Manual](./manual/USER_MANUAL.md)** — Comprehensive step-by-step guide for all modules
- **[Permissions Matrix](./manual/PERMISSIONS.md)** — Permission keys, descriptions, and default role assignments
- **[Keyboard Shortcuts](./manual/SHORTCUTS.md)** — Global, POS, navigation, and dialog shortcuts
- **[FAQ](./manual/FAQ.md)** — 100+ frequently asked questions
- **[Troubleshooting](./manual/TROUBLESHOOTING.md)** — Common issues and solutions

## Developer Guide

- **[Architecture](./ARCHITECTURE.md)** — System architecture, component tree, and data flow
- **[Coding Guidelines](./CODING_GUIDELINES.md)** — TypeScript, Rust, and style conventions
- **[UI Guidelines](./UI_GUIDELINES.md)** — Design system, components, and layout standards
- **[CRUD Framework](./CRUD_FRAMEWORK.md)** — Entity framework for rapid page development
- **[I18n Guide](./I18N.md)** — Internationalization patterns and translation workflow
- **[Testing](./TESTING.md)** — Test strategy, frameworks, and writing tests
- **[Contributing](./CONTRIBUTING.md)** — How to contribute to the project
- **[Security](./SECURITY.md)** — Authentication, authorization, and data protection
- **[Reports Module](./REPORTS.md)** — Report architecture and how to add new reports

## Architecture

- **[Architecture Overview](./ARCHITECTURE.md)** — Tauri v2 app structure, IPC, and module layout
- **[Database Schema](./DATABASE.md)** — Table definitions, migrations, and design decisions
- **[Database Schema (Rust)](./database/schema.md)** — Full DDL with foreign keys and indexes
- **[Technical Decisions](./DECISIONS.md)** — Why specific technologies were chosen
- **[Component Library](./components/)** — Reusable UI components documentation
- **[UI Flows](./flows/)** — User flow diagrams for key workflows

## Database

- **[Schema Reference](./DATABASE.md)** — All tables, columns, and relationships
- **[Migrations](./database/migrations.md)** — Migration workflow and versioning
- **[Seed Data](./SEED_DATA.md)** — Default data populated on first run

## API Reference

- **[Tauri Commands](./api/)** — Rust backend commands grouped by module
- **[IPC Protocol](./technical/ipc.md)** — Frontend-backend communication patterns

## Screenshots

Screenshots are located in **[docs/screenshots/](./screenshots/)** and organized by module.

## UI Flows

Process flow diagrams are located in **[docs/flows/](./flows/)** for key workflows:

- Point of Sale checkout process
- Purchase order lifecycle
- Customer registration and vehicle linking
- Daily closeout procedure
- Backup and restore workflow

## Project Management

- **[Roadmap](./ROADMAP.md)** — Current and planned milestones
- **[Features](./FEATURES.md)** — Complete feature list with status
- **[Changelog](./CHANGELOG.md)** — Release history
- **[Known Issues](./KNOWN_ISSUES.md)** — Current known limitations
- **[Bug Fix Log](./BUG_FIX_LOG.md)** — Historical bug fixes with root cause analysis
- **[Progress Tracking](./progress/)** — Milestone progress documents

## Support

For additional support:

- Open an issue on the project repository
- Check the [FAQ](./manual/FAQ.md) for common questions
- Review the [Troubleshooting Guide](./manual/TROUBLESHOOTING.md) for solutions
