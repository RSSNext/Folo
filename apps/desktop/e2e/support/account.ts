import type { Page } from "@playwright/test"

import type { DesktopE2EEnv } from "./env"

export interface TestAccount {
  email: string
  password: string
}

export const createTestAccount = (name: string): TestAccount => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return {
    email: `folo-e2e-${name}-${suffix}@example.com`,
    password: process.env.FOLO_E2E_PASSWORD ?? "Password123!",
  }
}

export const tryDeleteCurrentUser = async (page: Page, env: DesktopE2EEnv) => {
  return page.evaluate(async ({ apiURL }) => {
    try {
      const response = await fetch(`${apiURL}/better-auth/delete-user-custom`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      })

      return {
        ok: response.ok,
        status: response.status,
        text: await response.text(),
      }
    } catch (error) {
      return {
        ok: false,
        status: -1,
        text: error instanceof Error ? error.message : String(error),
      }
    }
  }, env)
}
