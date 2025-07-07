import { defineConfig } from "vite"

import { routeBuilderPluginV2 } from "./src/vite-plugin-route-builder"

export default defineConfig({
  plugins: [
    routeBuilderPluginV2({
      // Glob pattern for page files
      pagePattern: "./src/pages/**/*.{tsx,sync.tsx}",

      // Output path for generated routes
      outputPath: "./src/generated-routes.ts",

      // Enable in dev mode for hot reload
      enableInDev: true,

      // Debug logging
      debug: true,

      // Custom segment group ordering: main routes first, then admin, then external
      // Both formats supported: with or without parentheses
      segmentGroupOrder: ["(main)", "(admin)", "(external)"],

      // Optional: transform file paths
      transformPath: (path: string) => {
        // Example: rename admin pages
        return path.replace("/admin/", "/dashboard/")
      },
    }),
  ],
})

/* 
File structure example:

src/pages/
├── index.tsx              → / (lazy loaded)
├── about.tsx              → /about (lazy loaded)
├── critical.sync.tsx      → /critical (sync loaded)
├── settings/
│   ├── layout.tsx         → /settings (lazy loaded)
│   ├── index.tsx          → /settings/ (lazy loaded)
│   └── profile.sync.tsx   → /settings/profile (sync loaded)
├── (main)/                → Route group (sorted first due to segmentGroupOrder)
│   ├── layout.tsx         → / (lazy loaded)
│   └── dashboard.tsx      → /dashboard (lazy loaded)
├── (admin)/               → Route group (sorted second due to segmentGroupOrder)
│   ├── layout.tsx         → / (lazy loaded)
│   └── users.tsx          → /users (lazy loaded)
└── (external)/            → Route group (sorted third due to segmentGroupOrder)
    ├── layout.tsx         → / (lazy loaded)
    └── api-docs.tsx       → /api-docs (lazy loaded)

Generated output (route groups ordered by segmentGroupOrder):

import * as SyncComponent0 from "./pages/critical.sync"
import * as SyncComponent1 from "./pages/settings/profile.sync"
const lazy0 = () => import("./pages/index")
const lazy1 = () => import("./pages/about")
const lazy2 = () => import("./pages/(main)/layout")
const lazy3 = () => import("./pages/(admin)/layout")
const lazy4 = () => import("./pages/(external)/layout")
// ... more imports

export const routes: RouteObject[] = [
  // Non-grouped routes first
  {
    path: "",
    lazy: lazy0,
  },
  {
    path: "critical",
    Component: SyncComponent0.Component,
    loader: SyncComponent0.loader,
  },
  // Route groups ordered by segmentGroupOrder: main, admin, external
  {
    path: "",
    lazy: lazy2, // (main) group layout
    children: [] // main routes
  },
  {
    path: "",
    lazy: lazy3, // (admin) group layout  
    children: [] // admin routes
  },
  {
    path: "",
    lazy: lazy4, // (external) group layout
    children: [] // external routes
  },
  // ... more routes
]
*/
