# Vite Plugin Route Builder - Tests

This document describes the test suite for the `@follow/vite-plugin-route-builder` package.

## Test Structure

### Core Route Building (`src/__tests__/route-builder.test.ts`)

Tests the core route building logic from `utils/route-builder.ts`:

- **Simple file structure**: Basic index and named pages
- **Grouped routes**: Routes with `(group)` syntax
- **Nested routes**: Multi-level directory structures
- **Dynamic routes**: `[param]` and `[...spread]` syntax
- **Sync loading**: `.sync.tsx` files that should be loaded synchronously
- **File prioritization**: Sync files take precedence over async files

### Vite Plugin Integration (`src/__tests__/vite-plugin.test.ts`)

Tests the Vite plugin interface and lifecycle:

- **Plugin creation**: Default and custom options
- **File discovery**: Finding page files with glob patterns
- **Build lifecycle**: `configResolved` and `buildStart` hooks
- **Dev mode**: File watching and hot reload
- **Code generation**: Output file creation and logging

### Code Generation (`src/__tests__/code-generation.test.ts`)

Tests the route code generation logic:

- **Import statements**: Sync (`import * as`) vs async (`const lazy = () => import()`)
- **Route transformation**: Converting internal structures to React Router format
- **String processing**: Template replacement and cleanup
- **File content**: Complete generated file structure

### Route Builder Utils (`src/utils/route-builder.test.ts`)

Tests the utility functions:

- **Basic routing**: Simple file-to-route mapping
- **Sync flag**: Ensuring `.sync.tsx` files get marked correctly

## Test Features

### Mocking

- File system operations (`writeFileSync`)
- Fast-glob for file discovery
- Vite plugin hooks and configuration

### Sync vs Async Testing

Key feature of the plugin is distinguishing between:

- **Async files** (`.tsx`): Lazy loaded with `() => import()`
- **Sync files** (`.sync.tsx`): Synchronously imported with `import * as`

### Code Generation Validation

Tests ensure generated code:

- Has correct import syntax for both sync and async
- Removes undefined loader properties
- Formats route objects properly
- Includes necessary TypeScript annotations

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:run

# Run specific test file
npm run test:run src/__tests__/route-builder.test.ts
```

## Test Coverage

The test suite covers:

- ✅ Core route building logic
- ✅ Plugin lifecycle and integration
- ✅ Code generation and templating
- ✅ Sync vs async file handling
- ✅ Error scenarios and edge cases
- ✅ File watching and dev mode

All tests use Vitest with Node.js environment for proper file system mocking.
