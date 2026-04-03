import { mkdir } from "node:fs/promises"

import { chromium } from "@playwright/test"
import { join } from "pathe"

import { createTestAccount, tryDeleteCurrentUser } from "../support/account"
import {
  closeSettings,
  dismissFeedForm,
  followOnboardingFeed,
  openSettings,
  openWebApp,
} from "../support/app"
import { bootstrapAuthenticatedWebSession } from "../support/auth-bootstrap"
import { buildWebAppURL, resolveDesktopE2EEnv } from "../support/env"

const SETTING_TABS = [
  "general",
  "appearance",
  "notifications",
  "shortcuts",
  "ai",
  "integration",
  "feeds",
  "list",
  "profile",
  "data-control",
  "cli",
  "plan",
  "about",
] as const

const SUBVIEW_ROUTES = ["discover", "power", "action", "rsshub", "ai"] as const

const waitForUiSettled = async (page: import("@playwright/test").Page, delay = 1200) => {
  await page.waitForLoadState("domcontentloaded")
  await page.waitForTimeout(delay)
}

const waitForRouteReady = async (
  page: import("@playwright/test").Page,
  route: (typeof SUBVIEW_ROUTES)[number],
) => {
  await waitForUiSettled(page, route === "power" ? 3500 : 1200)

  if (route === "power") {
    await page
      .waitForFunction(
        () =>
          document.body.textContent?.includes("Your Balance") ||
          document.body.textContent?.includes("Transactions") ||
          document.body.textContent?.includes("Create Wallet"),
        undefined,
        { timeout: 15_000 },
      )
      .catch(() => {})
  }
}

async function main() {
  const env = resolveDesktopE2EEnv()
  const outputDir = join(
    env.desktopAppDir,
    "e2e",
    "artifacts",
    "ui-audit",
    `run-${new Date().toISOString().replaceAll(":", "-")}`,
  )

  await mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: ["--disable-web-security"],
  })

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: {
      width: 1440,
      height: 980,
    },
    colorScheme: "light",
  })

  let page = await context.newPage()
  const account = createTestAccount("ui-audit")

  let screenshotIndex = 1
  const capture = async (name: string) => {
    const path = join(outputDir, `${String(screenshotIndex).padStart(2, "0")}-${name}.png`)
    screenshotIndex += 1
    await page.screenshot({ path, fullPage: false })
    console.info(path)
  }

  const bootstrapAccount = async () => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await bootstrapAuthenticatedWebSession(page, env, account)
        return
      } catch (error) {
        await capture(`auth-bootstrap-attempt-${attempt}-failed`)
        if (attempt === 3) {
          throw error
        }

        await page.goto(buildWebAppURL(env, "/"), { waitUntil: "domcontentloaded" })
        await waitForUiSettled(page)
      }
    }
  }

  try {
    await openWebApp(page, env)
    await waitForUiSettled(page)
    await capture("00-login-modal")
    await page.close()
    page = await context.newPage()

    await bootstrapAccount()
    await waitForUiSettled(page)
    await capture("01-home-articles")

    await followOnboardingFeed(page, env)
    await waitForUiSettled(page)
    await capture("02-discover-follow")
    await dismissFeedForm(page)

    const timelineTabs = await page.locator('[data-testid^="timeline-tab-"]').all()
    for (const tab of timelineTabs) {
      const testId = await tab.getAttribute("data-testid")
      if (!testId) continue
      await tab.click()
      await waitForUiSettled(page)
      await capture(`timeline-${testId.replace("timeline-tab-", "")}`)
    }

    for (const route of SUBVIEW_ROUTES) {
      await page.goto(buildWebAppURL(env, route), { waitUntil: "domcontentloaded" })
      await waitForRouteReady(page, route)
      await capture(`subview-${route}`)
    }

    await page.goto(buildWebAppURL(env, "/"), { waitUntil: "domcontentloaded" })
    await waitForUiSettled(page)

    await openSettings(page)
    await waitForUiSettled(page)

    for (const tab of SETTING_TABS) {
      if (tab === "general") {
        await capture("settings-general")
        continue
      }

      const tabTrigger = page.getByTestId(`settings-tab-${tab}`)
      if (!(await tabTrigger.isVisible().catch(() => false))) {
        continue
      }

      await tabTrigger.click()
      await waitForUiSettled(page)
      await capture(`settings-${tab}`)
    }

    await closeSettings(page)
    await waitForUiSettled(page)
    await capture("home-after-settings")
  } finally {
    await tryDeleteCurrentUser(page, env).catch(() => null)
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

void main()
