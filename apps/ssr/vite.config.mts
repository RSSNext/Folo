import { resolve } from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { viteRenderBaseConfig } from "../desktop/configs/vite.render.config"
import { astPlugin } from "../desktop/plugins/vite/ast"

export default () => {
  return defineConfig({
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
    plugins: [react(), astPlugin],

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
}
