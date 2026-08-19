# Troubleshooting

## Common Problems

### Application Won't Start

| Symptom | Cause | Solution |
|---------|-------|----------|
| App crashes on launch | Corrupted data | Delete app data and restart |
| Blank screen | Rendering issue | Restart the application |
| "Database locked" | Another instance running | Close all instances, retry |

### Login Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Invalid credentials" | Wrong username/password | Check Caps Lock, try again |
| "Account locked" | Too many failed attempts | Contact admin to unlock |
| Redirected to Forbidden | Insufficient permissions | Ask admin for role update |

### POS Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "No cash register open" | No active session | Open a cash register first |
| "Product not found" | Product doesn't exist or inactive | Check product status |
| Barcode not scanning | Scanner not connected | Check USB connection |
| "Insufficient stock" | Stock is zero or low | Check inventory levels |

### Performance Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Slow loading | Large database | Run database maintenance |
| UI lag | Too many open tabs | Close unused tabs |
| Report timeout | Large dataset | Use date filters to narrow scope |

### Data Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Stock mismatch | Unrecorded movements | Check movement history |
| Missing product | Archived or deleted | Check archived products |
| Duplicate SKU error | SKU already exists | Use unique SKU |

## Getting More Help

1. Check the **Help** section in the app
2. Review the **Audit Log** for recent changes
3. Run **Diagnostics** from Admin panel
4. Contact your system administrator

## Related

- [Help](/settings/help) — Built-in help
- [Diagnostics](/admin/diagnostics) — System health checks
- [Database & Backups](/admin/database) — Restore from backup
