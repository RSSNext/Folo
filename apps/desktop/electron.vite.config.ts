import { defineConfig } from "electron-vite"
import { resolve } from "pathe"

import { getGitHash } from "../../scripts/lib"
import rendererConfig from "./configs/vite.electron-render.config"

export default defineConfig({
  main: {
    build: {
      outDir: "dist/main",
      lib: {
        entry: "./layer/main/src/index.ts",
      },
    },
    resolve: {
      alias: {
        "@shared": resolve("packages/shared/src"),
        "@pkg": resolve("./package.json"),
        "@locales": resolve("../../locales"),
        "~": resolve("./layer/main/src"),
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
        entry: "./layer/main/preload/index.ts",
      },
    },
    resolve: {
      alias: {
        "@pkg": resolve("./package.json"),
        "@locales": resolve("../../locales"),
      },
    },
  },
  renderer: rendererConfig,
})
