# Deployment

## Building

```bash
npm run tauri:build
```

## Platforms

- **Linux:** AppImage, .deb
- **macOS:** .dmg, .app
- **Windows:** NSIS installer, .msi

## Distribution

Tauri handles code signing and auto-updates configuration.
See `src-tauri/tauri.conf.json` for bundle configuration.
