# Settings

## What is it?

User-level preferences for language, theme and display options, plus the two
configuration areas that belong with them: **Stores and warehouses** and
**System currency**.

## How to Access

**Sidebar → Settings**. Route: `/settings`.

## Available Settings

| Setting | Options |
|---------|---------|
| Language | English, Español |
| Theme | Light, Dark, System |
| Date Format | Various formats |
| Time Format | 12h, 24h |
| System currency | Boliviano (Bs), Dólar (USD), Euro, Peso mexicano, Sol, Real, and others |

## System Currency

### What is it for?

It decides how every amount in the app is written: point of sale totals, sales
history, product prices, inventory valuations, the dashboard, payments and
every report. You pick it once and it applies everywhere.

### How to use it

1. Go to **Settings**
2. Find **Moneda del sistema** / **System currency**
3. Pick a currency, for example **Boliviano (Bs)**
4. It is saved immediately and applies to the whole app

The choice is stored as the `currency` setting and is shared by every user of
the installation, not per user.

### Considerations

- **This changes the display, not the numbers.** Switching from USD to BOB does
  not convert anything. A product priced at 100.00 is still 100.00; it is now
  written `100,00` in bolivianos. If you are switching because your prices are
  actually in another currency, update the prices too.
- Existing prices, sales totals and reports are never recalculated.
- The currency carries its own number format. Boliviano uses `es-BO`, so you
  will see `Bs 1.234,50` — dots for thousands, comma for decimals.

## Stores and Warehouses

### What is it for?

A store is a physical location your business sells from. The app uses the
**number of active stores** to decide how it behaves — there is no separate
single-store or multi-store switch to configure.

### How to use it

1. Go to **Settings → Tiendas y almacenes**
2. **Agregar tienda** to create one, or the pencil icon to edit it
3. The power icon activates and deactivates a store
4. The star icon marks a store as the one the app falls back to
5. The bin icon deletes a store, after a confirmation

The banner above the table tells you which mode you are in: how many stores are
active, and whether the selector is available.

### Single store

With exactly one active store, the app uses it automatically. The store selector
does not appear anywhere — not in point of sale, not in inventory — because
there is no choice to make. Sales, stock movements and stock reads all resolve
to that store on their own.

### Multiple stores

With two or more active stores, a **Tienda** selector appears in the top bar. The
store you pick is used for point of sale, inventory, stock operations, imports
and transfers. Your choice is remembered between sessions.

Only active stores are listed, so deactivating a store removes it from the
selector immediately.

### Considerations

- **There must always be at least one active store.** The last active store
  cannot be deactivated or deleted, because the app resolves a store on every
  sale and every stock operation and has no valid state without one. The control
  is disabled rather than failing after the fact.
- **A store with history is never deleted.** If products, sales, purchase
  orders, stock movements or storage locations still point at it, the delete
  button is disabled and the dialog lists what is in the way. Deactivate the
  store instead: it disappears from the selector and your history stays intact.
- Deleting is only for a store that was created and never used.
- A store's **code** must be unique.
- The **default** store is the one the app falls back to. It is not tied to
  single or multi store mode; it is only used when no other store can be
  resolved.
- A brand new installation with no stores starts with **Tienda Principal**
  already active. The `empty` database profile, which deliberately seeds
  nothing, gets the same store created on first launch.
- Only users with the *Gestionar Almacenes* permission see this card.

## Related

- [Administration → System Settings](/admin/settings) — System-wide config
- [Inventory → Warehouses](/inventory/warehouses) — the same stores, in the
  inventory module
