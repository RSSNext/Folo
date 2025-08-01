# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Follow (Folo) is a modern RSS aggregator and content management platform with multiple applications across different platforms. It's built as a monorepo using pnpm workspaces with Turbo for build orchestration.

## Repository Structure

### Applications (`apps/`)

- **`apps/desktop/`** - Electron desktop application with main and renderer processes
- **`apps/mobile/`** - React Native mobile app for iOS and Android
- **`apps/ssr/`** - Server-side rendered web application
- **`apps/mobile/web-app/`** - HTML renderer for mobile web views

### Packages (`packages/`)

- **`packages/internal/`** - Internal shared packages (components, database, hooks, store, etc.)
- **`packages/configs/`** - Shared configuration files (Tailwind, TypeScript)
- **`packages/utils/`** - Utility functions and helpers
- **`packages/readability/`** - Content readability parsing
- **`packages/vite-plugin-route-builder/`** - Custom Vite plugin for route generation

## Essential Commands

### Development

```bash
# Install dependencies (from root)
pnpm install

# Desktop app development (browser - recommended)
cd apps/desktop && pnpm run dev:web

# Desktop app development (Electron)
cd apps/desktop && pnpm run dev:electron

# Mobile app development
cd apps/mobile && pnpm run dev

# SSR development
cd apps/ssr && pnpm run dev

# Build web version
pnpm run build:web
```

### Code Quality

```bash
# Lint all code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# TypeScript linting
pnpm run lint:tsl

# Format code
pnpm run format

# Type checking
pnpm run typecheck

# Run tests
pnpm run test
```

### Package Management

```bash
# Build shared packages
pnpm run build:packages

# Generate i18n templates
pnpm run generator:i18n-template

# Sync icons from SVG to React Native
pnpm run icons:sync
```

## Architecture Guidelines

### Multi-Platform Architecture

- **Desktop**: Electron app with main/renderer processes, using Vite for both
- **Mobile**: React Native with Expo, shared UI components with web
- **Web/SSR**: Next.js-style SSR application for server-side rendering
- **Shared Logic**: Common business logic in `packages/internal/`

### State Management

- **Jotai** for atomic state management across all platforms
- **Zustand** for complex state stores (in `packages/internal/store/`)
- **React Query** for server state management

### Styling

- **Tailwind CSS** for styling across all platforms
- Platform-specific Tailwind configs in each app
- Shared Tailwind utilities in `packages/configs/tailwindcss/`
- **UI Design Style**: Follow Vercel and Linear SaaS UI aesthetics - clean, modern, minimal design with subtle shadows, rounded corners, and excellent typography

#### UIKit Colors for Desktop Components

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

#### Icons

For icon usage, prioritize the MingCute icon library with the `i-mgc-` prefix. Icons are available in the format `i-mgc-[icon-name]-[style]` where style can be `re` (regular), `fi` (filled), etc.

**Important**: Always try to find an appropriate icon with the `i-mgc-` prefix first. Only use the `i-mingcute-` prefix as a fallback when no suitable `i-mgc-` icon exists.

Examples:

- Preferred: `i-mgc-copy-cute-re`, `i-mgc-external-link-cute-re`
- Fallback only: `i-mingcute-copy-line` (only if no mgc equivalent exists)

### Database

- **Drizzle ORM** with SQLite for local data storage
- Platform-specific database implementations in `packages/internal/database/`
- Migration system with versioned SQL files

### Internationalization

- **i18next** for internationalization
- Locale files in `locales/` directory organized by feature
- Custom ESLint rules for i18n validation

#### i18n Writing Guidelines

1. Follow [i18next formatting guidelines](https://www.i18next.com/translation-function/formatting)
2. **Use flat keys only** - Use `.` notation for separation, no nested objects
3. For plural-sensitive languages, use `_one` and `_other` suffixes
4. **Avoid conflicting flat keys** - During build, flat dot-separated keys (e.g., 'exif.custom.rendered.custom') are automatically converted to nested objects, which can cause conflicts. For example, 'exif.custom.rendered.custom' conflicts with 'exif.custom.rendered'. Avoid such patterns.

Example:

```json
{
  "personalize.title": "Personalization",
  "personalize.prompt.label": "Personal Prompt",
  "shortcuts.add": "Add Shortcut",
  "shortcuts.validation.required": "Name and prompt are required"
}
```

## Development Setup Notes

### Prerequisites

- Enable Corepack: `corepack enable && corepack prepare`
- For mobile development: macOS with Xcode required

### Environment Setup

- Copy `.env.example` to `.env` in relevant app directories
- For development, use `VITE_API_URL=https://api.follow.is`
- Browser development uses `https://app.folo.is/__debug_proxy` for API access

### Mobile Development

- iOS development requires Xcode and iOS simulator
- Native module development in `apps/mobile/native/`
- Use `pnpm expo prebuild --clean` for clean builds

## Code Organization Patterns

### Import Conventions

- Use `pathe` instead of `node:path` for cross-platform compatibility
- Shared utilities should be imported from `packages/internal/`
- Platform-specific code should be clearly separated

### Component Structure

- Shared UI components in `packages/internal/components/`
- Platform-specific components in respective app directories
- Use TypeScript interfaces for component props

### Error Handling

- Custom error parsing utilities in `packages/internal/utils/`
- Sentry integration for error reporting across platforms

## Build and Deployment

### Build Outputs

- Desktop: `apps/desktop/out/` for packaged applications
- Web: `apps/desktop/out/web/` for static web assets
- Mobile: Platform-specific build directories

### Turbo Configuration

- Build orchestration via `turbo.json`
- Dependency-aware builds with output caching
- Parallel execution for independent packages

## Testing Strategy

- Vitest for unit testing across packages
- Platform-specific test configurations
- Test files co-located with source code

## Key Dependencies

- **Build**: Vite, Turbo, pnpm workspaces
- **Frontend**: React 19, Electron, React Native, Expo
- **State**: Jotai, Zustand, TanStack Query
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: Drizzle ORM, SQLite
- **Utils**: Day.js, Zod, i18next

## Specialized Agent Usage Guidelines

Claude Code has access to specialized agents for different development tasks. **Always use the most appropriate agent** based on the task requirements:

### 🧭 **tech-lead-orchestrator** (Project Management & Quality)

**Use when:**

- Coordinating complex features across multiple components/platforms
- Conducting project quality assessments and code reviews
- Planning large refactoring efforts or architectural changes
- Breaking down complex tasks into manageable subtasks
- Managing cross-platform consistency and standards

**Examples:** "Implement RSS feed management system", "Review codebase quality", "Plan state management refactor"

### ⚛️ **react-architect** (React Architecture & Performance)

**Use when:**

- Optimizing React component performance and re-rendering issues
- Designing component architecture and data flow patterns
- Implementing complex state management with Jotai/Zustand
- Reviewing React code patterns and best practices
- Solving React-specific performance bottlenecks

**Examples:** "Component re-renders too much", "Design data visualization architecture", "Optimize React Query usage"

### 🎨 **ui-design-engineer** (UI/UX & Components)

**Use when:**

- Creating or modifying UI components with Tailwind CSS
- Implementing animations with Framer Motion
- Following Apple HIG and modern SaaS design patterns
- Ensuring accessibility and responsive design
- Integrating with UIKit color system and design tokens

**Examples:** "Create modal component", "Improve visual hierarchy", "Add micro-interactions"

### 🔗 **platform-integration-specialist** (Cross-Platform Features)

**Use when:**

- Implementing features that work across Electron, React Native, and Web
- Handling platform-specific APIs and native integrations
- Managing cross-platform data synchronization
- Creating unified abstractions for platform differences
- Working with Electron main/renderer processes

**Examples:** "Add notifications across all platforms", "Implement file system access", "Cross-platform deep linking"

### 📰 **content-processing-expert** (RSS & Content Handling)

**Use when:**

- Working with RSS/Atom feed parsing and processing
- Enhancing content extraction and readability
- Implementing content sanitization and security
- Optimizing feed discovery and update mechanisms
- Processing different content types (articles, podcasts, media)

**Examples:** "Fix RSS parsing issues", "Improve article extraction", "Add new feed format support"

### 🗄️ **data-architect** (Database & Data Management)

**Use when:**

- Designing database schemas and migrations with Drizzle ORM
- Optimizing SQLite performance and query efficiency
- Planning data synchronization strategies
- Creating data access patterns and caching layers
- Managing database performance and scaling

**Examples:** "Add user preferences table", "Optimize feed loading queries", "Design migration strategy"

### ⚡ **performance-specialist** (Performance & Optimization)

**Use when:**

- Analyzing and fixing performance issues (memory, CPU, rendering)
- Optimizing Vite build times and bundle sizes
- Implementing code splitting and lazy loading
- Monitoring and improving Core Web Vitals
- Debugging memory leaks and performance bottlenecks

**Examples:** "App feels sluggish", "Bundle size too large", "Memory usage growing"

### 🧪 **test-engineer** (Testing & Quality Assurance)

**Use when:**

- Designing comprehensive testing strategies
- Implementing unit, integration, and E2E tests
- Setting up test automation and CI/CD testing
- Fixing flaky tests and improving test reliability
- Creating testing utilities and mock strategies

**Examples:** "Add tests for AI chat feature", "Fix failing test suite", "Improve test coverage"

### 🎯 **Agent Selection Guidelines**

**For multi-domain tasks**, start with **tech-lead-orchestrator** to coordinate other agents.

**Common combinations:**

- New feature: `tech-lead-orchestrator` → `ui-design-engineer` + `data-architect` + `test-engineer`
- Performance issues: `performance-specialist` + `react-architect`
- Content problems: `content-processing-expert` + `data-architect`
- Cross-platform features: `platform-integration-specialist` + `tech-lead-orchestrator`

**Always specify the agent explicitly** when the task matches their domain expertise.

## Agent Usage Notes

- **Primary web app is at `@apps/desktop/layer/renderer`** - A Vite + React SPA, not full Electron features
- **SSR app is minimal** - Only for external sharing pages, not main development focus
- **Mobile app** - React Native with Expo for iOS/Android
- **Always use Task tool with appropriate agent** - Don't implement complex features directly, delegate to specialized agents
