# Setup Guide

## Prerequisites

- Node.js 22+
- Rust 1.70+ (via rustup)
- npm 10+

### Linux Dependencies
```bash
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev libsoup-3.0-dev libappindicator3-dev librsvg2-dev patchelf
```

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/inventory-gear.git
cd inventory-gear

# Install dependencies
npm install

# Start development server
npm run dev

# Or start with Tauri
npm run dev:tauri
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:tauri` | Start Tauri development |
| `npm run build` | Build frontend |
| `npm run build:tauri` | Build Tauri application |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Drizzle Studio |

## IDE Setup

### VS Code
Install extensions:
- ESLint
- Prettier
- TailwindCSS IntelliSense
- rust-analyzer
