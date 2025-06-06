import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { sentryVitePlugin } from "@sentry/vite-plugin"
import react from "@vitejs/plugin-react"
import { codeInspectorPlugin } from "code-inspector-plugin"
import { prerelease } from "semver"
import type { UserConfig } from "vite"

import { getGitHash } from "../../../scripts/lib"
import { astPlugin } from "../plugins/vite/ast"
import { circularImportRefreshPlugin } from "../plugins/vite/hmr"
import { customI18nHmrPlugin } from "../plugins/vite/i18n-hmr"
import { localesPlugin } from "../plugins/vite/locales"
import i18nCompleteness from "../plugins/vite/utils/i18n-completeness"

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const pkg = JSON.parse(readFileSync(resolve(pkgDir, "./package.json"), "utf8"))
const isCI = process.env.CI === "true" || process.env.CI === "1"

const getChangelogFileContent = () => {
  const { version: pkgVersion } = pkg
  const isDev = process.env.NODE_ENV === "development"
  // get major-minor-patch, e.g. 0.2.0-beta.2 -> 0.2.0
  const version = pkgVersion.split("-")[0]
  try {
    return readFileSync(resolve(pkgDir, "./changelog", `${isDev ? "next" : version}.md`), "utf8")
  } catch {
    return ""
  }
}

const changelogFile = getChangelogFileContent()
export const viteRenderBaseConfig = {
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["sqlocal"],
  },
  resolve: {
    alias: {
      "~": resolve("layer/renderer/src"),
      "@pkg": resolve("package.json"),
      "@locales": resolve("../../locales"),
      "@follow/electron-main": resolve("layer/main/src"),
    },
  },
  base: "/",

  plugins: [
    {
      name: "import-sql",
      transform(code, id) {
        if (id.endsWith(".sql")) {
          const json = JSON.stringify(code)
            .replaceAll("\u2028", "\\u2028")
            .replaceAll("\u2029", "\\u2029")

          return {
            code: `export default ${json}`,
          }
        }
      },
    },
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
          next()
        })
      },
    },
    react({
      // jsxImportSource: "@welldone-software/why-did-you-render", // <-----
    }),
    circularImportRefreshPlugin(),

    codeInspectorPlugin({
      bundler: "vite",
      hotKeys: ["altKey"],
      editor: "cursor",
    }),
    sentryVitePlugin({
      org: "follow-rg",
      project: "follow",
      disable: !isCI,
      bundleSizeOptimizations: {
        excludeDebugStatements: true,

        // Only relevant if you added `replayIntegration`
        excludeReplayIframe: true,
        excludeReplayShadowDom: true,
        excludeReplayWorker: true,
      },
      moduleMetadata: {
        appVersion: process.env.NODE_ENV === "development" ? "dev" : pkg.version,
        electron: false,
      },
      sourcemaps: {
        filesToDeleteAfterUpload: [
          "out/web/assets/*.js.map",
          "out/web/vendor/*.js.map",
          "out/rn-web/assets/*.js.map",
          "out/rn-web/vendor/*.js.map",
          "dist/renderer/assets/*.js.map",
          "dist/renderer/vendor/*.css.map",
        ],
      },
    }),

    localesPlugin(),
    astPlugin,
    customI18nHmrPlugin(),
  ],
  define: {
    APP_VERSION: JSON.stringify(pkg.version),
    APP_NAME: JSON.stringify(pkg.productName),
    APP_DEV_CWD: JSON.stringify(process.cwd()),

    GIT_COMMIT_SHA: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || getGitHash()),

    RELEASE_CHANNEL: JSON.stringify((prerelease(pkg.version)?.[0] as string) || "stable"),

    DEBUG: process.env.DEBUG === "true",

    I18N_COMPLETENESS_MAP: JSON.stringify({ ...i18nCompleteness, en: 100 }),
    CHANGELOG_CONTENT: JSON.stringify(changelogFile),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
} satisfies UserConfig
