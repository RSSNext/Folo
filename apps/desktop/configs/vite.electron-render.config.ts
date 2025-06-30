import { dirname } from "node:path"
import { resolve } from "node:path/posix"
import { fileURLToPath } from "node:url"

import { tsImport } from "tsx/esm/api"
import type { UserConfig } from "vite"

import { cleanupUnnecessaryFilesPlugin } from "../plugins/vite/cleanup"
import { createPlatformSpecificImportPlugin } from "../plugins/vite/specific-import"
import { viteRenderBaseConfig } from "./vite.render.config"

const routeBuilderPluginV2 = await tsImport(
  "@follow-app/vite-plugin-route-builder",
  import.meta.url,
).then((m) => m.default)

const root = resolve(fileURLToPath(dirname(import.meta.url)), "..")

const VITE_ROOT = resolve(root, "layer/renderer")
export default {
  ...viteRenderBaseConfig,

  plugins: [
    ...viteRenderBaseConfig.plugins,
    createPlatformSpecificImportPlugin("electron"),
    routeBuilderPluginV2({
      pagePattern: "src/pages/**/*.tsx",
      outputPath: "src/generated-routes.ts",
      enableInDev: true,
    }),
    cleanupUnnecessaryFilesPlugin([
      "og-image.png",
      "icon-512x512.png",
      "opengraph-image.png",
      "favicon.ico",
      "icon-192x192.png",
      "favicon-dev.ico",
      "apple-touch-icon-180x180.png",
      "maskable-icon-512x512.png",
      "pwa-64x64.png",
      "pwa-192x192.png",
      "pwa-512x512.png",
    ]),
  ],

  root: VITE_ROOT,
  build: {
    outDir: resolve(root, "dist/renderer"),
    sourcemap: !!process.env.CI,
    target: "esnext",
    rollupOptions: {
      input: {
        main: resolve(VITE_ROOT, "index.html"),
      },
    },
    minify: true,
  },
  define: {
    ...viteRenderBaseConfig.define,
    ELECTRON: "true",
  },
} satisfies UserConfig
