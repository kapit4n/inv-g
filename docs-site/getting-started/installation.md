# Installation

## Download

Download the latest version of Inventory Gear from the official release page.

Available formats:
| Platform | Format | Notes |
|----------|--------|-------|
| Windows  | `.exe` (NSIS installer) | Supports install for all users or current user |
| macOS    | `.dmg` | Requires macOS 10.15 (Catalina) or later |
| Linux    | `.deb` | For Debian/Ubuntu-based distributions |
| Linux    | `.AppImage` | Portable, no installation required |

## Windows Installation

1. Run the downloaded `.exe` file
2. Choose install mode:
   - **All users** — Requires administrator privileges
   - **Current user** — No admin rights needed
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

## macOS Installation

1. Open the `.dmg` file
2. Drag **Inventory Gear** to the Applications folder
3. On first launch, right-click → Open (to bypass Gatekeeper if needed)
4. Grant any required permissions

## Linux Installation

### Debian/Ubuntu
```bash
sudo dpkg -i inventory-gear_*.deb
```

### AppImage (all distributions)
```bash
chmod +x inventory-gear_*.AppImage
./inventory-gear_*.AppImage
```

## Post-Installation

After installation:

1. Launch Inventory Gear
2. The login screen will appear
3. Log in with your credentials
4. The dashboard will load

::: tip
Keep your application updated. Check **Administration → Updates** for available updates.
:::

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App won't open on macOS | Right-click → Open, or check System Preferences → Security |
| Blank screen on Linux | Install required libraries: `sudo apt install libwebkit2gtk-4.1-0` |
| Database error on first launch | Ensure the app has write permissions to its data directory |

See [Troubleshooting](/troubleshooting/) for more solutions.
