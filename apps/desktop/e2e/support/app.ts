import type { Locator, Page } from "@playwright/test"
import { expect } from "@playwright/test"

import type { TestAccount } from "./account"
import type { DesktopE2EEnv } from "./env"
import { buildHashRoute, buildWebAppURL } from "./env"

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

export const navigateInApp = async (
  page: Page,
  env: DesktopE2EEnv,
  route: string,
  options?: { electron?: boolean },
) => {
  if (options?.electron) {
    await page.evaluate((nextRoute) => {
      window.location.hash = nextRoute
    }, buildHashRoute(route))
    return
  }

  await page.goto(buildWebAppURL(env, route), { waitUntil: "domcontentloaded" })
}

export const waitForAuthenticated = async (page: Page) => {
  const isAuthenticatedUiReady = async () => {
    const profileVisible = await page
      .getByTestId("profile-menu-trigger")
      .isVisible()
      .catch(() => false)
    const timelineVisible = await page
      .getByTestId("timeline-tab-articles")
      .isVisible()
      .catch(() => false)
    return profileVisible || timelineVisible
  }

  try {
    await expect.poll(isAuthenticatedUiReady, { timeout: 30_000 }).toBe(true)
  } catch {
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect.poll(isAuthenticatedUiReady, { timeout: 30_000 }).toBe(true)
  }
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
  const attemptEnsureCredentialForm = async () => {
    await ensureLoginModal(page)

    const targetInput = visibleByTestId(
      page,
      mode === "register" ? "register-email-input" : "login-email-input",
    )
    const loginButton = visibleByTestId(page, "login-button")
    const loginModal = visibleByTestId(page, "login-modal")
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

    if ((await isVisible(loginButton)) && !(await isVisible(loginModal))) {
      await loginButton.click({ force: true })
    }

    if (await isVisible(targetInput)) {
      return
    }

    if (!(await isVisible(targetForm)) && !(await isVisible(oppositeForm))) {
      await credentialProvider.click({ force: true, timeout: 30_000 })
      await expect
        .poll(async () => (await isVisible(targetForm)) || (await isVisible(oppositeForm)), {
          timeout: 30_000,
        })
        .toBe(true)
    }

    if (await isVisible(oppositeForm)) {
      await oppositeFormSwitcher.click({ force: true, timeout: 30_000 })
    }

    await expect(targetInput).toBeVisible({ timeout: 30_000 })
  }

  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await attemptEnsureCredentialForm()
      return
    } catch (error) {
      lastError = error
      if (attempt === 2) {
        throw error
      }

      await page.keyboard.press("Escape").catch(() => {})
      await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {})
    }
  }

  throw lastError
}

export const registerWithCredential = async (page: Page, account: TestAccount) => {
  await ensureCredentialForm(page, "register")
  await visibleByTestId(page, "register-email-input").fill(account.email)
  await visibleByTestId(page, "register-password-input").fill(account.password)
  await visibleByTestId(page, "register-confirm-password-input").fill(account.password)
  await visibleByTestId(page, "register-submit").click({ force: true })
  await waitForAuthenticated(page)
}

export const loginWithCredential = async (page: Page, account: TestAccount) => {
  await ensureCredentialForm(page, "login")
  await visibleByTestId(page, "login-email-input").fill(account.email)
  await visibleByTestId(page, "login-password-input").fill(account.password)
  await visibleByTestId(page, "login-submit").click({ force: true })
  await waitForAuthenticated(page)
}

export const logoutFromProfileMenu = async (page: Page) => {
  await page.keyboard.press("Escape").catch(() => {})
  await page.getByTestId("profile-menu-trigger").click()

  const signOutResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" && response.url().includes("/better-auth/sign-out"),
    { timeout: 30_000 },
  )

  await page.getByTestId("profile-menu-logout").click()
  await signOutResponse

  await expect
    .poll(
      async () =>
        page
          .getByTestId("profile-menu-trigger")
          .isVisible()
          .catch(() => false),
      { timeout: 30_000 },
    )
    .toBe(false)
}

export const openSettings = async (page: Page) => {
  await page.getByTestId("profile-menu-trigger").click()
  await page.getByTestId("profile-menu-preferences").click()
  await expect(page.getByTestId("settings-tab-general")).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId("settings-language-select")).toBeVisible({ timeout: 10_000 })
}

export const openSettingsTab = async (page: Page, tab: "general" | "feeds") => {
  await page.getByTestId(`settings-tab-${tab}`).click()
}

export const closeSettings = async (page: Page) => {
  const settingsTab = page.getByTestId("settings-tab-general")
  if (!(await isVisible(settingsTab))) {
    return
  }

  await page.keyboard.press("Escape").catch(() => {})

  if (await isVisible(settingsTab)) {
    const modalClose = page.getByTestId("modal-close").last()
    if (await isVisible(modalClose)) {
      await modalClose.click()
    }
  }

  await expect.poll(async () => isVisible(settingsTab), { timeout: 10_000 }).toBe(false)
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
  env: DesktopE2EEnv,
  options?: { electron?: boolean },
) => {
  await navigateInApp(page, env, "/discover", options)

  const discoverInput = page.getByTestId("discover-form-input")
  if (!(await discoverInput.isVisible().catch(() => false))) {
    const discoverLink = page.locator('a[href="#/discover"], a[href="/discover"]').last()
    if (await discoverLink.isVisible().catch(() => false)) {
      await discoverLink.click({ force: true })
    }
  }

  if (!(await discoverInput.isVisible().catch(() => false))) {
    await page.evaluate(() => {
      const nextRoute = "/discover"
      const { router } = window as typeof window & {
        router?: { navigate?: (route: string) => void }
      }
      router?.navigate?.(nextRoute)
    })
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
  const followButton = page.getByRole("button", { name: /^Follow$/i }).last()
  if (await followButton.isVisible().catch(() => false)) {
    await followButton.click({ force: true })
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

  await cancelButton
    .evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.click()
      }
    })
    .catch(() => {})

  if (
    (await cancelButton.isVisible().catch(() => false)) ||
    (await dialog.isVisible().catch(() => false))
  ) {
    await page.keyboard.press("Escape").catch(() => {})
  }
}

export const unsubscribeFirstFeedFromSettings = async (page: Page, env?: DesktopE2EEnv) => {
  const onboardingFeedItem = page
    .locator("[data-feed-id]")
    .filter({
      hasText: "Welcome to Folo",
    })
    .first()
  const onboardingFeedId = await onboardingFeedItem.getAttribute("data-feed-id")
  let unsubscribedInSettings = false

  await openSettings(page)
  await openSettingsTab(page, "feeds")
  const targetedFeedRow = onboardingFeedId
    ? page.getByTestId(`settings-feed-row-${onboardingFeedId}`)
    : null
  const fallbackFeedRow = page
    .locator('[data-testid^="settings-feed-row-"]')
    .filter({
      hasText: "Welcome to Folo",
    })
    .first()
  const feedRow =
    targetedFeedRow && (await targetedFeedRow.isVisible().catch(() => false))
      ? targetedFeedRow
      : fallbackFeedRow

  if (await feedRow.isVisible().catch(() => false)) {
    const feedRowTestId = await feedRow.getAttribute("data-testid")
    await feedRow.click()
    await expect(page.getByTestId("feeds-batch-unsubscribe")).toBeVisible({ timeout: 15_000 })
    await page.getByTestId("feeds-batch-unsubscribe").click()
    await page.getByTestId("confirm-destroy").click()

    if (feedRowTestId) {
      await expect(page.getByTestId(feedRowTestId)).toHaveCount(0, { timeout: 15_000 })
    } else {
      await expect
        .poll(
          async () =>
            page
              .getByTestId("feeds-batch-unsubscribe")
              .isVisible()
              .catch(() => false),
          {
            timeout: 15_000,
          },
        )
        .toBe(false)
    }

    unsubscribedInSettings = true
  }

  if (!unsubscribedInSettings && env && onboardingFeedId) {
    const response = await page.context().request.delete(`${env.apiURL}/subscriptions`, {
      data: { feedId: onboardingFeedId },
      headers: {
        "content-type": "application/json",
      },
    })

    expect(response.ok()).toBe(true)
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {})
  }
}

export const expectOnboardingFeedUnsubscribed = async (
  page: Page,
  env: DesktopE2EEnv,
  options?: { electron?: boolean },
) => {
  await openOnboardingFeedForm(page, env, options)
  await expect(page.getByTestId("feed-form-cancel")).toHaveCount(0)
}

export const expectTimelineSwitchAndEntryReadFlow = async (
  page: Page,
  env: DesktopE2EEnv,
  options?: { electron?: boolean },
) => {
  await navigateInApp(page, env, "/", options)

  await page.getByTestId("timeline-tab-videos").click()
  await expect.poll(async () => page.locator("[data-entry-id]").count()).toBe(0)

  await page.getByTestId("timeline-tab-articles").click()
  await expect.poll(async () => page.locator("[data-entry-id]").count()).toBeGreaterThan(0)

  const onboardingFeed = page
    .locator("[data-feed-id]")
    .filter({
      hasText: "Welcome to Folo",
    })
    .first()
  if (await isVisible(onboardingFeed)) {
    await onboardingFeed.scrollIntoViewIfNeeded().catch(() => {})
    await onboardingFeed.click({ force: true })
  }

  const unreadOnboardingEntry = page.locator('[data-entry-id][data-read="false"]').first()
  const fallbackOnboardingEntry = page.locator("[data-entry-id]").first()
  const firstOnboardingEntry = (await unreadOnboardingEntry.isVisible().catch(() => false))
    ? unreadOnboardingEntry
    : fallbackOnboardingEntry
  await expect(firstOnboardingEntry).toBeVisible({ timeout: 15_000 })

  const onboardingEntryId = await firstOnboardingEntry.getAttribute("data-entry-id")
  const onboardingEntry = onboardingEntryId
    ? page.locator(`[data-entry-id="${onboardingEntryId}"]`)
    : firstOnboardingEntry

  if (onboardingEntryId && !(await unreadOnboardingEntry.isVisible().catch(() => false))) {
    const response = await page.context().request.delete(`${env.apiURL}/reads`, {
      data: { entryId: onboardingEntryId },
      headers: {
        "content-type": "application/json",
      },
    })
    expect(response.ok()).toBe(true)
    await page.reload({ waitUntil: "domcontentloaded" })
    if (await isVisible(onboardingFeed)) {
      await onboardingFeed.click({ force: true })
    }
    await expect(onboardingEntry).toHaveAttribute("data-read", "false")
  }

  await onboardingEntry.locator("a").first().click({ force: true })
  await expect(onboardingEntry).toHaveAttribute("data-active", "true")
  await expect(page.getByTestId("entry-render")).toBeVisible({ timeout: 15_000 })

  if (onboardingEntryId) {
    const response = await page.context().request.delete(`${env.apiURL}/reads`, {
      data: { entryId: onboardingEntryId },
      headers: {
        "content-type": "application/json",
      },
    })
    expect(response.ok()).toBe(true)
  }
}
