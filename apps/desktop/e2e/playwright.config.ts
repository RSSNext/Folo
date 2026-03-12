import { defineConfig, devices } from "@playwright/test"

import { resolveDesktopE2EEnv } from "./support/env"

const env = resolveDesktopE2EEnv()

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL: env.webBaseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command: "pnpm run dev:web",
    cwd: env.desktopAppDir,
    env: {
      ...process.env,
      VITE_API_URL: process.env.FOLO_E2E_WEB_DEV_API_URL ?? env.apiURL,
      VITE_WEB_URL: process.env.FOLO_E2E_WEB_DEV_WEB_URL ?? env.webURL,
    },
    url: env.webDevServerURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "web",
      testMatch: /tests\/web\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        ignoreHTTPSErrors: true,
        launchOptions: {
          args: ["--disable-web-security"],
        },
      },
    },
    {
      name: "electron",
      testMatch: /tests\/electron\/.*\.spec\.ts/,
    },
  ],
})
