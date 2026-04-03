import { execSync } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"

import type { ElectronApplication, Page } from "@playwright/test"
import { _electron as electron } from "@playwright/test"
import { join } from "pathe"

import type { DesktopE2EEnv } from "./env"

let buildSignature: string | null = null

const ensureElectronBuilt = (env: DesktopE2EEnv) => {
  const nextSignature = `${env.apiURL}|${env.webURL}`
  if (buildSignature === nextSignature) {
    return
  }

  execSync("pnpm run build:electron-vite", {
    cwd: env.desktopAppDir,
    env: {
      ...process.env,
      VITE_API_URL: env.apiURL,
      VITE_WEB_URL: env.webURL,
    },
    stdio: "inherit",
  })

  buildSignature = nextSignature
}

export const launchElectronApp = async (env: DesktopE2EEnv) => {
  ensureElectronBuilt(env)

  const userDataDir = await mkdtemp(join(tmpdir(), "folo-e2e-"))
  const electronApp = await electron.launch({
    args: [env.desktopAppDir],
    cwd: env.desktopAppDir,
    env: {
      ...process.env,
      CI: process.env.CI ?? "1",
      NODE_ENV: "test",
      VITE_API_URL: env.apiURL,
      VITE_WEB_URL: env.webURL,
      FOLO_E2E_USER_DATA_DIR: userDataDir,
    },
    timeout: 120_000,
  })

  const page = await electronApp.firstWindow()
  await page.waitForLoadState("domcontentloaded")
  await page.evaluate(() => {
    window.__FOLO_E2E_RECAPTCHA_TOKEN__ = "e2e-token"

    const originalFetch = globalThis.fetch.bind(globalThis)
    const authEndpoints = [
      "/better-auth/sign-in/email",
      "/better-auth/sign-up/email",
      "/better-auth/forget-password",
    ]

    globalThis.fetch = async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init)
      const requestURL = new URL(request.url, globalThis.location.origin)
      const shouldInjectToken = authEndpoints.some((path) => requestURL.pathname.includes(path))

      if (!shouldInjectToken) {
        return originalFetch(input, init)
      }

      const headers = new Headers(request.headers)
      if (!headers.has("x-token")) {
        headers.set("x-token", "r3:e2e-token")
      }

      return originalFetch(new Request(request, { headers }))
    }
  })

  return {
    electronApp,
    page,
    userDataDir,
  }
}

export const closeElectronApp = async (app: {
  electronApp: ElectronApplication
  page: Page
  userDataDir: string
}) => {
  await app.electronApp.close().catch(() => {})
  await rm(app.userDataDir, { force: true, recursive: true })
}
