import { resolve } from "node:path"

import { defineConfig } from "electron-vite"

import { getGitHash } from "../../scripts/lib"
import { viteRenderBaseConfig } from "./configs/vite.render.config"
import { cleanupUnnecessaryFilesPlugin } from "./plugins/vite/cleanup"
import { createPlatformSpecificImportPlugin } from "./plugins/vite/specific-import"

export default defineConfig({
  main: {
    build: {
      outDir: "dist/main",
      lib: {
        entry: "./src/main/src/index.ts",
      },
    },
    resolve: {
      alias: {
        "@shared": resolve("packages/shared/src"),
        "@pkg": resolve("./package.json"),
        "@locales": resolve("../../locales"),
        "~": resolve("./src/main/src"),
      },
    },
    define: {
      ELECTRON: "true",
      GIT_COMMIT_HASH: JSON.stringify(getGitHash()),
    },
  },
  preload: {
    build: {
      outDir: "dist/preload",
      lib: {
        entry: "./src/main/preload/index.ts",
      },
    },
    resolve: {
      alias: {
        "@pkg": resolve("./package.json"),
        "@locales": resolve("../../locales"),
      },
    },
  },
  renderer: {
    ...viteRenderBaseConfig,

    root: "src/renderer",
    build: {
      outDir: "dist/renderer",
      sourcemap: !!process.env.CI,
      target: "esnext",
      rollupOptions: {
        input: {
          main: resolve("./src/renderer/index.html"),
        },
      },
      minify: true,
    },

    plugins: [
      ...viteRenderBaseConfig.plugins,
      createPlatformSpecificImportPlugin("electron"),
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

    define: {
      ...viteRenderBaseConfig.define,
      ELECTRON: "true",
    },
  },
})
