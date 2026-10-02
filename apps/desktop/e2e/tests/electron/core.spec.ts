import { expect, test } from "@playwright/test"

import { createTestAccount, tryDeleteCurrentUser } from "../../support/account"
import {
  dismissFeedForm,
  expectTimelineSwitchAndEntryReadFlow,
  followOnboardingFeed,
  loginWithCredential,
  logoutFromProfileMenu,
  registerWithCredential,
  unsubscribeFirstFeedFromSettings,
} from "../../support/app"
import { closeElectronApp, launchElectronApp } from "../../support/electron"
import { resolveDesktopE2EEnv } from "../../support/env"

test.describe("electron core flows", () => {
  test("covers registration, login, follow, unfollow, timeline and read state", async () => {
    test.setTimeout(240_000)

    const env = resolveDesktopE2EEnv()
    const account = createTestAccount("electron-core")
    let electronApp = await launchElectronApp(env)

    try {
      await test.step("loads the preload bridge and uses the native clipboard", async () => {
        expect(await electronApp.page.evaluate(() => Boolean(window.electron?.ipcRenderer))).toBe(
          true,
        )
        const result = await electronApp.electronApp.evaluate(
          async ({ app, BrowserWindow, clipboard, ClipboardItem }) => {
            // Read handles are lazy snapshots and cannot be passed back to write().
            // Materialize every format before changing the operating system clipboard.
            const saved = await Promise.all(
              (await clipboard.read())
                .filter((item) => item.types.length > 0)
                .map(async (item) => {
                  const entries = await Promise.all(
                    item.types.map(async (type) => [type, await item.getType(type)] as const),
                  )
                  return new ClipboardItem(Object.fromEntries(entries))
                }),
            )
            try {
              const window = BrowserWindow.getAllWindows()[0]!
              window.focus()
              app.focus({ steal: true })
              await window.webContents.executeJavaScript(
                'navigator.clipboard.writeText("Folo dependency upgrade clipboard 中文")',
                true,
              )
              // The renderer and the main process receive OS clipboard changes
              // independently, so wait for the cross-process observation.
              let text = ""
              for (let attempt = 0; attempt < 100; attempt++) {
                text = await clipboard.readText()
                if (text === "Folo dependency upgrade clipboard 中文") break
                await new Promise((resolve) => setTimeout(resolve, 20))
              }
              await window.webContents.executeJavaScript(
                `(async () => {
                const canvas = document.createElement("canvas")
                canvas.width = canvas.height = 2
                canvas.getContext("2d").fillRect(0, 0, 2, 2)
                const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"))
                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
              })()`,
                true,
              )
              let hasImage = false
              for (let attempt = 0; attempt < 100; attempt++) {
                hasImage = (await clipboard.read()).some((item) => item.types.includes("image/png"))
                if (hasImage) break
                await new Promise((resolve) => setTimeout(resolve, 20))
              }
              return { text, hasImage }
            } finally {
              await clipboard.write(saved)
            }
          },
        )
        expect(result).toEqual({ text: "Folo dependency upgrade clipboard 中文", hasImage: true })
      })

      await test.step("registers a new account", async () => {
        await registerWithCredential(electronApp.page, account)
      })

      await test.step("logs out and logs back in", async () => {
        await logoutFromProfileMenu(electronApp.page)
        await closeElectronApp(electronApp)
        electronApp = await launchElectronApp(env)
        await loginWithCredential(electronApp.page, account)
      })

      await test.step("follows onboarding feed", async () => {
        await followOnboardingFeed(electronApp.page, env)
        await dismissFeedForm(electronApp.page)
      })

      await test.step("switches timeline, opens an entry, and toggles read state", async () => {
        await expectTimelineSwitchAndEntryReadFlow(electronApp.page)
      })

      await test.step("unsubscribes onboarding feed from settings", async () => {
        await unsubscribeFirstFeedFromSettings(electronApp.page)
      })

      const cleanup = await tryDeleteCurrentUser(electronApp.page, env)
      expect(cleanup.status).toBeGreaterThanOrEqual(-1)
      test.info().annotations.push({
        type: "cleanup",
        description: `delete-user-custom status=${cleanup.status}`,
      })
    } finally {
      await closeElectronApp(electronApp)
    }
  })
})
