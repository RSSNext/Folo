import type { BrowserContext, Page } from "@playwright/test"
import { nanoid } from "nanoid"

import type { TestAccount } from "./account"
import { injectRecaptchaToken, waitForAuthenticated } from "./app"
import type { DesktopE2EEnv } from "./env"
import { buildWebAppURL } from "./env"

type AuthBootstrapResponse = {
  token?: string | null
  error?: {
    message?: string
  } | null
}

type ParsedCookie = {
  expires?: number
  httpOnly: boolean
  name: string
  path: string
  sameSite: "Lax" | "None" | "Strict"
  secure: boolean
  value: string
}

const splitSetCookieHeader = (header: string) => {
  const parts: string[] = []
  let buffer = ""

  for (const char of header) {
    if (char === ",") {
      const recent = buffer.toLowerCase()
      const hasExpires = recent.includes("expires=")
      const hasGmt = /gmt/i.test(recent)

      if (hasExpires && !hasGmt) {
        buffer += char
        continue
      }

      if (buffer.trim()) {
        parts.push(buffer.trim())
      }
      buffer = ""
      continue
    }

    buffer += char
  }

  if (buffer.trim()) {
    parts.push(buffer.trim())
  }

  return parts
}

const parseSetCookieHeader = (header: string): ParsedCookie[] => {
  return splitSetCookieHeader(header)
    .map((cookie) => {
      const [nameValue, ...attributes] = cookie.split(";").map((part) => part.trim())
      const [name, ...valueParts] = nameValue?.split("=") ?? []
      if (!name) {
        return null
      }

      const parsedCookie: ParsedCookie = {
        name,
        value: valueParts.join("="),
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      }

      for (const attribute of attributes) {
        const [rawKey, ...rawValueParts] = attribute.split("=")
        const key = rawKey?.toLowerCase()
        const value = rawValueParts.join("=")

        switch (key) {
          case "expires": {
            const expires = new Date(value)
            if (!Number.isNaN(expires.getTime())) {
              parsedCookie.expires = expires.getTime() / 1000
            }
            break
          }
          case "httponly": {
            parsedCookie.httpOnly = true
            break
          }
          case "path": {
            parsedCookie.path = value || "/"
            break
          }
          case "samesite": {
            if (value === "None" || value === "Strict" || value === "Lax") {
              parsedCookie.sameSite = value
            }
            break
          }
          case "secure": {
            parsedCookie.secure = true
            break
          }
        }
      }

      return parsedCookie
    })
    .filter(Boolean)
}

const requestAuth = async ({
  apiURL,
  path,
  body,
}: {
  apiURL: string
  body: Record<string, unknown>
  path: string
}) => {
  const response = await fetch(new URL(path, apiURL), {
    method: "POST",
    headers: {
      "Cache-Control": "no-store",
      "content-type": "application/json",
      "x-app-name": "Folo Web",
      "x-app-platform": "desktop/web",
      "x-app-version": "1.4.0",
      "x-client-id": nanoid(),
      "x-session-id": nanoid(),
      "x-token": "ac:fallback",
    },
    body: JSON.stringify(body),
  })

  return {
    response,
    body: (await response.json().catch(() => null)) as AuthBootstrapResponse | null,
    setCookie: response.headers.get("set-cookie"),
  }
}

const signIn = (env: DesktopE2EEnv, account: TestAccount) =>
  requestAuth({
    apiURL: env.apiURL,
    path: "/better-auth/sign-in/email",
    body: {
      email: account.email,
      password: account.password,
      rememberMe: true,
    },
  })

const signUp = (env: DesktopE2EEnv, account: TestAccount) =>
  requestAuth({
    apiURL: env.apiURL,
    path: "/better-auth/sign-up/email",
    body: {
      email: account.email,
      password: account.password,
      name: account.email.split("@")[0] ?? account.email,
      callbackURL: `${env.webURL}/login`,
    },
  })

const applyCookiesToContext = async (
  context: BrowserContext,
  env: DesktopE2EEnv,
  setCookieHeader: string,
) => {
  const cookies = parseSetCookieHeader(setCookieHeader)
  await context.addCookies(
    cookies.map((cookie) => ({
      url: env.apiURL,
      name: cookie.name,
      value: cookie.value,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expires: cookie.expires,
    })),
  )
}

export const bootstrapAuthenticatedWebSession = async (
  page: Page,
  env: DesktopE2EEnv,
  account: TestAccount,
) => {
  let signInResult = await signIn(env, account)

  if (!signInResult.response.ok || signInResult.body?.error || !signInResult.setCookie) {
    const signUpResult = await signUp(env, account)
    const signUpError = signUpResult.body?.error?.message?.toLowerCase() ?? ""
    const isExistingAccount =
      signUpError.includes("exist") ||
      signUpError.includes("already") ||
      signUpError.includes("taken")

    if ((!signUpResult.response.ok || signUpResult.body?.error) && !isExistingAccount) {
      throw new Error(
        signUpResult.body?.error?.message ||
          signInResult.body?.error?.message ||
          `auth bootstrap failed with ${signUpResult.response.status}`,
      )
    }

    signInResult = await signIn(env, account)
  }

  if (!signInResult.response.ok || signInResult.body?.error || !signInResult.setCookie) {
    throw new Error(
      signInResult.body?.error?.message || `sign in failed with ${signInResult.response.status}`,
    )
  }

  await applyCookiesToContext(page.context(), env, signInResult.setCookie)
  await injectRecaptchaToken(page, env)
  await page.goto(buildWebAppURL(env, "/"), { waitUntil: "domcontentloaded" })
  await waitForAuthenticated(page)
}
