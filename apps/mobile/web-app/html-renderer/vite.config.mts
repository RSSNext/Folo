import react from "@vitejs/plugin-react"
import path from "pathe"
import { defineConfig } from "vite"

import { viteRenderBaseConfig } from "../../../desktop/configs/vite.render.config"
import { astPlugin } from "../../../desktop/plugins/vite/ast"

export default defineConfig({
  ...viteRenderBaseConfig,
  base: "",
  build: {
    outDir: path.resolve(import.meta.dirname, "../../../../out/rn-web/html-renderer"),
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },

  plugins: [react({}), astPlugin],
})
