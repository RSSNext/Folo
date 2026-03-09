import { expect, test } from "@playwright/test"

import { createTestAccount, tryDeleteCurrentUser } from "../../support/account"
import {
  closeSettings,
  dismissFeedForm,
  expectOnboardingFeedUnsubscribed,
  expectTimelineSwitchAndEntryReadFlow,
  followOnboardingFeed,
  loginWithCredential,
  logoutFromProfileMenu,
  openWebApp,
  registerWithCredential,
  unsubscribeFirstFeedFromSettings,
} from "../../support/app"
import { resolveDesktopE2EEnv } from "../../support/env"

test.describe("web core flows", () => {
  test("covers registration, login, follow, unfollow, timeline and read state", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000)

    const env = resolveDesktopE2EEnv()
    const account = createTestAccount("web-core")
    let activePage = page
    let loginContext: Awaited<ReturnType<typeof browser.newContext>> | null = null

    try {
      await openWebApp(activePage, env)

      await test.step("registers a new account", async () => {
        await registerWithCredential(activePage, account)
      })

      await test.step("follows onboarding feed", async () => {
        await followOnboardingFeed(activePage, env)
        await dismissFeedForm(activePage)
      })

      await test.step("switches timeline, opens an entry, and toggles read state", async () => {
        await expectTimelineSwitchAndEntryReadFlow(activePage, env)
      })

      await test.step("logs out and logs back in", async () => {
        await logoutFromProfileMenu(activePage)

        loginContext = await browser.newContext()
        activePage = await loginContext.newPage()
        await openWebApp(activePage, env)
        await loginWithCredential(activePage, account)
      })

      await test.step("unsubscribes onboarding feed from settings", async () => {
        await unsubscribeFirstFeedFromSettings(activePage, env)
        await closeSettings(activePage)
        await expectOnboardingFeedUnsubscribed(activePage, env)
      })

      await test.step("re-subscribes onboarding feed", async () => {
        await activePage.getByTestId("feed-form-submit").click()
        await expect(activePage.getByTestId("feed-form-cancel")).toBeVisible({ timeout: 15_000 })
        await dismissFeedForm(activePage)
      })

      await test.step("tries to clean up the temporary account", async () => {
        const cleanup = await tryDeleteCurrentUser(activePage, env)
        expect(cleanup.status).toBeGreaterThanOrEqual(-1)
        test.info().annotations.push({
          type: "cleanup",
          description: `delete-user-custom status=${cleanup.status}`,
        })
      })
    } finally {
      await loginContext?.close().catch(() => {})
    }
  })
})
