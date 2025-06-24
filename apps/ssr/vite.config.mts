import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { codeInspectorPlugin } from "code-inspector-plugin"
import { tsImport } from "tsx/esm/api"
import { defineConfig } from "vite"

import { viteRenderBaseConfig } from "../desktop/configs/vite.render.config"
import { astPlugin } from "../desktop/plugins/vite/ast"

const routeBuilderPluginV2 = await tsImport(
  "@follow-app/vite-plugin-route-builder",
  import.meta.url,
).then((m) => m.default)

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
    routeBuilderPluginV2({
      pagePattern: `${resolve(__dirname, "./client/pages")}/**/*.tsx`,
      outputPath: `${resolve(__dirname, "./client/generated-routes.ts")}`,
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
