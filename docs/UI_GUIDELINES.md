# UI Guidelines

## Design Principles

1. **Minimal and Professional** — Clean interfaces inspired by Stripe, Linear, Notion
2. **Consistent Spacing** — Use Tailwind spacing scale (p-4, p-6, gap-4)
3. **Visual Hierarchy** — Clear typography scale and color contrast
4. **Dark Mode First** — Design for both themes from day one

## Component Usage

- Use shadcn/ui components as building blocks
- Extend via className, don't modify internals
- Keep consistent border-radius (rounded-xl for cards, rounded-lg for buttons)
- Use `shadow-sm` for cards, `shadow-md` on hover

## Color System

- Primary: Professional blue-purple tones
- Success: Green (#22c55e)
- Warning: Amber (#f59e0b)
- Error: Red (#ef4444)
- Neutral: Slate grays

## Typography

- Headings: font-semibold or font-bold
- Body: text-sm (14px) for most content
- Labels: text-xs for badges and meta
- Monospace: Font for SKUs, codes, IDs

## Responsive

- Desktop-first (1200px+ minimum)
- Use lg: breakpoint for layout changes
- Sidebar collapse on smaller screens

## Animations

- Subtle transitions (200ms duration)
- Scale on active (active:scale-[0.98])
- Fade in for modals and overlays
