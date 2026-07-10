import react from "@vitejs/plugin-react"
import path from "pathe"
import { defineConfig } from "vite"

export default defineConfig({
  base: "",
  build: {
    outDir: path.resolve(import.meta.dirname, "../../../../out/rn-web/html-renderer"),
  },
  resolve: {
    alias: [
      {
        find: /^tailwindcss$/,
        replacement: path.resolve(
          import.meta.dirname,
          "../../../../node_modules/tailwindcss/index.css",
        ),
      },
      {
        find: "~",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
  define: {
    ELECTRON: "false",
  },
  plugins: [react({})],
})
