# AGENTS.md

This file provides specific guidance for developing the Electron desktop application.

## Architecture

- **Main Process** (`layer/main/`) - Electron main process handling system integration
- **Renderer Process** (`layer/renderer/`) - Vite + React renderer (primary web app)

The renderer is the **primary web application** - a Vite + React SPA that can run both in Electron and as a standalone web app.

## UI Style

- **UI Design Style**: Follow Vercel and Linear SaaS UI aesthetics - clean, modern, minimal design with subtle shadows, rounded corners, and excellent typography
- **Tailwind CSS** for styling across all platforms
- Platform-specific Tailwind configs in each app

## Development Commands

```bash
# Recommended: Browser development (faster)
pnpm run dev:web

# Full Electron development
pnpm run dev:electron

# Build web version
pnpm run build:web
```

## UIKit Colors for Desktop Components

For desktop components (`apps/desktop/**/*`) and shared UI components (`packages/internal/components/**/*`), use Apple UIKit color system with Tailwind classes. **Important**: Always use the correct Tailwind prefix for each color category:

**System Colors**: `text-red`, `bg-red`, `border-red` (same for `orange`, `yellow`, `green`, `mint`, `teal`, `cyan`, `blue`, `indigo`, `purple`, `pink`, `brown`, `gray`)

**Fill Colors**:

- Background: `bg-fill`, `bg-fill-secondary`, `bg-fill-tertiary`, `bg-fill-quaternary`, `bg-fill-quinary`, `bg-fill-vibrant`, `bg-fill-vibrant-secondary`, `bg-fill-vibrant-tertiary`, `bg-fill-vibrant-quaternary`, `bg-fill-vibrant-quinary`
- Border: `border-fill`, `border-fill-secondary`, etc.

**Text Colors**: `text-text`, `text-text-secondary`, `text-text-tertiary`, `text-text-quaternary`, `text-text-quinary`, `text-text-vibrant`, `text-text-vibrant-secondary`, `text-text-vibrant-tertiary`, `text-text-vibrant-quaternary`, `text-text-vibrant-quinary`

**Material Colors**: `bg-material-ultra-thick`, `bg-material-thick`, `bg-material-medium`, `bg-material-thin`, `bg-material-ultra-thin`, `bg-material-opaque`

**Control Colors**: `bg-control-enabled`, `bg-control-disabled`

**Interface Colors**: `bg-menu`, `bg-popover`, `bg-titlebar`, `bg-sidebar`, `bg-selection-focused`, `bg-selection-focused-fill`, `bg-selection-unfocused`, `bg-selection-unfocused-fill`, `bg-header-view`, `bg-tooltip`, `bg-under-window-background`

These colors automatically adapt to light/dark mode following Apple's design system. Remember to use the appropriate prefix (`text-`, `bg-`, `border-`) based on the CSS property you're styling.

## Icons

For icon usage, prioritize the MingCute icon library with the `i-mgc-` prefix. Icons are available in the format `i-mgc-[icon-name]-[style]` where style can be `re` (regular), `fi` (filled), etc.

**Important**: Always try to find an appropriate icon with the `i-mgc-` prefix first. Only use the `i-mingcute-` prefix as a fallback when no suitable `i-mgc-` icon exists.

Examples:

- Preferred: `i-mgc-copy-cute-re`, `i-mgc-external-link-cute-re`
- Fallback only: `i-mingcute-copy-line` (only if no mgc equivalent exists)

## Using Framer Motion

- **LazyMotion Integration**: Project uses Framer Motion with LazyMotion for optimized bundle size
- **Usage Rule**: Always use `m.` instead of `motion.` when creating animated components
- **Import**: `import { m } from 'motion/react'`
- **Examples**: `m.div`, `m.button`, `m.span` (not `motion.div`, `motion.button`, etc.)
- **Benefits**: Reduces bundle size while maintaining all Framer Motion functionality
- **Prefer Spring Presets**: Use predefined spring animations from `@follow/components/constants/spring.js`
- **Available Presets Constants**: `Spring.presets.smooth`, `Spring.presets.snappy`, `Spring.presets.bouncy` (extracted from Apple's spring parameters)
- **Usage Example**: `transition={Spring.presets.smooth}` or `transition={Spring.snappy(0.3, 0.1)}`
- **Customization**: All presets accept optional `duration` and `extraBounce` parameters

## Reusable UI Components

When building UI components, follow this hierarchy:

1. **Check Existing Components First**: Look in `apps/desktop/layer/renderer/src/modules/renderer/components` for app-specific components
2. **Create Reusable Components**: If the component doesn't exist and is **generic/reusable** (not tied to specific app business logic), create it in `packages/internal/components`

### Guidelines for Reusable Components (`packages/internal/components`)

- **Purpose**: Components should be generic and reusable across different apps/contexts
- **No Business Logic**: Avoid coupling with specific app business logic, APIs, or state management
- **Follow All Style Rules**: Must adhere to UIKit colors, MingCute icons (`i-mgc-` prefix), and Framer Motion (`m.` prefix) guidelines
- **Export Pattern**: Export components from appropriate index files for clean imports
- **TypeScript**: Use proper TypeScript interfaces for props and maintain type safety

**Example Structure**:

```
packages/internal/components/
├── ui/           # Basic UI primitives (Button, Input, Modal)
├── layout/       # Layout components (Grid, Stack, Container)
├── feedback/     # User feedback (Toast, Loading, Alert)
└── index.ts      # Main exports
```

**Import Examples**:

```tsx
// Correct - from shared components
import { Button, Modal } from "@follow/components"

// App-specific components stay in name/components
import { FeedList } from "~/modules/name/components"
```

## Glassmorphic Depth Design System

Follow uses a sophisticated glassmorphic depth design system for elevated UI components (modals, toasts, floating panels, etc.). This design provides visual hierarchy through layered transparency and subtle color accents.

### Design Principles

- **Multi-layer Depth**: Create visual depth through stacked transparent layers
- **Subtle Color Accents**: Use brand colors at very low opacity (5-20%) for borders, glows, and backgrounds
- **Refined Blur**: Heavy backdrop blur (backdrop-blur-2xl) for frosted glass effect
- **Minimal Shadows**: Combine multiple soft shadows with accent colors for depth perception
- **Smooth Animations**: Use Spring presets for all transitions

### Color Usage

- **Primary Accent**: `#FF5C00` (orange) at 5-20% opacity for borders, glows, and highlights
- **Border**: `rgba(255, 92, 0, 0.2)` for main borders
- **Inner Glow**: `rgba(255, 92, 0, 0.05)` for subtle radial/linear gradients inside containers
- **Shadows**: Layered shadows with accent tint:
  - `0 8px 32px rgba(255, 92, 0, 0.08)` - large soft glow
  - `0 4px 16px rgba(255, 92, 0, 0.06)` - medium shadow
  - `0 2px 8px rgba(0, 0, 0, 0.1)` - close depth

### Component Structure

```tsx
<div
  className="rounded-2xl backdrop-blur-2xl"
  style={{
    backgroundImage:
      "linear-gradient(to bottom right, rgba(var(--color-background) / 0.98), rgba(var(--color-background) / 0.95))",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255, 92, 0, 0.2)",
    boxShadow:
      "0 8px 32px rgba(255, 92, 0, 0.08), 0 4px 16px rgba(255, 92, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.1)",
  }}
>
  {/* Inner glow layer */}
  <div
    className="absolute inset-0 rounded-2xl"
    style={{
      background:
        "linear-gradient(to bottom right, rgba(255, 92, 0, 0.05), transparent, rgba(255, 92, 0, 0.05))",
    }}
  />

  {/* Content */}
  <div className="relative">{/* Your content here */}</div>
</div>
```

### Interactive Elements

For hover states on buttons or interactive areas within glass containers:

```tsx
<button
  onMouseEnter={(e) => {
    e.currentTarget.style.background =
      "linear-gradient(to right, rgba(255, 92, 0, 0.08), rgba(255, 140, 0, 0.05))"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent"
  }}
>
  {/* Subtle shine effect */}
  <div className="via-gray/5 absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 group-hover:translate-x-full dark:via-white/5" />
</button>
```

### Dividers

Use gradient dividers within glass containers:

```tsx
<div
  className="mx-4 h-px"
  style={{
    background: "linear-gradient(to right, transparent, rgba(255, 92, 0, 0.2), transparent)",
  }}
/>
```

### Animation Guidelines

- Entry animations: `initial={{ y: 8, opacity: 0 }}` → `animate={{ y: 0, opacity: 1 }}`
- Use `Spring.presets.snappy` for quick interactions
- Use `Spring.presets.smooth` for larger movements
- Keep scale animations subtle (1.0 ↔ 1.02)

### When to Use

Apply this design system to:

- Toast notifications
- Modal dialogs
- Floating panels and popovers
- Ambient UI prompts
- Contextual menus
- Elevated cards with actions

### Accessibility

- Ensure sufficient contrast for text over glass backgrounds
- Maintain border visibility in both light and dark modes
- Preserve keyboard focus indicators
- Keep animations respectful of `prefers-reduced-motion`

## Build Outputs

- Desktop: `apps/desktop/out/` for packaged applications
- Web: `apps/desktop/out/web/` for static web assets
