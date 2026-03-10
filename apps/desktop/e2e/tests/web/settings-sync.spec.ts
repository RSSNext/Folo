import type { BrowserContext } from "@playwright/test"
import { expect, test } from "@playwright/test"

import { createTestAccount, tryDeleteCurrentUser } from "../../support/account"
import {
  getLanguageLabel,
  loginWithCredential,
  openSettings,
  openWebApp,
  registerWithCredential,
  setLanguage,
} from "../../support/app"
import { resolveDesktopE2EEnv } from "../../support/env"

const closeContextSafely = async (context: BrowserContext) => {
  try {
    await context.close()
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return
    }

    throw error
  }
}

test.describe("web multi-session sync", () => {
  test("syncs settings between two browser sessions", async ({ browser }) => {
    test.setTimeout(180_000)

    const env = resolveDesktopE2EEnv()
    const account = createTestAccount("web-sync")

    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      await openWebApp(pageA, env)
      await registerWithCredential(pageA, account)

      await openWebApp(pageB, env)
      await loginWithCredential(pageB, account)

      await openSettings(pageA)
      await openSettings(pageB)

      await test.step("session A change syncs to session B", async () => {
        await setLanguage(pageA, "日本語")
        await expect
          .poll(
            async () => {
              await pageB.reload({ waitUntil: "domcontentloaded" })
              await openSettings(pageB)
              return getLanguageLabel(pageB)
            },
            { timeout: 30_000 },
          )
          .toContain("日本語")
      })

      await test.step("session B change syncs back to session A", async () => {
        await setLanguage(pageB, "English")
        await expect
          .poll(
            async () => {
              await pageA.reload({ waitUntil: "domcontentloaded" })
              await openSettings(pageA)
              return getLanguageLabel(pageA)
            },
            { timeout: 30_000 },
          )
          .toContain("English")
      })

      const cleanup = await tryDeleteCurrentUser(pageA, env)
      expect(cleanup.status).toBeGreaterThanOrEqual(-1)
      test.info().annotations.push({
        type: "cleanup",
        description: `delete-user-custom status=${cleanup.status}`,
      })
    } finally {
      await closeContextSafely(contextA)
      await closeContextSafely(contextB)
    }
  })
})
