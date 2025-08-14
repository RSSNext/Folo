# Mobile App Development Guide

This file provides specific guidance for developing the React Native mobile application.

## Architecture

- **React Native** with Expo for cross-platform mobile development
- **Native modules** in `native/` for platform-specific functionality
- **Web views** in `web-app/` for HTML rendering within the mobile app
- **Shared components** with the desktop app through `packages/internal/`

## Development Commands

```bash
# Start Expo development server
pnpm run dev

# Start with specific platform
pnpm run ios
pnpm run android

# Clean rebuild (useful for native module changes)
pnpm expo prebuild --clean
```

## UIKit Colors for React Native Components

For react native components (`apps/mobile/**/*`), use Apple UIKit color system with Tailwind classes. **Important**: Always use the correct Tailwind prefix for each color category:

### System Colors

- Background: `system-background`, `secondary-system-background`, `tertiary-system-background`
- Grouped: `system-grouped-background`, `secondary-system-grouped-background`, `tertiary-system-grouped-background`
- Labels: `label`, `secondary-label`, `tertiary-label`, `quaternary-label`
- Fills: `system-fill`, `secondary-system-fill`, `tertiary-system-fill`, `quaternary-system-fill`
- Separators: `separator`, `opaque-separator`, `non-opaque-separator`

### Semantic Colors

- Core: `red`, `orange`, `yellow`, `green`, `mint`, `teal`, `cyan`, `blue`, `indigo`, `purple`, `pink`, `brown`
- Grays: `gray`, `gray2`, `gray3`, `gray4`, `gray5`, `gray6`
- Interactive: `link`, `placeholder-text`

These colors automatically adapt to light/dark mode following Apple's design system. Remember to use the appropriate prefix (`text-`, `bg-`, `border-`) based on the CSS property you're styling.
