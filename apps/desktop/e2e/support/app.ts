import type { Locator, Page } from "@playwright/test"
import { expect } from "@playwright/test"

import type { TestAccount } from "./account"
import type { DesktopE2EEnv } from "./env"
import { buildWebAppURL } from "./env"

const ONBOARDING_FEED_URL = "folo://onboarding"

const isVisible = async (locator: Locator) => locator.isVisible().catch(() => false)
const visibleByTestId = (page: Page, testId: string) =>
  page.locator(`[data-testid="${testId}"]:visible`).last()

export const injectRecaptchaToken = async (page: Page, env?: DesktopE2EEnv) => {
  await page.addInitScript(
    (nextEnv) => {
      window.__FOLO_E2E_RECAPTCHA_TOKEN__ = "e2e-token"

      if (!nextEnv) {
        return
      }

      const fixedEnv = {
        VITE_API_URL: nextEnv.apiURL,
        VITE_EXTERNAL_API_URL: nextEnv.apiURL,
        VITE_WEB_URL: nextEnv.webURL,
      }

      const target =
        (globalThis as typeof globalThis & { __followEnv?: Record<string, string> }).__followEnv ??
        {}

      const proxy = new Proxy(target, {
        get(currentTarget, property, receiver) {
          if (typeof property === "string" && property in fixedEnv) {
            return fixedEnv[property as keyof typeof fixedEnv]
          }

          return Reflect.get(currentTarget, property, receiver)
        },
        set(currentTarget, property, value, receiver) {
          if (typeof property === "string" && property in fixedEnv) {
            return true
          }

          return Reflect.set(currentTarget, property, value, receiver)
        },
        ownKeys(currentTarget) {
          return Array.from(new Set([...Reflect.ownKeys(currentTarget), ...Object.keys(fixedEnv)]))
        },
        getOwnPropertyDescriptor(currentTarget, property) {
          if (typeof property === "string" && property in fixedEnv) {
            return {
              configurable: true,
              enumerable: true,
              writable: false,
              value: fixedEnv[property as keyof typeof fixedEnv],
            }
          }

          return Reflect.getOwnPropertyDescriptor(currentTarget, property)
        },
      })

      Object.defineProperty(globalThis, "__followEnv", {
        configurable: true,
        enumerable: false,
        get() {
          return proxy
        },
        set() {},
      })
    },
    env ? { apiURL: env.apiURL, webURL: env.webURL } : undefined,
  )
}

export const openWebApp = async (page: Page, env: DesktopE2EEnv, route = "/") => {
  await injectRecaptchaToken(page, env)
  await page.goto(buildWebAppURL(env, route), { waitUntil: "domcontentloaded" })
}

export const waitForAuthenticated = async (page: Page) => {
  const isAuthenticatedUiReady = async () => {
    const profileVisible = await page
      .getByTestId("profile-menu-trigger")
      .isVisible()
      .catch(() => false)
    const loginModalVisible = await page
      .getByTestId("login-modal")
      .isVisible()
      .catch(() => false)

    return profileVisible && !loginModalVisible
  }

  await expect.poll(isAuthenticatedUiReady, { timeout: 30_000 }).toBe(true)
}

export const waitForLoggedOut = async (page: Page) => {
  await expect
    .poll(
      async () => {
        const loginButtonVisible = await page
          .getByTestId("login-button")
          .last()
          .isVisible()
          .catch(() => false)
        const loginModalVisible = await page
          .getByTestId("login-modal")
          .last()
          .isVisible()
          .catch(() => false)
        const loginInputVisible = await page
          .getByTestId("login-email-input")
          .last()
          .isVisible()
          .catch(() => false)
        const registerInputVisible = await page
          .getByTestId("register-email-input")
          .last()
          .isVisible()
          .catch(() => false)

        return loginButtonVisible || loginModalVisible || loginInputVisible || registerInputVisible
      },
      { timeout: 30_000 },
    )
    .toBe(true)
}

export const ensureLoginModal = async (page: Page) => {
  await expect
    .poll(
      async () => {
        const loginModalVisible = await page
          .getByTestId("login-modal")
          .last()
          .isVisible()
          .catch(() => false)
        const loginButtonVisible = await page
          .getByTestId("login-button")
          .last()
          .isVisible()
          .catch(() => false)
        const loginInputVisible = await page
          .getByTestId("login-email-input")
          .last()
          .isVisible()
          .catch(() => false)
        const registerInputVisible = await page
          .getByTestId("register-email-input")
          .last()
          .isVisible()
          .catch(() => false)

        return loginModalVisible || loginButtonVisible || loginInputVisible || registerInputVisible
      },
      { timeout: 30_000 },
    )
    .toBe(true)
}

const ensureCredentialForm = async (page: Page, mode: "register" | "login") => {
  await ensureLoginModal(page)

  const targetInput = visibleByTestId(
    page,
    mode === "register" ? "register-email-input" : "login-email-input",
  )
  const loginButton = visibleByTestId(page, "login-button")
  const loginModal = visibleByTestId(page, "login-modal")
  const activeDialog = page.locator('[role="dialog"]:visible').last()
  const credentialProvider = visibleByTestId(page, "login-provider-credential")
  const targetForm = visibleByTestId(page, mode === "register" ? "register-form" : "login-form")
  const oppositeForm = visibleByTestId(page, mode === "register" ? "login-form" : "register-form")
  const oppositeFormSwitcher = visibleByTestId(
    page,
    mode === "register" ? "login-switch-register" : "register-switch-login",
  )

  if (await isVisible(targetInput)) {
    return
  }

  if (
    (await isVisible(loginButton)) &&
    !(await isVisible(loginModal)) &&
    !(await isVisible(activeDialog))
  ) {
    await expect(loginButton).toBeVisible({ timeout: 30_000 })
    await loginButton.click({ noWaitAfter: true })
  }

  if (await isVisible(targetInput)) {
    return
  }

  if (!(await isVisible(targetForm)) && !(await isVisible(oppositeForm))) {
    await expect(credentialProvider).toBeVisible({ timeout: 30_000 })
    await credentialProvider.click({ timeout: 30_000, noWaitAfter: true })
    await expect
      .poll(async () => (await isVisible(targetForm)) || (await isVisible(oppositeForm)), {
        timeout: 30_000,
      })
      .toBe(true)
  }

  if (await isVisible(oppositeForm)) {
    await expect(oppositeFormSwitcher).toBeVisible({ timeout: 30_000 })
    await oppositeFormSwitcher.click({ timeout: 30_000, noWaitAfter: true })
  }

  await expect(targetInput).toBeVisible({ timeout: 30_000 })
}

export const registerWithCredential = async (page: Page, account: TestAccount) => {
  await ensureCredentialForm(page, "register")
  await visibleByTestId(page, "register-email-input").fill(account.email)
  await visibleByTestId(page, "register-password-input").fill(account.password)
  const confirmPasswordInput = visibleByTestId(page, "register-confirm-password-input")
  await confirmPasswordInput.fill(account.password)
  const submit = visibleByTestId(page, "register-submit")
  await expect(submit).toBeEnabled({ timeout: 30_000 })

  await submit.click()
  await waitForAuthenticated(page)
}

export const loginWithCredential = async (page: Page, account: TestAccount) => {
  await ensureCredentialForm(page, "login")
  await visibleByTestId(page, "login-email-input").fill(account.email)
  const passwordInput = visibleByTestId(page, "login-password-input")
  await passwordInput.fill(account.password)
  const submit = visibleByTestId(page, "login-submit")
  await expect(submit).toBeEnabled({ timeout: 30_000 })

  await submit.click()
  await waitForAuthenticated(page)
}

export const logoutFromProfileMenu = async (page: Page) => {
  await page.keyboard.press("Escape").catch(() => {})
  if (page.url().startsWith("app://")) {
    await returnToMainShell(page)
  }
  await page.getByTestId("profile-menu-trigger").click()

  const signOutResponse = page
    .waitForResponse(
      (response) =>
        response.request().method() === "POST" && response.url().includes("/better-auth/sign-out"),
      { timeout: 30_000 },
    )
    .catch(() => null)

  await page.getByTestId("profile-menu-logout").click()
  await signOutResponse
  await waitForLoggedOut(page)
}

const waitForMainShell = async (page: Page) => {
  await expect
    .poll(
      async () => {
        const profileVisible = await page
          .getByTestId("profile-menu-trigger")
          .isVisible()
          .catch(() => false)
        const timelineVisible = await page
          .getByTestId("timeline-tab-articles")
          .isVisible()
          .catch(() => false)

        return profileVisible || timelineVisible
      },
      { timeout: 30_000 },
    )
    .toBe(true)
}

const returnToMainShell = async (page: Page) => {
  const discoverInput = page.getByTestId("discover-form-input")
  if (await discoverInput.isVisible().catch(() => false)) {
    const backButton = page.getByTestId("subview-back")

    if (await backButton.isVisible().catch(() => false)) {
      await backButton.click()
    } else {
      await page.keyboard.press("Escape").catch(() => {})
    }

    if (await discoverInput.isVisible().catch(() => false)) {
      await page.keyboard.press("Escape").catch(() => {})
    }

    await expect
      .poll(async () => discoverInput.isVisible().catch(() => false), { timeout: 15_000 })
      .toBe(false)
  }

  await waitForMainShell(page)

  const activeDialog = page.locator('[role="dialog"]:visible').last()
  if (await activeDialog.isVisible().catch(() => false)) {
    await page.keyboard.press("Escape").catch(() => {})

    if (await activeDialog.isVisible().catch(() => false)) {
      const modalClose = activeDialog.getByTestId("modal-close").first()
      if (await modalClose.isVisible().catch(() => false)) {
        await modalClose.click().catch(() => {})
      }
    }

    await expect
      .poll(async () => activeDialog.isVisible().catch(() => false), { timeout: 10_000 })
      .toBe(false)
  }
}

const waitForSettingsTabContent = async (page: Page, tab: "general" | "feeds") => {
  if (tab === "general") {
    await expect(page.getByTestId("settings-language-select")).toBeVisible({ timeout: 15_000 })
    return
  }

  await expect
    .poll(async () => page.locator('[data-testid^="settings-feed-row-"]').count(), {
      timeout: 15_000,
    })
    .toBeGreaterThan(0)
}

export const openSettings = async (page: Page, tab: "general" | "feeds" = "general") => {
  await waitForAuthenticated(page)

  const settingsModal = page.locator("#setting-modal").first()

  const openSettingsFromMenu = async () => {
    await returnToMainShell(page)
    const profileTrigger = page.getByTestId("profile-menu-trigger")
    await expect(profileTrigger).toBeVisible({ timeout: 15_000 })
    await profileTrigger.click()

    const preferencesItem = page.getByTestId("profile-menu-preferences")
    await expect(preferencesItem).toBeVisible({ timeout: 15_000 })
    await preferencesItem.click()

    await expect(settingsModal).toBeVisible({ timeout: 15_000 })
  }

  if (!(await settingsModal.isVisible().catch(() => false))) {
    try {
      await openSettingsFromMenu()
    } catch {
      await openSettingsFromMenu()
    }
  }

  await openSettingsTab(page, tab)
}

export const openSettingsTab = async (page: Page, tab: "general" | "feeds") => {
  const settingsTab = page.getByTestId(`settings-tab-${tab}`)
  await expect(settingsTab).toBeVisible({ timeout: 15_000 })

  if (tab === "feeds") {
    await expect
      .poll(
        async () => {
          const className = (await settingsTab.getAttribute("class")) ?? ""
          return !className.includes("opacity-50")
        },
        { timeout: 15_000 },
      )
      .toBe(true)
  }

  await settingsTab.click()
  await waitForSettingsTabContent(page, tab)
}

export const closeSettings = async (page: Page) => {
  const settingsModal = page.locator("#setting-modal").first()
  if (!(await settingsModal.isVisible().catch(() => false))) {
    return
  }

  await page.keyboard.press("Escape").catch(() => {})

  if (await settingsModal.isVisible().catch(() => false)) {
    const modalClose = settingsModal.getByTestId("modal-close").first()
    if (await isVisible(modalClose)) {
      await modalClose.click().catch(() => {})
    }
  }

  await expect
    .poll(async () => settingsModal.isVisible().catch(() => false), { timeout: 10_000 })
    .toBe(false)
}

export const setLanguage = async (page: Page, label: string) => {
  await page.getByTestId("settings-language-select").click()
  await page.getByRole("option", { name: label }).click()
}

export const getLanguageLabel = async (page: Page) => {
  return page.getByTestId("settings-language-select").textContent()
}

export const openOnboardingFeedForm = async (
  page: Page,
  _env?: DesktopE2EEnv,
  _options?: { electron?: boolean },
) => {
  const discoverInput = page.getByTestId("discover-form-input")
  if (!(await discoverInput.isVisible().catch(() => false))) {
    await returnToMainShell(page)
    const discoverTrigger = page.getByTestId("subscription-discover-trigger")
    await expect(discoverTrigger).toBeVisible({ timeout: 15_000 })
    await discoverTrigger.click()
  }

  await expect(discoverInput).toBeVisible({ timeout: 15_000 })
  await discoverInput.fill(ONBOARDING_FEED_URL)
  await discoverInput.press("Enter")
  await expect(page.getByText("Welcome to Folo").first()).toBeVisible({ timeout: 15_000 })
}

export const followOnboardingFeed = async (
  page: Page,
  env: DesktopE2EEnv,
  options?: { electron?: boolean },
) => {
  await openOnboardingFeedForm(page, env, options)
  const onboardingDiscoverCard = page
    .locator("[data-feed-id]")
    .filter({ hasText: "Welcome to Folo" })
    .first()
  const followButton = onboardingDiscoverCard.getByRole("button", { name: /^Follow$/i })
  if (await followButton.isVisible().catch(() => false)) {
    await expect(followButton).toBeEnabled({ timeout: 15_000 })
    await followButton.click()
  }
  await expect(page.getByText("Welcome to Folo").first()).toBeVisible({ timeout: 15_000 })
}

export const dismissFeedForm = async (page: Page) => {
  const cancelButton = visibleByTestId(page, "feed-form-cancel")
  const dialog = page.locator('[role="dialog"]').last()

  if (!(await cancelButton.isVisible().catch(() => false))) {
    if (await dialog.isVisible().catch(() => false)) {
      await page.keyboard.press("Escape").catch(() => {})
    }
    return
  }

  await cancelButton.click()

  if (
    (await cancelButton.isVisible().catch(() => false)) ||
    (await dialog.isVisible().catch(() => false))
  ) {
    await page.keyboard.press("Escape").catch(() => {})
  }
}

const findSettingsFeedRow = async (page: Page, onboardingFeedId: string | null) => {
  const targetedFeedRow = onboardingFeedId
    ? page.getByTestId(`settings-feed-row-${onboardingFeedId}`)
    : null
  const fallbackFeedRow = page
    .locator('[data-testid^="settings-feed-row-"]')
    .filter({
      hasText: "Welcome to Folo",
    })
    .first()
  const settingsViewport = page.locator("#setting-modal [data-radix-scroll-area-viewport]").first()

  await settingsViewport
    .evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.scrollTop = 0
      }
    })
    .catch(() => {})

  for (let attempt = 0; attempt < 24; attempt++) {
    if (targetedFeedRow && (await targetedFeedRow.isVisible().catch(() => false))) {
      return targetedFeedRow
    }

    if (await fallbackFeedRow.isVisible().catch(() => false)) {
      return fallbackFeedRow
    }

    await settingsViewport.hover().catch(() => {})
    await page.mouse.wheel(0, 1200)
    await page.waitForTimeout(150)
  }

  return targetedFeedRow && (await targetedFeedRow.count()) > 0 ? targetedFeedRow : fallbackFeedRow
}

export const unsubscribeFirstFeedFromSettings = async (page: Page, _env?: DesktopE2EEnv) => {
  const onboardingFeedItem = page
    .locator("[data-feed-id]")
    .filter({
      hasText: "Welcome to Folo",
    })
    .first()
  const onboardingFeedId =
    (await onboardingFeedItem.count()) > 0
      ? await onboardingFeedItem.getAttribute("data-feed-id")
      : null

  await openSettings(page)
  await openSettingsTab(page, "feeds")
  const feedRow = await findSettingsFeedRow(page, onboardingFeedId)

  await expect(feedRow).toBeVisible({ timeout: 15_000 })
  await feedRow.scrollIntoViewIfNeeded().catch(() => {})
  const feedRowTestId = await feedRow.getAttribute("data-testid")
  await feedRow.click()

  const unsubscribeButton = page.getByTestId("feeds-batch-unsubscribe")
  await expect(unsubscribeButton).toBeVisible({ timeout: 15_000 })
  await unsubscribeButton.click()
  await page.getByTestId("confirm-destroy").click()

  if (feedRowTestId) {
    await expect(page.getByTestId(feedRowTestId)).toHaveCount(0, { timeout: 15_000 })
  } else {
    await expect(feedRow).toHaveCount(0, { timeout: 15_000 })
  }
}

export const expectOnboardingFeedUnsubscribed = async (
  page: Page,
  _env?: DesktopE2EEnv,
  _options?: { electron?: boolean },
) => {
  await openOnboardingFeedForm(page)
  await expect(page.getByTestId("feed-form-cancel")).toHaveCount(0)
}

export const expectTimelineSwitchAndEntryReadFlow = async (page: Page) => {
  await returnToMainShell(page)

  await page.getByTestId("timeline-tab-videos").click()
  await expect.poll(async () => page.locator("[data-entry-id]").count()).toBe(0)

  await page.getByTestId("timeline-tab-articles").click()
  await expect.poll(async () => page.locator("[data-entry-id]").count()).toBeGreaterThan(0)

  const unreadOnboardingEntry = page
    .locator('[data-entry-id][data-read="false"]:visible')
    .filter({ has: page.locator("a[href]") })
    .first()
  await expect(unreadOnboardingEntry).toBeVisible({ timeout: 15_000 })

  const onboardingEntryId = await unreadOnboardingEntry.getAttribute("data-entry-id")
  expect(onboardingEntryId).toBeTruthy()

  const onboardingEntry = page.locator(`[data-entry-id="${onboardingEntryId}"]`)
  const onboardingEntryLink = unreadOnboardingEntry.locator("a[href]").first()

  await unreadOnboardingEntry.scrollIntoViewIfNeeded().catch(() => {})
  await expect(onboardingEntryLink).toBeVisible({ timeout: 15_000 })
  await onboardingEntryLink.click()

  const entryRender = page.getByTestId("entry-render")
  await expect(entryRender).toBeVisible({ timeout: 15_000 })
  await expect(onboardingEntry).toHaveAttribute("data-active", "true", { timeout: 15_000 })
  await expect(onboardingEntry).toHaveAttribute("data-read", "true", { timeout: 15_000 })

  const toggleReadButton = page.getByTestId("command-action-entry-read").last()
  await expect(toggleReadButton).toBeVisible({ timeout: 15_000 })
  await expect(toggleReadButton).toBeEnabled({ timeout: 15_000 })

  await toggleReadButton.click()
  await expect(onboardingEntry).toHaveAttribute("data-read", "false", { timeout: 15_000 })

  await toggleReadButton.click()
  await expect(onboardingEntry).toHaveAttribute("data-read", "true", { timeout: 15_000 })
}
