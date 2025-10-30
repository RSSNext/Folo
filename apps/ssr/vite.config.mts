import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { codeInspectorPlugin } from "code-inspector-plugin"
import { dirname, resolve } from "pathe"
import { defineConfig } from "vite"
import { routeBuilderPlugin } from "vite-plugin-route-builder"

import { viteRenderBaseConfig } from "../desktop/configs/vite.render.config"
import { astPlugin } from "../desktop/plugins/vite/ast"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@pkg": resolve(__dirname, "../../package.json"),
      "@client": resolve(__dirname, "./client"),
      "@locales": resolve(__dirname, "../../locales"),
    },
  },
  define: {
    ...viteRenderBaseConfig.define,
    ELECTRON: "false",
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: "dist-external/[name].[hash].[ext]",
        chunkFileNames: "dist-external/[name].[hash].js",
        entryFileNames: "dist-external/[name].[hash].js",
      },
    },
  },
  plugins: [
    routeBuilderPlugin({
      pagePattern: "client/pages/**/*.tsx",
      outputPath: "client/generated-routes.ts",
      enableInDev: true,
      segmentGroupOrder: ["(main)", "(login)"],
    }),
    react(),
    astPlugin,
    codeInspectorPlugin({
      bundler: "vite",
      editor: "cursor",
      hotKeys: ["altKey"],
    }),
  ],

  server: {
    proxy: {
      "/api": {
        target: "https://api.follow.is",
        changeOrigin: true,
        rewrite(path) {
          return path.replace("/api", "")
        },
      },
    },
  },
})
