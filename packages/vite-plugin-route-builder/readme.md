# Vite Route Builder Plugin - Technical Documentation

## Overview

The Vite Route Builder plugin is a build-time code generation tool that creates React Router route configurations from a file system-based routing structure, similar to Next.js App Router. It transforms a `pages/` directory structure into optimized route objects with lazy loading and proper component imports.

## Core Architecture

### Plugin Flow

1. **Build-time Generation**: The plugin runs during Vite's build process to generate static route configurations
2. **File System Scanning**: Uses glob patterns to discover page and layout files
3. **Route Tree Building**: Leverages the existing `route-builder.ts` logic to create route hierarchy
4. **Code Generation**: Produces a TypeScript file with lazy-loaded route objects

### Key Components

- **`vite-plugin-route-builder.ts`**: Main Vite plugin implementation
- **`route-builder.ts`**: Core routing logic for transforming file paths to route objects
- **`generated-routes.ts`**: Auto-generated output file containing route configurations

## File System Routing Conventions

### Directory Structure

```
pages/
├── (main)/                 # Route group (doesn't affect URL path)
│   ├── layout.tsx         # Layout component for grouped routes
│   ├── index.tsx          # / route
│   └── discover.tsx       # /discover route
├── settings/
│   ├── layout.tsx         # Layout for /settings/*
│   ├── index.tsx          # /settings route
│   └── profile.tsx        # /settings/profile route
├── (settings)/            # Another route group
│   ├── layout.tsx         # Layout component
│   └── general.tsx        # /general route
└── [...404].tsx          # Catch-all route
```

### Route Mapping Rules

1. **Index Routes**: `index.tsx` files create routes for their parent directory path
2. **Named Routes**: File names become route paths (e.g., `profile.tsx` → `/profile`)
3. **Grouped Routes**: Directories with parentheses `(name)` group routes without affecting URL paths
4. **Dynamic Routes**: `[param].tsx` creates dynamic parameter routes
5. **Catch-all Routes**: `[...name].tsx` creates catch-all routes
6. **Layouts**: `layout.tsx` files provide wrapper components for child routes
7. **Sync Loading**: Files with `.sync.tsx` extension are loaded synchronously instead of lazy loading

### Synchronous vs Asynchronous Loading

The plugin supports two loading strategies:

- **Asynchronous Loading (default)**: Files with `.tsx` extension are lazy-loaded for optimal performance
- **Synchronous Loading**: Files with `.sync.tsx` extension are imported directly and loaded synchronously

```
pages/
├── home.tsx              # Lazy loaded: const lazy1 = () => import("./pages/home")
├── critical.sync.tsx     # Sync loaded: import SyncComponent1 from "./pages/critical"
└── settings/
    ├── layout.sync.tsx   # Sync loaded layout
    └── profile.tsx       # Lazy loaded page
```

#### When to Use Sync Loading

Use `.sync.tsx` extension for:

- Critical above-the-fold components
- Small, lightweight components that don't benefit from code splitting
- Components that need to be immediately available (no loading state)
- Layout components that are always needed

## Implementation Details

### 1. Route Discovery Process

```typescript
// Plugin discovers files using glob patterns
const pageFiles = glob.sync("./src/pages/**/*.{ts,tsx}", {
  ignore: ["**/*.d.ts", "**/*.test.*", "**/*.spec.*"],
})
```

### 2. Route Tree Generation

The plugin uses the existing `route-builder.ts` logic:

```typescript
import { buildRoute } from "../route-builder"

// Transform file paths to route objects
const routes = buildRoute(pageFiles)
```

### 3. Path Resolution Strategy

The plugin implements sophisticated path matching to connect route objects with their corresponding files:

```typescript
function findFileForRoute(route: RouteObject, pageFiles: string[]): string | null {
  const routePath = route.handle?.fs as string
  if (!routePath) return null

  // Strategy 1: Direct file match (fs.tsx)
  let targetFile = `./src/pages/${routePath}.tsx`
  if (pageFiles.includes(targetFile)) return targetFile

  // Strategy 2: Layout file for grouped routes (fs/layout.tsx)
  targetFile = `./src/pages/${routePath}/layout.tsx`
  if (pageFiles.includes(targetFile)) return targetFile

  // Strategy 3: Index file (fs/index.tsx)
  targetFile = `./src/pages/${routePath}/index.tsx`
  if (pageFiles.includes(targetFile)) return targetFile

  // Strategy 4: Handle paths ending with '/' (index pages)
  if (routePath.endsWith("/")) {
    const cleanPath = routePath.slice(0, -1)
    targetFile = `./src/pages/${cleanPath}/index.tsx`
    if (pageFiles.includes(targetFile)) return targetFile
  }

  return null
}
```

### 4. Loading Strategy Implementation

The plugin generates different import strategies based on file extensions:

#### Asynchronous Loading (.tsx files)

```typescript
// Generate lazy imports for .tsx files
const lazyComponents = new Map<string, string>()
let lazyCounter = 1

function collectLazyFunctions(route: RouteObject, pageFiles: string[]) {
  const file = findFileForRoute(route, pageFiles)
  if (file && !file.endsWith(".sync.tsx") && !lazyComponents.has(file)) {
    const relativePath = path.relative(
      path.dirname("./src/generated-routes.ts"),
      file.replace("./src/", "./src/"),
    )
    const varName = `LazyComponent${lazyCounter++}`
    lazyComponents.set(file, varName)

    return `const ${varName} = () => import("${relativePath}")`
  }
}
```

#### Synchronous Loading (.sync.tsx files)

```typescript
// Generate direct imports for .sync.tsx files
const syncComponents = new Map<string, string>()
let syncCounter = 1

function collectSyncImports(route: RouteObject, pageFiles: string[]) {
  const file = findFileForRoute(route, pageFiles)
  if (file && file.endsWith(".sync.tsx") && !syncComponents.has(file)) {
    const relativePath = path.relative(
      path.dirname("./src/generated-routes.ts"),
      file.replace("./src/", "./src/"),
    )
    const varName = `SyncComponent${syncCounter++}`
    syncComponents.set(file, varName)

    return `import ${varName} from "${relativePath}"`
  }
}
```

#### Route Object Assignment

Routes use different properties based on loading strategy:

```typescript
function assignComponentToRoute(route: RouteObject, file: string) {
  if (file.endsWith(".sync.tsx")) {
    // Sync components use Component property
    route.Component = syncComponents.get(file)
  } else {
    // Async components use lazy property
    route.lazy = lazyComponents.get(file)
  }
}
```

### 5. Code Generation

The final step generates a complete TypeScript file:

```typescript
const output = `
// Do not edit manually
/* eslint-disable */
// @ts-nocheck

import type { RouteObject } from "react-router"
import { lazy } from "react"

${lazyImports.join("\n")}

export const routes: RouteObject[] = ${serializedRoutes}
`
```

## Route Object Structure

### Generated Route Format

```typescript
interface RouteObject {
  path?: string
  index?: boolean
  children?: RouteObject[]
  element?: React.ComponentType
  // Internal properties removed in final output
  handle?: { fs: string } // Removed during serialization
}
```

### Example Generated Output

```typescript
// Synchronous imports (loaded immediately)
import SyncComponent1 from "./pages/(main)/layout"
import SyncComponent2 from "./pages/critical-page"

// Asynchronous imports (lazy loaded)
const LazyComponent1 = () => import("./pages/(main)/index")
const LazyComponent2 = () => import("./pages/settings/layout")
const LazyComponent3 = () => import("./pages/settings/profile")

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: SyncComponent1, // Sync loaded layout
    children: [
      {
        index: true,
        lazy: LazyComponent1, // Lazy loaded page
      },
      {
        path: "critical",
        Component: SyncComponent2, // Sync loaded critical page
      },
    ],
  },
  {
    path: "/settings",
    lazy: LazyComponent2, // Lazy loaded layout
    children: [
      {
        path: "profile",
        lazy: LazyComponent3, // Lazy loaded page
      },
    ],
  },
]
```

## Problem Solving Approach

### Common Issues and Solutions

1. **Path Mismatch**: Routes generated without corresponding lazy functions

   - **Solution**: Enhanced file matching with multiple strategies and path normalization

2. **Incorrect Import Paths**: Absolute paths causing import failures

   - **Solution**: Proper relative path calculation using `path.relative()`

3. **Unused Lazy Variables**: Too many lazy imports for non-existent files

   - **Solution**: Only generate lazy imports for routes with actual file matches

4. **Index Route Handling**: Paths ending with `/` causing mapping issues
   - **Solution**: Special handling for index pages and path cleaning

### Debugging Strategy

The plugin includes comprehensive logging for troubleshooting:

```typescript
console.log("📁 Page files found:", pageFiles.length)
console.log("🎯 Routes with lazy functions:", routesWithLazy)
console.log("📝 Generated lazy imports:", lazyComponents.size)
```

## Performance Considerations

### Build-time Optimization

- **Static Generation**: All routing logic runs at build time, not runtime
- **Lazy Loading**: Components are loaded on-demand, reducing initial bundle size
- **Tree Shaking**: Unused routes and components are eliminated during bundling

### Memory Efficiency

- **File Caching**: Plugin processes files once and caches results
- **Selective Import**: Only imports files that are actually used in routes

## Configuration Options

The plugin accepts the following configuration options:

### RouteBuilderPluginOptions

```typescript
interface RouteBuilderPluginOptions {
  /** Page files glob pattern */
  pagePattern?: string
  /** Output path for generated routes */
  outputPath?: string
  /** Whether to enable in dev mode */
  enableInDev?: boolean
  /** Custom file to route path transformation logic */
  transformPath?: (path: string) => string
  /** Whether to disable logging */
  debug?: boolean
  /** Custom order for segment groups in route tree. Array of group names (without parentheses). Default: filesystem order */
  segmentGroupOrder?: string[]
}
```

### Option Descriptions

- **`pagePattern`** (default: `"./pages/**/*.{tsx,sync.tsx}"`): Glob pattern for discovering page files
- **`outputPath`** (default: `"./src/generated-routes.ts"`): Output path for the generated route configuration
- **`enableInDev`** (default: `true`): Whether to enable route generation in development mode
- **`transformPath`**: Custom function to transform file paths before route generation
- **`debug`** (default: `false`): Enable detailed logging for troubleshooting
- **`segmentGroupOrder`** (default: `[]`): Custom ordering for route segment groups

### Segment Group Ordering

By default, route groups (directories with parentheses like `(main)`, `(external)`) are ordered alphabetically based on the filesystem. The `segmentGroupOrder` option allows you to specify a custom order:

```typescript
// Example: Place (main) routes before (external) routes
routeBuilder({
  segmentGroupOrder: ["main", "external"], // Without parentheses
})

// Or with parentheses (both formats supported)
routeBuilder({
  segmentGroupOrder: ["(main)", "(external)"], // With parentheses
})
```

#### Default Behavior (Filesystem Order)

```
pages/
├── (admin)/        # Third
├── (external)/     # First (alphabetically)
├── (main)/         # Second
└── (settings)/     # Fourth
```

#### With Custom Order

```typescript
// Configuration
segmentGroupOrder: ['main', 'admin']

// Result:
pages/
├── (main)/         # First (specified in order)
├── (admin)/        # Second (specified in order)
├── (external)/     # Third (not specified, filesystem order)
└── (settings)/     # Fourth (not specified, filesystem order)
```

#### Usage Examples

```typescript
// Basic usage with default options
import routeBuilder from "./vite-plugin-route-builder"

export default defineConfig({
  plugins: [routeBuilder()],
})

// Advanced configuration with parentheses format
export default defineConfig({
  plugins: [
    routeBuilder({
      pagePattern: "./src/pages/**/*.{tsx,sync.tsx}",
      outputPath: "./src/router/generated-routes.ts",
      enableInDev: true,
      debug: true,
      segmentGroupOrder: ["(main)", "(dashboard)", "(settings)", "(external)"],
      transformPath: (path) => path.replace(/\.sync\.tsx$/, ".tsx"),
    }),
  ],
})

// Mixed format is also supported
export default defineConfig({
  plugins: [
    routeBuilder({
      segmentGroupOrder: ["(main)", "dashboard", "settings", "(external)"],
    }),
  ],
})
```

## Integration Points

### Vite Integration

```typescript
// vite.config.ts
import { defineConfig } from "vite"
import routeBuilder from "./plugins/vite/vite-plugin-route-builder"

export default defineConfig({
  plugins: [
    routeBuilder(), // Add the route builder plugin
    // ... other plugins
  ],
})
```

### React Router Integration

```typescript
// App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './generated-routes'

const router = createBrowserRouter(routes)

export default function App() {
  return <RouterProvider router={router} />
}
```

## Future Enhancements

### Potential Improvements

1. **Watch Mode**: Real-time route regeneration during development
2. **TypeScript Validation**: Compile-time route validation
3. **Route Metadata**: Support for route-level metadata and guards
4. **Custom Conventions**: Configurable file naming conventions
5. **Nested Layouts**: Support for multiple layout levels

### Extensibility

The plugin architecture allows for easy extension:

- Custom file processors for different route types
- Pluggable path resolution strategies
- Configurable code generation templates
- Integration with other meta-frameworks

## Conclusion

The Vite Route Builder plugin successfully transforms file system-based routing into optimized React Router configurations. By leveraging build-time generation, it provides excellent performance while maintaining developer ergonomics similar to Next.js App Router. The robust path matching and lazy loading implementation ensures reliable route generation for complex application structures.

## License

2025 © Innei, Released under the MIT License.

> [Personal Website](https://innei.in/) · GitHub [@Innei](https://github.com/innei/)
