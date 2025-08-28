# PRP: Ratio-Based Color Mixing Tailwind Plugin

## Project Overview

This PRP defines the implementation of a Tailwind CSS plugin that provides ratio-based syntax for color mixing as an alternative to lengthy `color-mix()` CSS declarations. The plugin will transform shortened syntax like `bg-mix-accent/background-7/3` into native CSS `color-mix()` functions.

## Current Problem Analysis

### Existing Usage Patterns

The codebase currently uses verbose arbitrary value syntax for color mixing:

```css
/* Current verbose syntax - 137 characters */
bg-[color-mix(in_srgb,hsl(var(--fo-a)),hsl(var(--background))_70%)]

/* Complex nested mixing - 172 characters */
bg-[color-mix(in_srgb,_color-mix(in_srgb,rgb(var(--color-red)),hsl(var(--background))_80%),transparent_30%)]
```

**Found Usage Locations:**

- `/apps/desktop/layer/renderer/src/modules/ai-chat/components/message/UserChatMessage.tsx:137`
- `/apps/desktop/layer/renderer/src/modules/ai-chat/components/layouts/CollapsibleError.tsx:172`

### Problems Identified

1. **Readability**: Extremely long class names reduce code clarity
2. **Maintainability**: Hard to modify mixing ratios
3. **Performance**: Arbitrary values prevent CSS optimization
4. **Developer Experience**: No IntelliSense support
5. **Consistency**: No standardized mixing ratios across project

## Solution Design

### Ratio-Based Syntax Options

**Primary Syntax (Recommended):**

```css
/* Ratio format: color1/color2-ratio1/ratio2 */
bg-mix-accent/background-7/3  /* 70% accent, 30% background */
bg-mix-red/background-4/1     /* 80% red, 20% background */
border-mix-blue/white-3/2     /* 60% blue, 40% white */
text-mix-accent/background-9/1 /* 90% accent, 10% background */
```

**Alternative Syntax (Percentage-based):**

```css
bg-mix-accent-70    /* 70% accent, 30% background (implicit) */
bg-mix-red-80       /* 80% red, 20% background (implicit) */
```

**Generated CSS Output:**

```css
.bg-mix-accent\/background-7\/3 {
  background-color: color-mix(in srgb, hsl(var(--fo-a)) 70%, hsl(var(--background)) 30%);
}
```

## Technical Implementation

### Plugin Architecture

Based on existing codebase patterns in `/packages/configs/tailwindcss/web.ts`:

```typescript
// New file: /packages/configs/tailwindcss/ratio-mixing-plugin.js
const plugin = require("tailwindcss/plugin")

const ratioMixingPlugin = plugin.withOptions(
  (options = {}) => {
    return ({ addUtilities, theme, e }) => {
      const config = { ...defaultConfig, ...options }
      const utilities = {}

      // Generate ratio-based utilities
      generateRatioBasedUtilities(utilities, config)

      // Generate percentage-based utilities (fallback)
      generatePercentageBasedUtilities(utilities, config)

      addUtilities(utilities)
    }
  },
  (options) => {
    return {
      theme: {
        // Theme extensions if needed
      },
    }
  },
)

module.exports = ratioMixingPlugin
```

### Configuration Schema

```typescript
interface RatioMixingConfig {
  colorSpace?: "srgb" | "hsl" | "oklab" | "oklch"
  baseColors: {
    [key: string]: string // CSS variable or color value
  }
  ratios?: {
    [key: string]: [number, number] // [numerator, denominator] pairs
  }
  variants?: ("bg" | "border" | "text")[]
  prefix?: string
  implicitBackground?: string
}

const defaultConfig: RatioMixingConfig = {
  colorSpace: "srgb",
  baseColors: {
    background: "hsl(var(--background))",
    accent: "hsl(var(--fo-a))",
    red: "rgb(var(--color-red))",
    // Map to existing theme colors from UIKit
  },
  ratios: {
    "1/1": [1, 1], // 50%/50%
    "2/1": [2, 1], // 66.7%/33.3%
    "3/1": [3, 1], // 75%/25%
    "4/1": [4, 1], // 80%/20%
    "7/3": [7, 3], // 70%/30%
    "9/1": [9, 1], // 90%/10%
  },
  variants: ["bg", "border", "text"],
  prefix: "mix",
  implicitBackground: "background",
}
```

### Core Implementation Functions

```javascript
function generateRatioBasedUtilities(utilities, config) {
  const { baseColors, ratios, variants, colorSpace } = config

  // Generate: bg-mix-accent/background-7/3
  Object.entries(baseColors).forEach(([color1Name, color1Value]) => {
    Object.entries(baseColors).forEach(([color2Name, color2Value]) => {
      if (color1Name === color2Name) return // Skip same color mixing

      Object.entries(ratios).forEach(([ratioKey, [num, denom]]) => {
        const percentage1 = Math.round((num / (num + denom)) * 100)
        const percentage2 = 100 - percentage1

        variants.forEach((variant) => {
          const className = `.${variant}-${config.prefix}-${color1Name}\\/${color2Name}-${ratioKey.replace("/", "\\/")}`
          const property = getPropertyName(variant)
          const mixedColor = `color-mix(in ${colorSpace}, ${color1Value} ${percentage1}%, ${color2Value} ${percentage2}%)`

          utilities[className] = { [property]: mixedColor }
        })
      })
    })
  })
}

function generatePercentageBasedUtilities(utilities, config) {
  // Generate: bg-mix-accent-70 (implicit background mixing)
  const { baseColors, variants, colorSpace, implicitBackground } = config
  const backgroundValue = baseColors[implicitBackground]

  const percentages = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95]

  Object.entries(baseColors).forEach(([colorName, colorValue]) => {
    if (colorName === implicitBackground) return

    percentages.forEach((percentage) => {
      variants.forEach((variant) => {
        const className = `.${variant}-${config.prefix}-${colorName}-${percentage}`
        const property = getPropertyName(variant)
        const mixedColor = `color-mix(in ${colorSpace}, ${colorValue} ${percentage}%, ${backgroundValue} ${100 - percentage}%)`

        utilities[className] = { [property]: mixedColor }
      })
    })
  })
}

function getPropertyName(variant) {
  switch (variant) {
    case "bg":
      return "background-color"
    case "border":
      return "border-color"
    case "text":
      return "color"
    default:
      return "background-color"
  }
}
```

### Integration with Existing Config

Update `/packages/configs/tailwindcss/web.ts`:

```typescript
import ratioMixingPlugin from "./ratio-mixing-plugin"

const twConfig = {
  // ... existing config
  plugins: [
    // ... existing plugins
    ratioMixingPlugin({
      baseColors: {
        background: "hsl(var(--background))",
        accent: "hsl(var(--fo-a))",
        red: "rgb(var(--color-red))",
        // Map to UIKit colors already in theme
      },
    }),
  ],
} satisfies Config
```

## Migration Strategy

### Before/After Examples

```jsx
// BEFORE: Verbose arbitrary values
<div className="bg-[color-mix(in_srgb,hsl(var(--fo-a)),hsl(var(--background))_70%)]">
  User message
</div>

// AFTER: Clean ratio syntax
<div className="bg-mix-accent/background-7/3">
  User message
</div>

// ALTERNATIVE: Percentage syntax (when mixing with background)
<div className="bg-mix-accent-70">
  User message
</div>
```

### Migration Steps

1. Install plugin in Tailwind config
2. Generate new utility classes via build
3. Replace existing arbitrary values with new classes
4. Test visual consistency
5. Run lint/typecheck validation

## Implementation Tasks

### Phase 1: Core Plugin Development

1. **Create plugin file structure**
   - Create `/packages/configs/tailwindcss/ratio-mixing-plugin.js`
   - Implement core `plugin.withOptions` structure
   - Add default configuration schema

2. **Implement ratio parsing logic**
   - Create `generateRatioBasedUtilities()` function
   - Handle ratio-to-percentage conversion
   - Support escape characters for CSS class names (`/` → `\/`)

3. **Add percentage fallback**
   - Implement `generatePercentageBasedUtilities()` function
   - Provide implicit background mixing
   - Support common percentage values

### Phase 2: Integration & Configuration

4. **Integrate with existing Tailwind config**
   - Update `/packages/configs/tailwindcss/web.ts`
   - Map to existing UIKit color variables
   - Test build process compatibility

5. **Color mapping to existing theme**
   - Extract colors from current theme configuration
   - Map `--fo-a`, `--background`, `--color-red` variables
   - Ensure compatibility with existing color system

### Phase 3: Migration & Testing

6. **Migrate existing usage**
   - Update `UserChatMessage.tsx:137`
   - Update `CollapsibleError.tsx:172`
   - Search for other arbitrary color-mix usages

7. **Validation & testing**
   - Visual regression testing
   - CSS output verification
   - Build process validation

## Validation Gates

### Build Validation

```bash
# TypeScript compilation
pnpm run typecheck

# Linting validation
pnpm run lint
pnpm run lint:tsl

# Tailwind build test
cd packages/configs/tailwindcss && npx tailwindcss build
```

### Plugin-Specific Validation

```bash
# Test plugin registration
node -e "console.log(require('./packages/configs/tailwindcss/ratio-mixing-plugin.js'))"

# Test CSS generation
echo "@tailwind utilities;" | npx tailwindcss --config packages/configs/tailwindcss/web.ts
```

### Visual Validation

```bash
# Development server test
cd apps/desktop && pnpm run dev:web

# Build verification
pnpm run build:web
```

## Expected Deliverables

1. **Plugin Implementation**
   - `/packages/configs/tailwindcss/ratio-mixing-plugin.js` - Complete plugin
   - Updated `/packages/configs/tailwindcss/web.ts` - Integration

2. **Migration Changes**
   - Updated component files with new class syntax
   - Removed verbose arbitrary value usage

3. **Documentation**
   - Generated CSS class reference
   - Migration guide for future usage

## Risk Assessment & Mitigation

### Potential Issues

1. **CSS Specificity**: New utilities should have same specificity as existing ones
2. **Build Performance**: Plugin should not significantly slow build times
3. **Browser Compatibility**: `color-mix()` requires modern browser support
4. **Class Name Conflicts**: Need to avoid conflicts with existing utilities

### Mitigation Strategies

1. Follow Tailwind's utility layer conventions
2. Implement efficient utility generation (avoid nested loops where possible)
3. Document browser support requirements (IE not supported)
4. Use unique prefixes and test for conflicts

## Success Criteria

1. **Functionality**: All current color mixing usage successfully migrated
2. **Performance**: No measurable build time increase (< 5% overhead)
3. **Maintainability**: New syntax reduces class name length by >60%
4. **Developer Experience**: IntelliSense support for new utilities
5. **Visual Consistency**: Pixel-perfect visual match with existing styling

## External References

### Documentation

- **Tailwind Plugin API**: https://v3.tailwindcss.com/docs/plugins
- **CSS color-mix() Specification**: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
- **Existing Plugin Examples**: https://github.com/JavierM42/tailwindcss-color-mix

### Codebase Files to Reference

- `/packages/configs/tailwindcss/web.ts` - Main Tailwind configuration
- `/packages/configs/tailwindcss/tw-css-plugin.js` - Existing plugin pattern
- `/packages/configs/tailwindcss/tailwind-extend.css` - Utility examples

## Confidence Score: 8/10

**Rationale**: High confidence due to:

- ✅ Clear existing patterns in codebase
- ✅ Well-documented Tailwind plugin API
- ✅ Specific usage examples identified
- ✅ CSS color-mix() is well-supported specification
- ✅ Comprehensive implementation plan

**Potential challenges**:

- ⚠️ CSS class name escaping complexity
- ⚠️ Color variable mapping accuracy
